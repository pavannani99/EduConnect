import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { ClassroomCard } from '@/components/classroom/ClassroomCard'
import { CreateClassroomForm } from '@/components/classroom/CreateClassroomForm'

export default async function ClassroomsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/login')
  }

  const classrooms = await prisma.classroom.findMany({
    where: {
      OR: [
        { members: { some: { id: session.user.id } } },
        { isPrivate: false },
      ],
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: { members: true },
      },
    },
  })

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Classrooms</h1>
        {user?.role !== 'STUDENT' && (
          <div className="flex justify-end">
            <details className="relative inline-block text-left">
              <summary className="cursor-pointer rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
                Create Classroom
              </summary>
              <div className="absolute right-0 mt-2 w-96 rounded-md bg-white p-4 shadow-lg ring-1 ring-black ring-opacity-5">
                <CreateClassroomForm />
              </div>
            </details>
          </div>
        )}
      </div>

      {classrooms.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900">No classrooms found</h3>
          <p className="mt-2 text-sm text-gray-500">
            {user?.role === 'STUDENT'
              ? 'Join a classroom to get started.'
              : 'Create a classroom to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classrooms.map((classroom) => (
            <ClassroomCard key={classroom.id} classroom={classroom} />
          ))}
        </div>
      )}
    </div>
  )
} 