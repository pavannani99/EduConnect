import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NoteList } from '@/components/classroom/NoteList'

interface PageProps {
  params: {
    id: string
  }
}

export default async function SubjectNotesPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=' + encodeURIComponent(`/classroom/subjects/${params.id}`))
  }

  const subject = await prisma.subject.findUnique({
    where: { id: params.id },
    include: {
      classroom: {
        include: {
          members: true,
          owner: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      },
      notes: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
          _count: {
            select: { comments: true }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })

  if (!subject) {
    return (
      <div className="container mx-auto py-10">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900">Subject Not Found</h1>
          <p className="mt-2 text-gray-600">This subject does not exist or has been deleted.</p>
        </div>
      </div>
    )
  }

  // Check if user is a member or owner of the classroom
  if (!subject.classroom.members.some(member => member.id === session.user.id) && 
      subject.classroom.ownerId !== session.user.id) {
    return (
      <div className="container mx-auto py-10">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-600">You must be a member of this classroom to view notes.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{subject.name}</h1>
        <p className="text-gray-600">{subject.code}</p>
      </div>

      <NoteList
        subjectId={subject.id}
        initialNotes={subject.notes}
      />
    </div>
  )
} 