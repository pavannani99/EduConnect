import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SubjectList } from '@/components/classroom/SubjectList'

interface PageProps {
  params: {
    id: string
  }
}

export default async function ClassroomSubjectsPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=' + encodeURIComponent(`/classroom/${params.id}/subjects`))
  }

  const classroom = await prisma.classroom.findUnique({
    where: { id: params.id },
    include: {
      college: true,
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      members: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      subjects: {
        include: {
          _count: {
            select: { notes: true }
          }
        }
      }
    }
  })

  if (!classroom) {
    return (
      <div className="container mx-auto py-10">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900">Classroom Not Found</h1>
          <p className="mt-2 text-gray-600">This classroom does not exist or has been deleted.</p>
        </div>
      </div>
    )
  }

  // Check if user is a member or owner of the classroom
  if (!classroom.members.some(member => member.id === session.user.id) && classroom.ownerId !== session.user.id) {
    return (
      <div className="container mx-auto py-10">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-600">You must be a member of this classroom to view its subjects.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{classroom.name}</h1>
        <p className="text-gray-600">Section {classroom.section}</p>
      </div>

      <SubjectList
        classroomId={classroom.id}
        initialSubjects={classroom.subjects}
      />
    </div>
  )
} 