import webpush from 'web-push';

export function isPushConfigured() {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.NEXT_PUBLIC_BASE_URL);
}

function configureWebPush() {
  if (!isPushConfigured()) return false;
  webpush.setVapidDetails(
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  return true;
}

export async function sendPushNotifications({ subscriptions, title, body, url }) {
  if (!subscriptions || subscriptions.length === 0) return;
  if (!configureWebPush()) return;
  const payload = JSON.stringify({ title, body, url });
  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        payload
      );
    } catch (error) {
      console.error('Push send failed', error);
    }
  }
}
