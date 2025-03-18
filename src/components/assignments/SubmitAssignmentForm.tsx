import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { AssignmentSubmission } from '@prisma/client';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

const submissionSchema = z.object({
  content: z.string().min(1, 'Submission content is required'),
});

type SubmissionFormData = z.infer<typeof submissionSchema>;

interface SubmitAssignmentFormProps {
  assignmentId: string;
  existingSubmission?: AssignmentSubmission;
}

export default function SubmitAssignmentForm({
  assignmentId,
  existingSubmission,
}: SubmitAssignmentFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionSchema),
    defaultValues: {
      content: existingSubmission?.content || '',
    },
  });

  const onSubmit = async (data: SubmissionFormData) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to submit assignment');
      }

      toast({
        title: 'Success',
        description: existingSubmission
          ? 'Assignment updated successfully'
          : 'Assignment submitted successfully',
      });

      // Redirect to the classroom page or assignment list
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Error submitting assignment:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit assignment',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">
        {existingSubmission ? 'Update Submission' : 'Submit Assignment'}
      </h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Answer</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Write your answer here..."
                    className="h-48"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Submitting...'
                : existingSubmission
                ? 'Update Submission'
                : 'Submit Assignment'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
} 