"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.haversineDistance = haversineDistance;
exports.isInsideGeofence = isInsideGeofence;
exports.processPlaceAlerts = processPlaceAlerts;
exports.calculateDrivingScore = calculateDrivingScore;
const db_1 = require("../lib/db");
/**
 * Calculate distance in meters between two GPS points (Haversine formula)
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
/**
 * Check if a member's location is inside a place's geofence
 */
function isInsideGeofence(memberLat, memberLon, placeLat, placeLon, radiusMeters) {
    const dist = haversineDistance(memberLat, memberLon, placeLat, placeLon);
    return dist <= radiusMeters;
}
/**
 * Process place alerts for a location update
 * Called when a member updates their location
 */
async function processPlaceAlerts(circleMemberId, latitude, longitude) {
    // Get all active place alerts for this member's circles
    const { data: alerts, error } = await db_1.adminSupabase
        .from('place_alerts')
        .select(`
      *,
      place:places(latitude, longitude, radius_meters, name, circle_id),
      circle_members(circle_id, user_id)
    `)
        .eq('enabled', true);
    if (error || !alerts)
        return;
    for (const alert of alerts) {
        const place = alert.place;
        if (!place)
            continue;
        const inside = isInsideGeofence(latitude, longitude, parseFloat(place.latitude), parseFloat(place.longitude), place.radius_meters);
        // Check if this is a transition (was outside, now inside, or vice versa)
        // For simplicity: send alert on entry
        if (inside && alert.arrival_alert) {
            // Send notification to all circle members except the one who triggered
            const { data: circleMembers } = await db_1.adminSupabase
                .from('circle_members')
                .select('user_id')
                .eq('circle_id', place.circle_id)
                .neq('user_id', alert.user_id);
            if (circleMembers) {
                for (const member of circleMembers) {
                    await db_1.adminSupabase.from('notifications').insert({
                        circle_id: place.circle_id,
                        user_id: member.user_id,
                        type: 'place_alert',
                        title: `Llegó a ${place.name}`,
                        body: `${alert.user_id === member.user_id ? 'Tú' : 'Un miembro'} llegó a ${place.name}`,
                        data: { placeId: place.id, placeName: place.name },
                    });
                }
            }
        }
    }
}
/**
 * Calculate driving score based on events
 * Returns 0-100, higher is safer
 */
function calculateDrivingScore(durationSeconds, events) {
    let score = 100;
    const penalties = {
        hard_brake: 8,
        rapid_accel: 6,
        speeding: 10,
        phone_use: 15,
        fatigue: 12,
    };
    for (const event of events) {
        score -= penalties[event.type] ?? 5;
    }
    // Bonus for longer smooth drives
    if (durationSeconds > 1800)
        score += 5; // 30 min+ smooth drive
    return Math.max(0, Math.min(100, Math.round(score)));
}
