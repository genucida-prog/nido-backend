"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../lib/db");
const geo_1 = require("../services/geo");
const router = (0, express_1.Router)();
const startDriveSchema = zod_1.z.object({
    circleId: zod_1.z.string().uuid(),
});
const endDriveSchema = zod_1.z.object({
    driveId: zod_1.z.string().uuid(),
    distanceMeters: zod_1.z.number().int().positive().optional(),
    avgSpeedKmh: zod_1.z.number().min(0).max(500).optional(),
    maxSpeedKmh: zod_1.z.number().min(0).max(500).optional(),
});
const createEventSchema = zod_1.z.object({
    eventType: zod_1.z.enum(['hard_brake', 'rapid_accel', 'speeding', 'phone_use', 'fatigue']),
    severity: zod_1.z.number().int().min(1).max(10).default(1),
    description: zod_1.z.string().max(500).optional(),
});
/** Return active membership id of user in circle, or null. */
async function activeMemberId(circleId, userId) {
    const { data } = await db_1.adminSupabase
        .from('circle_members')
        .select('id')
        .eq('circle_id', circleId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle();
    return data?.id ?? null;
}
// ── POST /api/drives/start ──────────────────────────────────────────────────
router.post('/start', async (req, res) => {
    const user = req.user;
    const { circleId } = startDriveSchema.parse(req.body);
    const memberId = await activeMemberId(circleId, user.id);
    if (!memberId)
        return res.status(403).json({ error: 'Not a member of this circle' });
    // Close any open drive first (idempotent start)
    await db_1.adminSupabase
        .from('drives')
        .update({ ended_at: new Date() })
        .eq('circle_member_id', memberId)
        .is('ended_at', null);
    const { data, error } = await db_1.adminSupabase
        .from('drives')
        .insert({ circle_member_id: memberId, started_at: new Date() })
        .select()
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.status(201).json(data);
});
// ── POST /api/drives/end ────────────────────────────────────────────────────
router.post('/end', async (req, res) => {
    const user = req.user;
    const { driveId, distanceMeters, avgSpeedKmh, maxSpeedKmh } = endDriveSchema.parse(req.body);
    const { data: drive, error: findErr } = await db_1.adminSupabase
        .from('drives')
        .select('circle_member_id, started_at')
        .eq('id', driveId)
        .maybeSingle();
    if (findErr)
        return res.status(500).json({ error: findErr.message });
    if (!drive)
        return res.status(404).json({ error: 'Drive not found' });
    // Verify ownership: drive's member must belong to a circle the caller is in
    const { data: membership } = await db_1.adminSupabase
        .from('circle_members')
        .select('circle_id')
        .eq('id', drive.circle_member_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
    if (!membership)
        return res.status(403).json({ error: "You don't own this drive" });
    const endedAt = new Date();
    const startedAt = new Date(drive.started_at);
    const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);
    // Fetch events recorded during this drive
    const { data: events } = await db_1.adminSupabase
        .from('drive_events')
        .select('event_type, severity')
        .eq('drive_id', driveId)
        .order('detected_at');
    const score = (0, geo_1.calculateDrivingScore)(durationSeconds, (events ?? []).map(e => ({ type: e.event_type, severity: e.severity })));
    const { data: updated, error: updateErr } = await db_1.adminSupabase
        .from('drives')
        .update({
        ended_at: endedAt,
        duration_seconds: durationSeconds,
        driving_score: score,
        distance_meters: distanceMeters,
        avg_speed_kmh: avgSpeedKmh,
        max_speed_kmh: maxSpeedKmh,
    })
        .eq('id', driveId)
        .select()
        .single();
    if (updateErr)
        return res.status(500).json({ error: updateErr.message });
    res.json({ ...updated, score, durationSeconds, events: events ?? [] });
});
// ── GET /api/drives/circle/:circleId ────────────────────────────────────────
router.get('/circle/:circleId', async (req, res) => {
    const circleId = req.params.circleId;
    const user = req.user;
    const memberId = await activeMemberId(circleId, user.id);
    if (!memberId)
        return res.status(403).json({ error: 'Not a member of this circle' });
    // Fetch drive ids for all active members of this circle
    const { data: members, error: memErr } = await db_1.adminSupabase
        .from('circle_members')
        .select('id, users(id, name, avatar_url)')
        .eq('circle_id', circleId)
        .eq('status', 'active');
    if (memErr)
        return res.status(500).json({ error: memErr.message });
    if (!members?.length)
        return res.json([]);
    const memberIds = members.map((m) => m.id);
    const { data, error } = await db_1.adminSupabase
        .from('drives')
        .select('*')
        .in('circle_member_id', memberIds)
        .order('started_at', { ascending: false })
        .limit(50);
    if (error)
        return res.status(500).json({ error: error.message });
    const shaped = (data ?? []).map((d) => {
        const member = members.find((m) => m.id === d.circle_member_id);
        return { ...d, member };
    });
    res.json(shaped);
});
// ── GET /api/drives/:driveId/events ─────────────────────────────────────────
router.get('/:driveId/events', async (req, res) => {
    const { driveId } = req.params;
    const user = req.user;
    // Verify drive ownership via circle membership
    const { data: drive } = await db_1.adminSupabase
        .from('drives')
        .select('circle_member_id')
        .eq('id', driveId)
        .maybeSingle();
    if (!drive)
        return res.status(404).json({ error: 'Drive not found' });
    const { data: membership } = await db_1.adminSupabase
        .from('circle_members')
        .select('id')
        .eq('id', drive.circle_member_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
    if (!membership)
        return res.status(403).json({ error: "You don't have access to this drive" });
    const { data, error } = await db_1.adminSupabase
        .from('drive_events')
        .select('*')
        .eq('drive_id', driveId)
        .order('detected_at');
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data ?? []);
});
// ── POST /api/drives/:driveId/events ────────────────────────────────────────
router.post('/:driveId/events', async (req, res) => {
    const { driveId } = req.params;
    const user = req.user;
    const event = createEventSchema.parse(req.body);
    const { data: drive } = await db_1.adminSupabase
        .from('drives')
        .select('circle_member_id')
        .eq('id', driveId)
        .maybeSingle();
    if (!drive)
        return res.status(404).json({ error: 'Drive not found' });
    const { data: membership } = await db_1.adminSupabase
        .from('circle_members')
        .select('id')
        .eq('id', drive.circle_member_id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
    if (!membership)
        return res.status(403).json({ error: "You don't have access to this drive" });
    const { data, error } = await db_1.adminSupabase
        .from('drive_events')
        .insert({
        drive_id: driveId,
        event_type: event.eventType,
        detected_at: new Date(),
        severity: event.severity,
        description: event.description ?? null,
    })
        .select()
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.status(201).json(data);
});
exports.default = router;
