import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AddCollegeForm } from '@/components/college/AddCollegeForm'
import { CollegeList } from '@/components/college/CollegeList'

export default async function CollegesPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const colleges = await prisma.college.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: {
          users: true,
          classrooms: true,
        },
      },
    },
  })

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">College Management</h1>
        <p className="mt-2 text-gray-600">Add and manage colleges in the system</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-xl font-semibold">Add New College</h2>
          <AddCollegeForm />
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold">Registered Colleges</h2>
          <CollegeList colleges={colleges} />
        </div>
      </div>
    </div>
  )
} 