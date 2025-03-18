import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PlusIcon } from '@heroicons/react/24/outline'

interface Subject {
  id: string
  name: string
  code: string
  _count: {
    notes: number
  }
}

interface SubjectListProps {
  classroomId: string
  initialSubjects: Subject[]
}

export function SubjectList({ classroomId, initialSubjects }: SubjectListProps) {
  const [subjects, setSubjects] = useState<Subject[]>(initialSubjects)
  const [isAddingSubject, setIsAddingSubject] = useState(false)
  const [newSubject, setNewSubject] = useState({ name: '', code: '' })
  const router = useRouter()

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch(`/api/classrooms/${classroomId}/subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSubject),
      })

      if (!response.ok) {
        throw new Error('Failed to add subject')
      }

      const subject = await response.json()
      setSubjects([...subjects, subject])
      setNewSubject({ name: '', code: '' })
      setIsAddingSubject(false)
    } catch (error) {
      console.error('Error adding subject:', error)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Subjects</h2>
        <Button
          onClick={() => setIsAddingSubject(true)}
          className="flex items-center gap-2"
          variant="outline"
        >
          <PlusIcon className="h-4 w-4" />
          Add Subject
        </Button>
      </div>

      {isAddingSubject && (
        <form onSubmit={handleAddSubject} className="space-y-4 rounded-lg border p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Subject Name
              </label>
              <Input
                id="name"
                value={newSubject.name}
                onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                required
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                Subject Code
              </label>
              <Input
                id="code"
                value={newSubject.code}
                onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                required
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddingSubject(false)
                setNewSubject({ name: '', code: '' })
              }}
            >
              Cancel
            </Button>
            <Button type="submit">Add Subject</Button>
          </div>
        </form>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className="flex cursor-pointer flex-col justify-between rounded-lg border p-4 transition-colors hover:bg-gray-50"
            onClick={() => router.push(`/classroom/subjects/${subject.id}`)}
          >
            <div>
              <h3 className="font-medium">{subject.name}</h3>
              <p className="text-sm text-gray-500">{subject.code}</p>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              {subject._count.notes} {subject._count.notes === 1 ? 'note' : 'notes'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 