"use strict";
/**
 * Expo Push Notification service
 * Uses Expo's push API (free tier: 500 pushes/day)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPushToken = registerPushToken;
exports.sendPushNotification = sendPushNotification;
exports.sendPushToUsers = sendPushToUsers;
exports.sendSOSPush = sendSOSPush;
const db_1 = require("../lib/db");
// In-memory store for push tokens (use Redis in production)
const pushTokens = new Map();
/**
 * Register a push token for a user
 */
function registerPushToken(userId, token) {
    pushTokens.set(userId, token);
    console.log(`[PUSH] Registered token for user ${userId}`);
}
/**
 * Send push notification to a single user
 */
async function sendPushNotification(userId, title, body, data = {}) {
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
        const result = await res.json();
        if (result.status === 'error') {
            console.error('[PUSH] Error:', result.message || result.errors?.join(', '));
        }
        else {
            console.log(`[PUSH] Sent to ${userId}: ${title}`);
        }
    }
    catch (err) {
        console.error('[PUSH] Failed:', err);
    }
}
/**
 * Send push to multiple users
 */
async function sendPushToUsers(userIds, title, body, data = {}) {
    await Promise.all(userIds.map(id => sendPushNotification(id, title, body, data)));
}
/**
 * Send SOS push notification
 */
async function sendSOSPush(circleId, senderName, latitude, longitude) {
    const { data: members } = await db_1.adminSupabase
        .from('circle_members')
        .select('user_id')
        .eq('circle_id', circleId)
        .eq('status', 'active');
    if (!members)
        return;
    const mapLink = `https://maps.google.com/?q=${latitude},${longitude}`;
    await sendPushToUsers(members.map(m => m.user_id), '🚨 SOS Alert', `${senderName} necesita ayuda. Toca para ver ubicación.`, { type: 'sos', circleId, mapLink: `https://maps.google.com/?q=${latitude},${longitude}` });
}
