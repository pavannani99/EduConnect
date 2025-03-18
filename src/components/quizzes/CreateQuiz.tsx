import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { QuestionType } from '@prisma/client';
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

const questionSchema = z.object({
  content: z.string().min(1, 'Question content is required'),
  type: z.enum(['MULTIPLE_CHOICE', 'SHORT_ANSWER', 'LONG_ANSWER']),
  options: z.array(z.object({
    text: z.string(),
    isCorrect: z.boolean(),
  })).optional(),
  answer: z.string().optional(),
  points: z.number().min(1, 'Points must be at least 1'),
});

const quizSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  questions: z.array(questionSchema).min(1, 'At least one question is required'),
});

type QuizFormData = z.infer<typeof quizSchema>;

interface CreateQuizProps {
  subjectId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CreateQuiz({
  subjectId,
  onSuccess,
  onCancel,
}: CreateQuizProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      duration: 30,
      questions: [
        {
          content: '',
          type: 'MULTIPLE_CHOICE',
          options: [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
          ],
          points: 1,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'questions',
  });

  const onSubmit = async (data: QuizFormData) => {
    try {
      setIsSubmitting(true);
      const response = await fetch('/api/quizzes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          subjectId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create quiz');
      }

      toast({
        title: 'Success',
        description: 'Quiz created successfully',
      });
      onSuccess();
    } catch (error) {
      console.error('Error creating quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to create quiz',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Quiz title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (minutes)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Quiz description"
                    className="h-24"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Questions</h3>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  append({
                    content: '',
                    type: 'MULTIPLE_CHOICE',
                    options: [
                      { text: '', isCorrect: false },
                      { text: '', isCorrect: false },
                      { text: '', isCorrect: false },
                      { text: '', isCorrect: false },
                    ],
                    points: 1,
                  })
                }
              >
                Add Question
              </Button>
            </div>

            {fields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <h4 className="font-medium">Question {index + 1}</h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <FormField
                    control={form.control}
                    name={`questions.${index}.content`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question Text</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`questions.${index}.type`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Question Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="MULTIPLE_CHOICE">
                                Multiple Choice
                              </SelectItem>
                              <SelectItem value="SHORT_ANSWER">
                                Short Answer
                              </SelectItem>
                              <SelectItem value="LONG_ANSWER">
                                Long Answer
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`questions.${index}.points`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Points</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value))
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {form.watch(`questions.${index}.type`) === 'MULTIPLE_CHOICE' ? (
                    <div className="space-y-2">
                      <FormLabel>Options</FormLabel>
                      {form
                        .watch(`questions.${index}.options`)
                        ?.map((_, optionIndex) => (
                          <div
                            key={optionIndex}
                            className="flex items-center gap-2"
                          >
                            <FormField
                              control={form.control}
                              name={`questions.${index}.options.${optionIndex}.text`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input
                                      placeholder={`Option ${optionIndex + 1}`}
                                      {...field}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`questions.${index}.options.${optionIndex}.isCorrect`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      type="radio"
                                      name={`question-${index}-correct`}
                                      checked={field.value}
                                      onChange={() => {
                                        const options = form.getValues(
                                          `questions.${index}.options`
                                        );
                                        options.forEach((_, i) => {
                                          form.setValue(
                                            `questions.${index}.options.${i}.isCorrect`,
                                            i === optionIndex
                                          );
                                        });
                                      }}
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                        ))}
                    </div>
                  ) : (
                    <FormField
                      control={form.control}
                      name={`questions.${index}.answer`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correct Answer</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </Card>
            ))}
          </div>

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
              {isSubmitting ? 'Creating...' : 'Create Quiz'}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  );
} 