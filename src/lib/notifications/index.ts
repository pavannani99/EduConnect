import { prisma } from '@/lib/prisma';
import webPush from 'web-push';

// Configure web-push with your VAPID keys
webPush.setVapidDetails(
  'mailto:support@educonnect.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export async function saveSubscription(userId: string, subscription: PushSubscription) {
  await prisma.pushSubscription.create({
    data: {
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
  });
}

export async function sendNotification(userId: string, notification: { title: string; body: string; icon?: string; }) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  const notifications = subscriptions.map(async (subscription) => {
    try {
      await webPush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        },
        JSON.stringify({
          title: notification.title,
          body: notification.body,
          icon: notification.icon || '/icons/icon-192x192.png',
        })
      );
    } catch (error) {
      console.error('Error sending notification:', error);
      // Remove invalid subscriptions
      if ((error as any).statusCode === 410) {
        await prisma.pushSubscription.delete({
          where: { id: subscription.id },
        });
      }
    }
  });

  await Promise.all(notifications);
}

// Notification types
export async function notifyNewAssignment(userId: string, assignmentTitle: string) {
  await sendNotification(userId, {
    title: 'New Assignment',
    body: `A new assignment "${assignmentTitle}" has been posted.`,
  });
}

export async function notifyQuizReminder(userId: string, quizTitle: string, timeLeft: string) {
  await sendNotification(userId, {
    title: 'Quiz Reminder',
    body: `The quiz "${quizTitle}" will start in ${timeLeft}.`,
  });
}

export async function notifyGradedAssignment(userId: string, assignmentTitle: string, grade: number) {
  await sendNotification(userId, {
    title: 'Assignment Graded',
    body: `Your assignment "${assignmentTitle}" has been graded. You received ${grade}%.`,
  });
}

export async function notifyNewComment(userId: string, noteTitle: string, commenterName: string) {
  await sendNotification(userId, {
    title: 'New Comment',
    body: `${commenterName} commented on your note "${noteTitle}".`,
  });
} 