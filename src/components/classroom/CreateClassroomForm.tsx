import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/context/ToastContext'; // Import useToast

const classroomSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  section: z.string().min(1, 'Section is required'),
  isPrivate: z.boolean().default(true),
})

type ClassroomData = z.infer<typeof classroomSchema>

export function CreateClassroomForm({ onSuccess }: { onSuccess?: () => void }) { // Add onSuccess prop
  const router = useRouter();
  const { addToast } = useToast(); // Use the toast hook
  const [isLoading, setIsLoading] = useState(false);
  // const [error, setError] = useState(''); // No longer using local error state for main feedback

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
      setIsLoading(true);
      // setError(''); // Not using local error state for main feedback

      const response = await fetch('/api/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json(); // Try to get JSON regardless of response.ok for error messages

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create classroom');
      }

      addToast('Classroom created successfully!', 'success');
      if (onSuccess) {
        onSuccess(); // Call the callback to close modal, etc.
      }
      router.refresh(); // Refresh current route to reflect new classroom if on classrooms list
      router.push(`/classroom/${result.id}`); // Navigate to the new classroom
    } catch (err: any) {
      // setError('Something went wrong. Please try again.'); // Not using local error state
      addToast(err.message || 'Something went wrong. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Classroom Name</Label>
        <Input
          id="name"
          {...register('name')}
          type="text"
          placeholder="e.g., Advanced Mathematics"
          className={errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="section">Section</Label>
        <Input
          id="section"
          {...register('section')}
          type="text"
          placeholder="e.g., EE-1"
          className={errors.section ? 'border-destructive focus-visible:ring-destructive' : ''}
        />
        {errors.section && (
          <p className="text-sm text-destructive">{errors.section.message}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        {/* Ideally, this would be a src/components/ui/checkbox.tsx component */}
        <input
          id="isPrivate"
          {...register('isPrivate')}
          type="checkbox"
          className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
        />
        <Label htmlFor="isPrivate" className="font-normal">
          Make this classroom private (invite-only)
        </Label>
      </div>

      {/* General form error from API is now handled by toast, no need for this block unless specific placement is desired
      {error && (
        <div className="rounded-md bg-destructive/10 p-3">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}
      */}

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