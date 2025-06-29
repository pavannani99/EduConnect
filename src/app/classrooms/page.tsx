"use client"; // To handle state for modal and client-side fetching/mutations

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { ClassroomCard } from '@/components/classroom/ClassroomCard';
import { CreateClassroomForm } from '@/components/classroom/CreateClassroomForm';
import { Button } from '@/components/ui/Button';
import { UserRole, Classroom as PrismaClassroom, User as PrismaUser } from '@prisma/client'; // Import types
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'; // Assuming you have a Dialog component

// Define the expected shape of classroom data, including relations
interface ClassroomWithDetails extends PrismaClassroom {
  owner: Pick<PrismaUser, 'id' | 'name'>;
  _count: { members: number };
}

export default function ClassroomsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classrooms, setClassrooms] = useState<ClassroomWithDetails[]>([]);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedClassroomToJoin, setSelectedClassroomToJoin] = useState<ClassroomWithDetails | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login');
    }

    if (status === 'authenticated' && session?.user?.id) {
      setUserRole(session.user.role as UserRole);
      fetchClassrooms();
    }
  }, [session, status]);

  const fetchClassrooms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/classrooms'); // Uses the new GET endpoint
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch classrooms');
      }
      const data: ClassroomWithDetails[] = await response.json();
      setClassrooms(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinInitiated = (classroomId: string, isPrivate: boolean) => {
    const classroom = classrooms.find(c => c.id === classroomId);
    if (!classroom) return;

    setSelectedClassroomToJoin(classroom);
    setJoinError(null);
    setInviteCode('');
    if (isPrivate) {
      setShowJoinModal(true);
    } else {
      // Directly attempt to join public classroom
      handleConfirmJoin();
    }
  };

  const handleConfirmJoin = async () => {
    if (!selectedClassroomToJoin) return;
    setIsJoining(true);
    setJoinError(null);

    try {
      const response = await fetch(`/api/classrooms/${selectedClassroomToJoin.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedClassroomToJoin.isPrivate ? { inviteCode } : {}),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join classroom.');
      }

      setShowJoinModal(false);
      setSelectedClassroomToJoin(null);
      setInviteCode('');
      // Re-fetch classrooms or update state to reflect membership
      fetchClassrooms();
      // Optionally, navigate to the classroom page: router.push(`/classroom/${selectedClassroomToJoin.id}`);
    } catch (err: any) {
      setJoinError(err.message);
    } finally {
      setIsJoining(false);
    }
  };

  if (status === 'loading' || isLoading && classrooms.length === 0) {
    return <div className="container mx-auto py-8 text-center">Loading classrooms...</div>;
  }

  if (error) {
    return <div className="container mx-auto py-8 text-center text-red-500">Error: {error}</div>;
  }

  const userClassroomIds = classrooms.filter(c => c.members.some((m: any) => m.id === session?.user?.id)).map(c => c.id);


  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Classrooms</h1>
        {userRole && userRole !== UserRole.STUDENT && (
          <Button onClick={() => setShowCreateModal(true)}>
            Create Classroom
          </Button>
        )}
      </div>

      {isLoading && classrooms.length === 0 ? (
         <div className="text-center text-gray-500">Fetching classrooms...</div>
      ) : !isLoading && classrooms.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <h3 className="text-xl font-semibold text-gray-900">No classrooms found</h3>
          <p className="mt-2 text-sm text-gray-500">
            {userRole === UserRole.STUDENT
              ? 'Ask your CR for an invite code or look for public classrooms.'
              : 'Create a new classroom to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {classrooms.map((classroom) => (
            <ClassroomCard
              key={classroom.id}
              classroom={classroom}
              // Check if current user is a member. This assumes `classroom.members` contains user IDs or objects with ID.
              // The GET /api/classrooms needs to be adjusted to include member IDs if it doesn't already.
              // For now, we'll assume `isMember` logic needs to be based on a separate fetch or included data.
              // Let's refine this: we need to know if the session user is in classroom._count.members or similar
              // The prisma query in page.tsx originally fetched this correctly.
              // The new GET /api/classrooms should also provide enough info, or we fetch memberships separately.
              // For simplicity, the `ClassroomCard` receives `isMember` prop.
              // We need to determine `isMember` here.
              isMember={!!classroom.members?.some((member: any) => member.id === session?.user.id) || userClassroomIds.includes(classroom.id)}
              currentUserRole={userRole!}
              onJoinInitiated={handleJoinInitiated}
            />
          ))}
        </div>
      )}

      {/* Create Classroom Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-[425px] md:sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Classroom</DialogTitle>
            <DialogDescription>
              Fill in the details below to create a new classroom.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <CreateClassroomForm />
            {/* Consider passing a onSuccess callback to close modal and refresh list */}
          </div>
        </DialogContent>
      </Dialog>

      {/* Join Private Classroom Modal */}
      {selectedClassroomToJoin && selectedClassroomToJoin.isPrivate && (
         <Dialog open={showJoinModal} onOpenChange={setShowJoinModal}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Join '{selectedClassroomToJoin.name}'</DialogTitle>
                    <DialogDescription>
                        This classroom is private. Please enter the invite code to join.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div>
                        <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700">
                        Invite Code
                        </label>
                        <input
                        type="text"
                        id="inviteCode"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        placeholder="Enter invite code"
                        />
                    </div>
                    {joinError && <p className="text-sm text-red-600">{joinError}</p>}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setShowJoinModal(false)} disabled={isJoining}>
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmJoin} disabled={isJoining || !inviteCode.trim()}>
                        {isJoining ? 'Joining...' : 'Join Classroom'}
                    </Button>
                </DialogFooter>
            </DialogContent>
         </Dialog>
      )}
    </div>
  );
} 