import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/Button'

const classroomSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  section: z.string().min(1, 'Section is required'),
  isPrivate: z.boolean().default(true),
})

type ClassroomData = z.infer<typeof classroomSchema>

export function CreateClassroomForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClassroomData>({
    resolver: zodResolver(classroomSchema),
    defaultValues: {
      isPrivate: true,
    },
  })

  const onSubmit = async (data: ClassroomData) => {
    try {
      setIsLoading(true)
      setError('')

      const response = await fetch('/api/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to create classroom')
      }

      const result = await response.json()
      router.push(`/dashboard/classroom/${result.id}`)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Classroom Name
        </label>
        <input
          {...register('name')}
          type="text"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="e.g., Advanced Mathematics"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="section" className="block text-sm font-medium text-gray-700">
          Section
        </label>
        <input
          {...register('section')}
          type="text"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="e.g., EE-1"
        />
        {errors.section && (
          <p className="mt-1 text-sm text-red-600">{errors.section.message}</p>
        )}
      </div>

      <div className="flex items-center">
        <input
          {...register('isPrivate')}
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-700">
          Make this classroom private (invite-only)
        </label>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Creating classroom...' : 'Create Classroom'}
      </Button>
    </form>
  )
} 