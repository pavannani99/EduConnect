import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClockIcon } from '@heroicons/react/24/outline';

async function getUpcomingAssignments(userId: string) {
  const assignments = await prisma.assignment.findMany({
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
      dueDate: {
        gte: new Date(),
      },
    },
    include: {
      subject: true,
      submissions: {
        where: {
          studentId: userId,
        },
      },
    },
    orderBy: {
      dueDate: 'asc',
    },
    take: 5,
  });

  return assignments;
}

export default async function UpcomingAssignments({ userId }: { userId: string }) {
  const assignments = await getUpcomingAssignments(userId);

  if (assignments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No upcoming assignments
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => {
        const isSubmitted = assignment.submissions.length > 0;
        const daysLeft = Math.ceil(
          (assignment.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
        );

        return (
          <div
            key={assignment.id}
            className="flex items-start justify-between p-4 rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
          >
            <div className="space-y-1">
              <h4 className="font-medium">{assignment.title}</h4>
              <p className="text-sm text-gray-500">{assignment.subject.name}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <ClockIcon className="h-4 w-4" />
                <span>Due {format(assignment.dueDate, 'MMM d, h:mm a')}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={isSubmitted ? "success" : daysLeft <= 2 ? "destructive" : "default"}>
                {isSubmitted
                  ? "Submitted"
                  : daysLeft === 0
                  ? "Due today"
                  : daysLeft === 1
                  ? "Due tomorrow"
                  : `${daysLeft} days left`}
              </Badge>
              {!isSubmitted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    window.location.href = `/assignments/${assignment.id}/submit`;
                  }}
                >
                  Submit
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
} 