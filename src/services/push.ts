/**
 * Expo Push Notification service
 * Uses Expo's push API (free tier: 500 pushes/day)
 */

import { adminSupabase } from '../lib/db';

interface PushToken {
  expoPushToken: string;
  userId: string;
}

interface ExpoPushResponse {
  status: 'ok' | 'error';
  message?: string;
  errors?: string[];
}

// In-memory store for push tokens (use Redis in production)
const pushTokens = new Map<string, string>();

/**
 * Register a push token for a user
 */
export function registerPushToken(userId: string, token: string) {
  pushTokens.set(userId, token);
  console.log(`[PUSH] Registered token for user ${userId}`);
}

/**
 * Send push notification to a single user
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<void> {
  const token = pushTokens.get(userId);
  if (!token) {
    console.log(`[PUSH] No token for user ${userId}, skipping`);
    return;
  }

  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: token,
        title,
        body,
        data,
        sound: 'default',
        priority: 'high',
      }),
    });

    const result: any = await res.json();
    if (result.status === 'error') {
      console.error('[PUSH] Error:', result.message || result.errors?.join(', '));
    } else {
      console.log(`[PUSH] Sent to ${userId}: ${title}`);
    }
  } catch (err: any) {
    console.error('[PUSH] Failed:', err);
  }
}

/**
 * Send push to multiple users
 */
export async function sendPushToUsers(
  userIds: string[],
  title: string,
  body: string,
  data: Record<string, unknown> = {}
): Promise<void> {
  await Promise.all(
    userIds.map(id => sendPushNotification(id, title, body, data))
  );
}

/**
 * Send SOS push notification
 */
export async function sendSOSPush(
  circleId: string,
  senderName: string,
  latitude: number,
  longitude: number
): Promise<void> {
  const { data: members } = await adminSupabase
    .from('circle_members')
    .select('user_id')
    .eq('circle_id', circleId)
    .eq('status', 'active');

  if (!members) return;

  const mapLink = `https://maps.google.com/?q=${latitude},${longitude}`;
  await sendPushToUsers(
    members.map(m => m.user_id),
    '🚨 SOS Alert',
    `${senderName} necesita ayuda. Toca para ver ubicación.`,
    { type: 'sos', circleId, mapLink: `https://maps.google.com/?q=${latitude},${longitude}` }
  );
}