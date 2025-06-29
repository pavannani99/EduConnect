import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { trackUserActivity } from '@/lib/analytics'; // Import analytics tracking
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Assuming Tabs component
import { Button } from '@/components/ui/Button';
// Import other necessary components for displaying classroom details, subjects, notes, etc.
// For example:
// import SubjectList from '@/components/classroom/SubjectList';
// import NoteList from '@/components/classroom/NoteList';
// import MemberList from '@/components/classroom/MemberList';

interface ClassroomPageProps {
  params: {
    id: string;
  };
}

export default async function ClassroomPage({ params }: ClassroomPageProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/auth/login');
  }

  const classroomId = params.id;

  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    include: {
      owner: { select: { name: true } },
      subjects: true, // Example: fetch subjects
      // members: { select: { id: true, name: true, role: true } }, // Example: fetch members
      _count: { select: { members: true, subjects: true } },
    },
  });

  if (!classroom) {
    return <div className="container mx-auto py-8">Classroom not found.</div>;
  }

  // Check if user is a member of this classroom (important for authorization)
  const isMember = await prisma.classroom.count({
    where: {
      id: classroomId,
      members: {
        some: { id: session.user.id },
      },
    },
  });

  if (isMember === 0 && session.user.role !== 'ADMIN') {
     // If not an admin and not a member, deny access or show limited view
    return <div className="container mx-auto py-8">Access Denied. You are not a member of this classroom.</div>;
  }

  // Track classroom view activity
  // Not awaiting, fire-and-forget
  trackUserActivity(session.user.id, 'VIEW_CLASSROOM_DETAILS', undefined, { classroomId: classroom.id, classroomName: classroom.name });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{classroom.name}</h1>
        <p className="text-gray-600">Section: {classroom.section}</p>
        <p className="text-sm text-gray-500">Owner: {classroom.owner.name} | Members: {classroom._count.members}</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-4"> {/* Adjust grid-cols as needed */}
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="subjects">Subjects ({classroom._count.subjects})</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          {/* Add more tabs as needed: Assignments, Quizzes, Resources, Settings (for CR/Admin) */}
        </TabsList>

        <TabsContent value="overview">
          <div className="p-4 border rounded-md bg-white shadow">
            <h2 className="text-xl font-semibold mb-3">Classroom Overview</h2>
            <p>Welcome to {classroom.name}. Here you can find all relevant information and resources for this class.</p>
            {/* Add more overview details here */}
            <div className="mt-4">
                <Link href={`/classroom/${classroomId}/subjects`}>
                    <Button variant="outline" className="mr-2">View Subjects</Button>
                </Link>
                 <Link href={`/classroom/${classroomId}/notes`}>
                    <Button variant="outline">View Notes</Button>
                </Link>
                {/* Add links to other sections */}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="subjects">
          <div className="p-4 border rounded-md bg-white shadow">
            <h2 className="text-xl font-semibold mb-3">Subjects</h2>
            {/* Placeholder for SubjectList component or direct rendering */}
            {classroom.subjects.length > 0 ? (
              <ul>
                {classroom.subjects.map(subject => (
                  <li key={subject.id} className="mb-2 p-2 border-b">
                    <Link href={`/classroom/${classroomId}/subjects/${subject.id}`} className="text-blue-600 hover:underline">
                        {subject.name} (Code: {subject.code})
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No subjects added to this classroom yet.</p>
            )}
            {/* TODO: Add UI for CR/Admin to add subjects */}
          </div>
        </TabsContent>

        <TabsContent value="notes">
          <div className="p-4 border rounded-md bg-white shadow">
            <h2 className="text-xl font-semibold mb-3">Notes</h2>
            {/* Placeholder for NoteList component */}
            <p>Note sharing functionality will be displayed here. <Link href={`/classroom/notes/${classroomId}`} className="text-blue-600 hover:underline">Go to Notes</Link></p>
            {/* This might link to a dedicated notes page for this classroom */}
          </div>
        </TabsContent>

        <TabsContent value="members">
          <div className="p-4 border rounded-md bg-white shadow">
            <h2 className="text-xl font-semibold mb-3">Members</h2>
            {/* Placeholder for MemberList component */}
            <p>Classroom member list will be displayed here.</p>
            {/* TODO: Fetch and display members. Add management tools for CR/Admin. */}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
