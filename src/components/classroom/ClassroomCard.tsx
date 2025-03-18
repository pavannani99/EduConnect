import { Classroom, User } from '@prisma/client'
import Link from 'next/link'
import { Button } from '../ui/Button'

interface ClassroomCardProps {
  classroom: Classroom & {
    owner: Pick<User, 'id' | 'name'>
    _count: { members: number }
  }
}

export function ClassroomCard({ classroom }: ClassroomCardProps) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{classroom.name}</h3>
          <p className="text-sm text-gray-500">Section: {classroom.section}</p>
        </div>
        <div className="flex items-center gap-2">
          {classroom.isPrivate ? (
            <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
              Private
            </span>
          ) : (
            <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
              Public
            </span>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          <p>Created by: {classroom.owner.name}</p>
          <p>{classroom._count.members} members</p>
        </div>
        <Link href={`/classroom/${classroom.id}`}>
          <Button variant="default" size="sm">
            View Classroom
          </Button>
        </Link>
      </div>
    </div>
  )
} 