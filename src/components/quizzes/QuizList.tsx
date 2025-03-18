import { useState, useEffect } from 'react';
import { Quiz, Question, QuizAttempt } from '@prisma/client';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import CreateQuiz from './CreateQuiz';

type QuizWithDetails = Quiz & {
  questions: Pick<Question, 'id' | 'content' | 'type' | 'points'>[];
  attempts: Pick<QuizAttempt, 'id' | 'startedAt' | 'submittedAt' | 'score'>[];
};

interface QuizListProps {
  subjectId: string;
  isTeacher: boolean;
}

export default function QuizList({ subjectId, isTeacher }: QuizListProps) {
  const { data: session } = useSession();
  const [quizzes, setQuizzes] = useState<QuizWithDetails[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch(`/api/quizzes?subjectId=${subjectId}`);
      const data = await response.json();
      if (response.ok) {
        setQuizzes(data);
      }
    } catch (error) {
      console.error('Error fetching quizzes:', error);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, [subjectId]);

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
    fetchQuizzes();
  };

  const isQuizActive = (quiz: Quiz) => {
    const now = new Date();
    return now >= quiz.startTime && now <= quiz.endTime;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quizzes</h2>
        {isTeacher && (
          <Button onClick={() => setShowCreateForm(true)}>
            Create Quiz
          </Button>
        )}
      </div>

      {showCreateForm && (
        <CreateQuiz
          subjectId={subjectId}
          onSuccess={handleCreateSuccess}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      <div className="grid gap-4">
        {quizzes.map((quiz) => {
          const attempt = quiz.attempts[0];
          const active = isQuizActive(quiz);

          return (
            <Card key={quiz.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{quiz.title}</h3>
                  <p className="text-gray-600">{quiz.description}</p>
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>Start: {format(new Date(quiz.startTime), 'PPp')}</p>
                    <p>End: {format(new Date(quiz.endTime), 'PPp')}</p>
                    <p>Duration: {quiz.duration} minutes</p>
                    <p>Questions: {quiz.questions.length}</p>
                  </div>
                </div>
                <div className="text-right">
                  {attempt?.submittedAt ? (
                    <div>
                      <p className="text-sm text-green-600">Completed</p>
                      {attempt.score !== null && (
                        <p className="text-sm">Score: {attempt.score}</p>
                      )}
                    </div>
                  ) : active ? (
                    <Button
                      onClick={() => {
                        window.location.href = `/quizzes/${quiz.id}/take`;
                      }}
                    >
                      Take Quiz
                    </Button>
                  ) : (
                    <p className="text-sm text-gray-500">
                      {new Date() < quiz.startTime
                        ? 'Not yet started'
                        : 'Quiz ended'}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
} 