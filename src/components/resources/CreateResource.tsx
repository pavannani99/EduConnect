import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ResourceType } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

const resourceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  type: z.enum(['DOCUMENT', 'VIDEO', 'LINK', 'OTHER']),
  url: z.string().url('Invalid URL').optional().or(z.literal('')),
  file: z.any().optional(), // Handle file upload separately
});

type ResourceFormData = z.infer<typeof resourceSchema>;

interface CreateResourceProps {
  subjectId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CreateResource({
  subjectId,
  onSuccess,
  onCancel,
}: CreateResourceProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ResourceFormData>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'LINK',
      url: '',
    },
  });

  const onSubmit = async (data: ResourceFormData) => {
    try {
      setIsSubmitting(true);

      // Handle file upload if present
      let fileKey = null;
      if (data.file?.[0]) {
        const formData = new FormData();
        formData.append('file', data.file[0]);
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }
        const { key } = await uploadResponse.json();
        fileKey = key;
      }

      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          subjectId,
          fileKey,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create resource');
      }

      toast({
        title: 'Success',
        description: 'Resource created successfully',
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating resource:', error);
      toast({
        title: 'Error',
        description: 'Failed to create resource',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resourceType = form.watch('type');

  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Resource title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Resource description"
                    className="h-24"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Resource Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="DOCUMENT">Document</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                    <SelectItem value="LINK">Link</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {resourceType === 'LINK' && (
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {(resourceType === 'DOCUMENT' || resourceType === 'OTHER') && (
            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>File</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      onChange={(e) => onChange(e.target.files)}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Resource'}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
} 