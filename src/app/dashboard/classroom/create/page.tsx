import { CreateClassroomForm } from '@/components/classroom/CreateClassroomForm'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'

export default async function CreateClassroomPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user || session.user.role !== 'CR') {
    redirect('/dashboard')
  }

  return (
    <div className="container mx-auto py-10">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold">Create a New Classroom</h1>
        <CreateClassroomForm />
      </div>
    </div>
  )
} 