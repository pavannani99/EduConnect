import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Question } from '@prisma/client';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

interface TakeQuizFormProps {
  quizId: string;
  questions: (Pick<Question, 'id' | 'content' | 'type' | 'options' | 'points'>)[];
  duration: number;
}

const answerSchema = z.object({
  questionId: z.string(),
  answer: z.string().min(1, 'Answer is required'),
});

const quizResponseSchema = z.object({
  responses: z.array(answerSchema),
});

type QuizResponseData = z.infer<typeof quizResponseSchema>;

export default function TakeQuizForm({
  quizId,
  questions,
  duration,
}: TakeQuizFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(duration * 60); // Convert to seconds

  const form = useForm<QuizResponseData>({
    resolver: zodResolver(quizResponseSchema),
    defaultValues: {
      responses: questions.map((q) => ({
        questionId: q.id,
        answer: '',
      })),
    },
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          form.handleSubmit(onSubmit)();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const onSubmit = async (data: QuizResponseData) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/quizzes/${quizId}/attempt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to submit quiz');
      }

      toast({
        title: 'Success',
        description: 'Quiz submitted successfully',
      });

      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit quiz',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="sticky top-0 bg-white z-10 p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Time Remaining</h2>
          <span
            className={`text-xl font-mono ${
              timeLeft < 60 ? 'text-red-600' : 'text-gray-900'
            }`}
          >
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {questions.map((question, index) => (
            <Card key={question.id} className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium">
                      Question {index + 1}
                    </h3>
                    <p className="text-gray-600 mt-1">{question.content}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {question.points} points
                  </span>
                </div>

                <FormField
                  control={form.control}
                  name={`responses.${index}.answer`}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        {question.type === 'MULTIPLE_CHOICE' ? (
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <div className="space-y-2">
                              {(question.options as any[]).map(
                                (option, optionIndex) => (
                                  <div
                                    key={optionIndex}
                                    className="flex items-center"
                                  >
                                    <RadioGroupItem
                                      value={option.text}
                                      id={`q${index}-opt${optionIndex}`}
                                    />
                                    <FormLabel
                                      htmlFor={`q${index}-opt${optionIndex}`}
                                      className="ml-2"
                                    >
                                      {option.text}
                                    </FormLabel>
                                  </div>
                                )
                              )}
                            </div>
                          </RadioGroup>
                        ) : (
                          <Textarea
                            {...field}
                            placeholder={
                              question.type === 'SHORT_ANSWER'
                                ? 'Write your answer here...'
                                : 'Write your detailed answer here...'
                            }
                            className={
                              question.type === 'LONG_ANSWER' ? 'h-32' : ''
                            }
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </Card>
          ))}

          <div className="sticky bottom-0 bg-white p-4 border-t">
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || timeLeft === 0}>
                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
} 