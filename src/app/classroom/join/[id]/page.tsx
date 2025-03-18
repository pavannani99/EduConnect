import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Button } from '@/components/ui/Button'

interface PageProps {
  params: {
    id: string
  }
}

export default async function ClassroomInvitePage({ params }: PageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/login?callbackUrl=' + encodeURIComponent(`/classroom/join/${params.id}`))
  }

  const classroom = await prisma.classroom.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      section: true,
      isPrivate: true,
      college: {
        select: {
          name: true,
        }
      },
      owner: {
        select: {
          name: true,
        }
      },
      _count: {
        select: {
          members: true,
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

  return (
    <div className="container mx-auto py-10">
      <div className="mx-auto max-w-md">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">{classroom.name}</h1>
          <p className="mt-1 text-gray-600">Section {classroom.section}</p>
          
          <div className="mt-4 space-y-2 text-sm text-gray-600">
            <p>College: {classroom.college.name}</p>
            <p>Created by: {classroom.owner.name}</p>
            <p>Members: {classroom._count.members}</p>
          </div>

          <form action={`/api/classrooms/${classroom.id}/invite`} method="POST" className="mt-6">
            <Button type="submit" className="w-full">
              Join Classroom
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
} 