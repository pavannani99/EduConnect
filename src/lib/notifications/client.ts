// src/lib/notifications/client.ts

// TODO: Replace with your actual VAPID public key stored in environment variables
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'YOUR_PUBLIC_VAPID_KEY_HERE';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Worker not supported in this browser.');
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered with scope:', registration.scope);
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported in this browser.');
    return 'denied';
  }
  const permission = await Notification.requestPermission();
  console.log('Notification permission status:', permission);
  return permission;
}

export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!VAPID_PUBLIC_KEY || VAPID_PUBLIC_KEY === 'YOUR_PUBLIC_VAPID_KEY_HERE') {
    console.error("VAPID public key is not defined. Please set NEXT_PUBLIC_VAPID_PUBLIC_KEY environment variable.");
    alert("Push notification setup is incomplete on the server. Please contact support."); // User-facing alert
    return null;
  }

  const registration = await navigator.serviceWorker.ready; // Ensures SW is active
  if (!registration.pushManager) {
    console.warn('Push Manager not supported in this browser.');
    return null;
  }

  try {
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('User is already subscribed:', existingSubscription);
      // Optionally, you might want to send it to the backend again to ensure it's current
      // await sendSubscriptionToBackend(existingSubscription);
      return existingSubscription;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    console.log('User subscribed successfully:', subscription);
    await sendSubscriptionToBackend(subscription);
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    if (Notification.permission === 'denied') {
        console.warn('Notification permission was denied.');
    }
    return null;
  }
}

export async function sendSubscriptionToBackend(subscription: PushSubscription): Promise<Response | null> {
  try {
    const response = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription.toJSON()), // .toJSON() is important
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send subscription to backend');
    }
    console.log('Subscription sent to backend successfully.');
    return response;
  } catch (error) {
    console.error('Error sending subscription to backend:', error);
    return null;
  }
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  const registration = await navigator.serviceWorker.ready;
  if (!registration.pushManager) {
    console.warn('Push Manager not supported.');
    return false;
  }

  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    console.log('Not subscribed, so no need to unsubscribe.');
    return true;
  }

  try {
    const successfulUnsubscription = await subscription.unsubscribe();
    if (successfulUnsubscription) {
      console.log('Unsubscribed successfully from browser.');
      // Now remove from backend
      await removeSubscriptionFromBackend(subscription);
    }
    return successfulUnsubscription;
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return false;
  }
}

async function removeSubscriptionFromBackend(subscription: PushSubscription): Promise<Response | null> {
    try {
    const response = await fetch('/api/notifications/subscribe', { // Using the same endpoint with DELETE method
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to remove subscription from backend');
    }
    console.log('Subscription removed from backend successfully.');
    return response;
  } catch (error) {
    console.error('Error removing subscription from backend:', error);
    return null;
  }
}

// Function to be called, for example, in a useEffect hook in a layout or settings component
export const initializePushNotifications = async () => {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) {
    await registerServiceWorker();
    // Only try to subscribe if permission is already granted, or prompt if not determined.
    // Avoid prompting immediately on load without user interaction.
    // This function can be called upon a user action, e.g., clicking a "Enable Notifications" button.
    if (Notification.permission === 'granted') {
      await subscribeToPushNotifications();
    } else if (Notification.permission === 'default') {
      console.log("Notification permission is default. User can be prompted via UI interaction.");
    } else {
      console.log("Notification permission is denied.");
    }
  } else {
    console.warn('Push notifications are not fully supported in this browser or environment.');
  }
};
