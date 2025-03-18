interface College {
  id: string
  name: string
  domain: string
  _count: {
    users: number
    classrooms: number
  }
}

interface CollegeListProps {
  colleges: College[]
}

export function CollegeList({ colleges }: CollegeListProps) {
  if (colleges.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
        <p className="text-gray-500">No colleges registered yet</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200 rounded-lg border border-gray-200">
      {colleges.map((college) => (
        <div key={college.id} className="p-4">
          <h3 className="font-medium">{college.name}</h3>
          <p className="mt-1 text-sm text-gray-500">{college.domain}</p>
          <div className="mt-2 flex gap-4 text-sm text-gray-600">
            <p>{college._count.users} users</p>
            <p>{college._count.classrooms} classrooms</p>
          </div>
        </div>
      ))}
    </div>
  )
} 