import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClockIcon } from '@heroicons/react/24/outline';

async function getUpcomingQuizzes(userId: string) {
  const quizzes = await prisma.quiz.findMany({
    where: {
      subject: {
        classroom: {
          members: {
            some: {
              id: userId,
            },
          },
        },
      },
      endTime: {
        gte: new Date(),
      },
    },
    include: {
      subject: true,
      attempts: {
        where: {
          studentId: userId,
        },
      },
    },
    orderBy: {
      startTime: 'asc',
    },
    take: 5,
  });

  return quizzes;
}

export default async function UpcomingQuizzes({ userId }: { userId: string }) {
  const quizzes = await getUpcomingQuizzes(userId);

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No upcoming quizzes
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {quizzes.map((quiz) => {
        const isAttempted = quiz.attempts.length > 0;
        const now = new Date();
        const isActive = now >= quiz.startTime && now <= quiz.endTime;
        const minutesUntilStart = Math.ceil(
          (quiz.startTime.getTime() - now.getTime()) / (1000 * 60)
        );

        return (
          <div
            key={quiz.id}
            className="flex items-start justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
          >
            <div className="space-y-1">
              <h4 className="font-medium">{quiz.title}</h4>
              <p className="text-sm text-gray-500">{quiz.subject.name}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <ClockIcon className="h-4 w-4" />
                <span>
                  {isActive
                    ? `Ends ${format(quiz.endTime, 'h:mm a')}`
                    : `Starts ${format(quiz.startTime, 'MMM d, h:mm a')}`}
                </span>
              </div>
              <p className="text-sm text-gray-500">
                Duration: {quiz.duration} minutes
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge
                variant={
                  isAttempted
                    ? "success"
                    : isActive
                    ? "default"
                    : minutesUntilStart <= 30
                    ? "warning"
                    : "secondary"
                }
              >
                {isAttempted
                  ? "Completed"
                  : isActive
                  ? "In Progress"
                  : minutesUntilStart <= 60
                  ? `Starts in ${minutesUntilStart} min`
                  : format(quiz.startTime, 'MMM d')}
              </Badge>
              {!isAttempted && isActive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.location.href = `/quizzes/${quiz.id}/take`;
                  }}
                >
                  Take Quiz
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
} 