import { prisma } from '@/lib/prisma';

interface AnalyticsMetrics {
  learningProgress: {
    completedAssignments: number;
    totalAssignments: number;
    averageScore: number;
    timeSpent: number;
  };
  engagement: {
    totalLogins: number;
    averageSessionDuration: number;
    resourcesAccessed: number;
    commentsPosted: number;
  };
  performance: {
    quizScores: number[];
    assignmentGrades: number[];
    participationRate: number;
  };
}

export async function generateDetailedAnalytics(userId: string): Promise<AnalyticsMetrics> {
  const [
    assignments,
    quizzes,
    activities,
    comments
  ] = await prisma.$transaction([
    // Assignment metrics
    prisma.assignmentSubmission.findMany({
      where: { studentId: userId },
      include: { assignment: true },
    }),
    // Quiz performance
    prisma.quizAttempt.findMany({
      where: { studentId: userId },
      include: { quiz: true },
    }),
    // User activity
    prisma.userActivity.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    }),
    // Comments and engagement
    prisma.noteComment.count({
      where: { authorId: userId },
    }),
  ]);

  // Calculate learning progress
  const learningProgress = {
    completedAssignments: assignments.length,
    totalAssignments: await prisma.assignment.count(),
    averageScore: calculateAverageScore(assignments),
    timeSpent: calculateTotalTimeSpent(activities),
  };

  // Calculate engagement metrics
  const engagement = {
    totalLogins: countLogins(activities),
    averageSessionDuration: calculateAverageSessionDuration(activities),
    resourcesAccessed: countResourcesAccessed(activities),
    commentsPosted: comments,
  };

  // Calculate performance metrics
  const performance = {
    quizScores: quizzes.map(q => q.score || 0),
    assignmentGrades: assignments.map(a => a.grade || 0),
    participationRate: calculateParticipationRate(activities),
  };

  return {
    learningProgress,
    engagement,
    performance,
  };
}

// Helper functions
function calculateAverageScore(assignments: any[]): number {
  if (assignments.length === 0) return 0;
  const sum = assignments.reduce((acc, curr) => acc + (curr.grade || 0), 0);
  return sum / assignments.length;
}

function calculateTotalTimeSpent(activities: any[]): number {
  // Implementation for calculating total time spent
  return activities.reduce((acc, curr) => acc + (curr.duration || 0), 0);
}

function countLogins(activities: any[]): number {
  return activities.filter(a => a.type === 'LOGIN').length;
}

function calculateAverageSessionDuration(activities: any[]): number {
  // Implementation for calculating average session duration
  const sessions = groupActivitiesIntoSessions(activities);
  if (sessions.length === 0) return 0;
  
  const totalDuration = sessions.reduce((acc, session) => {
    return acc + (session.end.getTime() - session.start.getTime());
  }, 0);
  
  return totalDuration / sessions.length;
}

function countResourcesAccessed(activities: any[]): number {
  return activities.filter(a => 
    a.type === 'VIEW_NOTE' || 
    a.type === 'DOWNLOAD_RESOURCE' || 
    a.type === 'VIEW_ASSIGNMENT'
  ).length;
}

function calculateParticipationRate(activities: any[]): number {
  // Implementation for calculating participation rate
  const totalPossibleActivities = activities.length;
  const actualParticipation = activities.filter(a => 
    a.type !== 'LOGIN' && a.type !== 'LOGOUT'
  ).length;
  
  return totalPossibleActivities > 0 
    ? (actualParticipation / totalPossibleActivities) * 100 
    : 0;
}

function groupActivitiesIntoSessions(activities: any[]): { start: Date; end: Date }[] {
  const sessions: { start: Date; end: Date }[] = [];
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

  let currentSession: { start: Date; end: Date } | null = null;

  activities.forEach(activity => {
    const activityTime = new Date(activity.timestamp);

    if (!currentSession) {
      currentSession = { start: activityTime, end: activityTime };
    } else {
      const timeDiff = activityTime.getTime() - currentSession.end.getTime();
      
      if (timeDiff > SESSION_TIMEOUT) {
        sessions.push(currentSession);
        currentSession = { start: activityTime, end: activityTime };
      } else {
        currentSession.end = activityTime;
      }
    }
  });

  if (currentSession) {
    sessions.push(currentSession);
  }

  return sessions;
} 