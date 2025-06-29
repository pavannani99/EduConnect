import webpush from 'web-push';
import { prisma } from '@/lib/prisma';
import { PushSubscription } from '@prisma/client';

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

let isVapidSetup = false;
if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:youremail@example.com', // Replace with your admin email or a valid mailto
    vapidPublicKey,
    vapidPrivateKey
  );
  isVapidSetup = true;
  console.log("VAPID details set for web-push.");
} else {
  console.warn(
    'VAPID keys are not configured. Push notifications will not be sent. ' +
    'Please set NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables.'
  );
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string; // Optional: URL to an icon image
  badge?: string; // Optional: URL to a badge image
  tag?: string; // Optional: A tag to group notifications or replace existing ones
  url?: string; // Optional: URL to open when notification is clicked
  // Add any other custom data you want to send to the service worker
  [key: string]: any;
}

export async function sendNotificationToUser(userId: string, payload: NotificationPayload): Promise<void> {
  if (!isVapidSetup) {
    console.log('VAPID not setup, skipping notification send for user:', userId);
    return;
  }

  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId },
  });

  if (subscriptions.length === 0) {
    console.log('No push subscriptions found for user:', userId);
    return;
  }

  const stringifiedPayload = JSON.stringify(payload);

  const sendPromises = subscriptions.map(async (sub) => {
    // Reconstruct PushSubscription object for web-push library
    const subscriptionDetails: webpush.PushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };

    try {
      console.log(`Attempting to send notification to endpoint for user ${userId}: ${sub.endpoint.substring(0,30)}...`);
      await webpush.sendNotification(subscriptionDetails, stringifiedPayload);
      console.log(`Notification sent successfully to user ${userId}, endpoint ${sub.endpoint.substring(0,30)}...`);
    } catch (error: any) {
      console.error(`Error sending notification to user ${userId}, endpoint ${sub.endpoint.substring(0,30)}...:`, error.statusCode, error.body);
      // Handle errors, e.g., if subscription is no longer valid (error.statusCode 404 or 410)
      if (error.statusCode === 404 || error.statusCode === 410) {
        console.log('Subscription expired or invalidated, removing from DB for endpoint:', sub.endpoint);
        await prisma.pushSubscription.delete({
          where: { id: sub.id }, // Assuming 'id' is the primary key
        });
      }
    }
  });

  await Promise.allSettled(sendPromises);
}

// Example: Send notifications to multiple users (e.g., all members of a classroom)
export async function sendNotificationToUsers(userIds: string[], payload: NotificationPayload): Promise<void> {
  if (!isVapidSetup) {
    console.log('VAPID not setup, skipping notification send for users:', userIds.join(', '));
    return;
  }
  // Batch user IDs to avoid overly large IN clauses if necessary, or fetch in chunks.
  // For simplicity here, fetching all at once.
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
  });

  if (subscriptions.length === 0) {
    console.log('No push subscriptions found for the provided user IDs.');
    return;
  }

  console.log(`Found ${subscriptions.length} subscriptions for ${userIds.length} users.`);

  const stringifiedPayload = JSON.stringify(payload);
  const sendPromises = subscriptions.map(async (sub) => {
    const subscriptionDetails: webpush.PushSubscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    };
    try {
      await webpush.sendNotification(subscriptionDetails, stringifiedPayload);
      console.log(`Notification sent to user ${sub.userId}, endpoint: ${sub.endpoint.substring(0,30)}...`);
    } catch (error: any) {
      console.error(`Error sending notification to user ${sub.userId}, endpoint ${sub.endpoint.substring(0,30)}...:`, error.statusCode, error.body);
      if (error.statusCode === 404 || error.statusCode === 410) {
        console.log('Subscription expired or invalidated, removing from DB for endpoint:', sub.endpoint);
        await prisma.pushSubscription.delete({ where: { id: sub.id } });
      }
    }
  });

  await Promise.allSettled(sendPromises);
}
