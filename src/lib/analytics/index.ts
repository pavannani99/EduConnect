import { prisma } from '@/lib/prisma';

export async function trackUserActivity(userId: string, activity: string) {
  await prisma.userActivity.create({
    data: {
      userId,
      activity,
      timestamp: new Date(),
    },
  });
}

export async function generateReport(userId: string) {
  // Logic to generate user activity report
} 