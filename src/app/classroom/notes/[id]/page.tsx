import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatDistanceToNow } from 'date-fns'
import { CommentList } from '@/components/classroom/CommentList'

interface PageProps {
  params: {
    id: string
  }
}

export default async function NoteDetailPage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=' + encodeURIComponent(`/classroom/notes/${params.id}`))
  }

  const note = await prisma.note.findUnique({
    where: { id: params.id },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      subject: {
        include: {
          classroom: {
            include: {
              members: true,
            }
          }
        }
      },
      comments: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })

  if (!note) {
    return (
      <div className="container mx-auto py-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-2xl font-bold text-gray-900">Note Not Found</h1>
          <p className="mt-2 text-gray-600">This note does not exist or has been deleted.</p>
        </div>
      </div>
    )
  }

  // Check if user is a member or owner of the classroom
  if (!note.subject.classroom.members.some(member => member.id === session.user.id) && 
      note.subject.classroom.ownerId !== session.user.id) {
    return (
      <div className="container mx-auto py-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-600">You must be a member of this classroom to view this note.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">{note.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>by {note.author.name}</span>
            <span>•</span>
            <span>{formatDistanceToNow(new Date(note.createdAt))} ago</span>
          </div>
          <div 
            className="prose prose-gray max-w-none rounded-lg border border-gray-200 p-6"
            dangerouslySetInnerHTML={{ __html: note.content }}
          />
          {note.attachments.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Attachments</h3>
              <ul className="mt-2 divide-y divide-gray-200 rounded-lg border">
                {note.attachments.map((url, index) => (
                  <li key={index} className="flex items-center justify-between p-4">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      Attachment {index + 1}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-8">
          <CommentList
            noteId={note.id}
            initialComments={note.comments}
          />
        </div>
      </div>
    </div>
  )
} 