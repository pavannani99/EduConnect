import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
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
    redirect('/login');
  }

  const analytics = await getAnalytics(session.user.id);

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
            <div className="text-2xl font-bold">{analytics.totalSubjects}</div>
            <p className="text-xs text-gray-500">Enrolled subjects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Assignments</CardTitle>
            <ClipboardDocumentCheckIcon className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.completedAssignments}/{analytics.totalAssignments}</div>
            <p className="text-xs text-gray-500">Completed assignments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Quizzes</CardTitle>
            <AcademicCapIcon className="h-5 w-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.quizzesAttempted}</div>
            <p className="text-xs text-gray-500">Quizzes attempted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Average Score</CardTitle>
            <ChartBarIcon className="h-5 w-5 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageQuizScore.toFixed(1)}%</div>
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