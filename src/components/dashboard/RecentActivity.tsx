import { format } from 'date-fns';
import { prisma } from '@/lib/prisma';
import {
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  ChatBubbleLeftIcon,
} from '@heroicons/react/24/outline';

async function getRecentActivities(userId: string) {
  const activities = await prisma.$transaction([
    // Get recent assignment submissions
    prisma.assignmentSubmission.findMany({
      where: {
        studentId: userId,
      },
      include: {
        assignment: true,
      },
      orderBy: {
        submittedAt: 'desc',
      },
      take: 5,
    }),
    // Get recent quiz attempts
    prisma.quizAttempt.findMany({
      where: {
        studentId: userId,
      },
      include: {
        quiz: true,
      },
      orderBy: {
        submittedAt: 'desc',
      },
      take: 5,
    }),
    // Get recent notes
    prisma.note.findMany({
      where: {
        authorId: userId,
      },
      include: {
        subject: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
    }),
  ]);

  return activities;
}

export default async function RecentActivity({ userId }: { userId: string }) {
  const [assignments, quizzes, notes] = await getRecentActivities(userId);

  // Combine and sort all activities
  const allActivities = [
    ...assignments.map(submission => ({
      type: 'assignment',
      title: submission.assignment.title,
      date: submission.submittedAt,
      score: submission.grade,
      icon: ClipboardDocumentCheckIcon,
      color: 'text-green-500',
    })),
    ...quizzes.map(attempt => ({
      type: 'quiz',
      title: attempt.quiz.title,
      date: attempt.submittedAt,
      score: attempt.score,
      icon: AcademicCapIcon,
      color: 'text-purple-500',
    })),
    ...notes.map(note => ({
      type: 'note',
      title: note.title,
      date: note.createdAt,
      subject: note.subject.name,
      icon: BookOpenIcon,
      color: 'text-blue-500',
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())
  .slice(0, 10);

  if (allActivities.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No recent activities to show
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {allActivities.map((activity, index) => (
        <div key={index} className="flex items-start gap-4">
          <div className={`${activity.color} p-2 rounded-full bg-opacity-10`}>
            <activity.icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-sm font-medium">{activity.title}</h4>
                {activity.type === 'note' && (
                  <p className="text-xs text-gray-500">
                    Added note to {activity.subject}
                  </p>
                )}
                {(activity.type === 'quiz' || activity.type === 'assignment') && activity.score && (
                  <p className="text-xs text-gray-500">
                    Score: {activity.score}%
                  </p>
                )}
              </div>
              <time className="text-xs text-gray-500">
                {format(activity.date, 'MMM d, h:mm a')}
              </time>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 