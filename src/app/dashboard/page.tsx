import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { trackUserActivity } from '@/lib/analytics'; // Import analytics tracking
import { generateDetailedAnalytics } from '@/lib/analytics/advanced'; // Import for detailed analytics
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
  AcademicCapIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import RecentActivity from '@/components/dashboard/RecentActivity';
import UpcomingAssignments from '@/components/dashboard/UpcomingAssignments';
import UpcomingQuizzes from '@/components/dashboard/UpcomingQuizzes';

async function getAnalytics(userId: string) {
  const analytics = await prisma.$transaction([
    // Get total subjects
    prisma.subject.count({
      where: {
        classroom: {
          members: {
            some: {
              id: userId,
            },
          },
        },
      },
    }),
    // Get total assignments
    prisma.assignment.count({
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
      },
    }),
    // Get completed assignments
    prisma.assignmentSubmission.count({
      where: {
        studentId: userId,
      },
    }),
    // Get total quizzes attempted
    prisma.quizAttempt.count({
      where: {
        studentId: userId,
      },
    }),
    // Get average quiz score
    prisma.quizAttempt.aggregate({
      where: {
        studentId: userId,
        score: {
          not: null,
        },
      },
      _avg: {
        score: true,
      },
    }),
  ]);

  return {
    totalSubjects: analytics[0],
    totalAssignments: analytics[1],
    completedAssignments: analytics[2],
    quizzesAttempted: analytics[3],
    averageQuizScore: analytics[4]._avg.score || 0,
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    // Middleware should handle this, but as a safeguard:
    redirect('/auth/login');
  }

  // Track dashboard view activity
  // Not awaiting, fire-and-forget
  trackUserActivity(session.user.id, 'VIEW_DASHBOARD');

  // Use the more detailed analytics function
  // const analytics = await getAnalytics(session.user.id); // Old function
  const detailedAnalytics = await generateDetailedAnalytics(session.user.id);


  // For the cards, we can adapt data from detailedAnalytics or keep getAnalytics if it's simpler for card display
  // For this example, let's assume getAnalytics was providing the direct counts needed for the top cards.
  // We can either call both, or ensure generateDetailedAnalytics provides everything.
  // Let's try to adapt from detailedAnalytics for now.
  const summaryAnalytics = {
    totalSubjects: await prisma.subject.count({ // This might need to be part of generateDetailedAnalytics or fetched separately
        where: { classroom: { members: { some: { id: session.user.id } } } }
    }),
    totalAssignments: detailedAnalytics.learningProgress.totalAssignments,
    completedAssignments: detailedAnalytics.learningProgress.completedAssignments,
    quizzesAttempted: detailedAnalytics.performance.quizScores.length, // Assuming quizScores are from attempts
    averageQuizScore: detailedAnalytics.learningProgress.averageScore, // This was already in getAnalytics
  };


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome back, {session.user.name}!</h1>
        <p className="text-gray-600">Here's an overview of your academic progress</p>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Subjects</CardTitle>
            <BookOpenIcon className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryAnalytics.totalSubjects}</div>
            <p className="text-xs text-gray-500">Enrolled subjects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Assignments</CardTitle>
            <ClipboardDocumentCheckIcon className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryAnalytics.completedAssignments}/{summaryAnalytics.totalAssignments}</div>
            <p className="text-xs text-gray-500">Completed assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Quizzes</CardTitle>
            <AcademicCapIcon className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryAnalytics.quizzesAttempted}</div>
            <p className="text-xs text-gray-500">Quizzes attempted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Average Score</CardTitle>
            <ChartBarIcon className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryAnalytics.averageQuizScore.toFixed(1)}%</div>
            <p className="text-xs text-gray-500">Quiz performance</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest academic activities</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<div>Loading activities...</div>}>
            <RecentActivity userId={session.user.id} />
          </Suspense>
        </CardContent>
      </Card>

      {/* Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Assignments</CardTitle>
            <CardDescription>Tasks due soon</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading assignments...</div>}>
              <UpcomingAssignments userId={session.user.id} />
            </Suspense>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Quizzes</CardTitle>
            <CardDescription>Scheduled assessments</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div>Loading quizzes...</div>}>
              <UpcomingQuizzes userId={session.user.id} />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 