import { prisma } from '@/lib/prisma';
import { UserActivity, AnalyticsReport, UserRole } from '@prisma/client'; // Import UserRole if needed for reports

// Enhanced trackUserActivity function
export async function trackUserActivity(
  userId: string,
  type: string, // Changed 'activity' to 'type' to match UserActivity model more closely
  duration?: number, // Optional duration in seconds
  metadata?: Record<string, any> // Optional metadata as a JSON-compatible object
): Promise<UserActivity | null> {
  try {
    const activity = await prisma.userActivity.create({
      data: {
        userId,
        type,
        duration,
        metadata,
        timestamp: new Date(),
      },
    });
    return activity;
  } catch (error) {
    console.error("Error tracking user activity:", error);
    return null;
  }
}

// Implementation for generateReport
// This is a simplified example; a real report might be more complex or aggregate over specific periods.
export async function generateAndStoreWeeklyReport(userId: string, reportType: string = "WEEKLY_SUMMARY"): Promise<AnalyticsReport | null> {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const activitiesLastWeek = await prisma.userActivity.findMany({
      where: {
        userId,
        timestamp: {
          gte: oneWeekAgo,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    if (activitiesLastWeek.length === 0) {
      console.log(`No activity found for user ${userId} in the last week. Report not generated.`);
      return null;
    }

    // Basic aggregations for the report
    const totalActivities = activitiesLastWeek.length;
    const timeSpentMs = activitiesLastWeek.reduce((sum, act) => sum + (act.duration ? act.duration * 1000 : 0), 0); // Assuming duration is in seconds

    const activityTypes = new Set(activitiesLastWeek.map(a => a.type));

    const logins = activitiesLastWeek.filter(a => a.type === 'USER_LOGIN').length;
    // More detailed aggregations can be added here from advanced.ts or similar logic

    const reportData = {
      period: {
        from: oneWeekAgo.toISOString(),
        to: new Date().toISOString(),
      },
      summary: {
        totalActivities,
        distinctActivityTypes: Array.from(activityTypes),
        totalTimeSpentMinutes: Math.round(timeSpentMs / (1000 * 60)),
        logins,
      },
      // Potentially include top 3 activities, etc.
      // For a more detailed report, you might call functions from advanced.ts here
      // and structure the data accordingly.
    };

    const report = await prisma.analyticsReport.create({
      data: {
        userId,
        type: reportType,
        data: reportData, // Prisma expects Json type here
      },
    });
    console.log(`Generated ${reportType} for user ${userId}`);
    return report;

  } catch (error) {
    console.error(`Error generating ${reportType} for user ${userId}:`, error);
    return null;
  }
}

// Example of how you might trigger report generation (e.g., after a user logs in, or via a cron job)
export async function triggerReportGenerationForUser(userId: string) {
    // Potentially check if a report was generated recently to avoid too frequent generations
    const lastReport = await prisma.analyticsReport.findFirst({
        where: { userId, type: "WEEKLY_SUMMARY" },
        orderBy: { createdAt: 'desc' }
    });

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() -1);

    // Only generate if no report exists or the last one is older than a day (or week, depending on policy)
    if (!lastReport || lastReport.createdAt < oneDayAgo) {
        await generateAndStoreWeeklyReport(userId, "WEEKLY_SUMMARY");
    } else {
        console.log(`Weekly summary for user ${userId} is recent. Skipping generation.`);
    }
} 