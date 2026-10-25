"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../lib/db");
const router = (0, express_1.Router)();
const locationSchema = zod_1.z.object({
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    batteryLevel: zod_1.z.number().int().min(0).max(100).nullish(),
    isCharging: zod_1.z.boolean().optional(),
});
/**
 * Update current user's location in every circle they belong to.
 * POST /api/locations/update
 */
router.post('/update', async (req, res) => {
    const user = req.user;
    const parsed = locationSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            error: 'Validation failed',
            issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })),
        });
    }
    const { latitude, longitude, batteryLevel, isCharging } = parsed.data;
    // All active circle memberships of this user
    const { data: memberships, error: memError } = await db_1.adminSupabase
        .from('circle_members')
        .select('id, circle_id')
        .eq('user_id', user.id)
        .eq('status', 'active');
    if (memError)
        return res.status(500).json({ error: memError.message });
    if (!memberships?.length)
        return res.json({ message: 'No active circles', updated: 0 });
    const now = new Date();
    let updated = 0;
    for (const mem of memberships) {
        // member_locations has no unique constraint on circle_member_id, so we
        // cannot use upsert(onConflict) — read-then-write instead.
        const { data: existing } = await db_1.adminSupabase
            .from('member_locations')
            .select('id')
            .eq('circle_member_id', mem.id)
            .maybeSingle();
        const payload = {
            latitude: String(latitude),
            longitude: String(longitude),
            battery_level: batteryLevel ?? null,
            charging: isCharging ?? false,
            is_online: true,
            last_seen_at: now,
            updated_at: now,
        };
        const { error } = existing
            ? await db_1.adminSupabase.from('member_locations').update(payload).eq('id', existing.id)
            : await db_1.adminSupabase.from('member_locations').insert({
                ...payload,
                circle_member_id: mem.id,
            });
        if (error) {
            console.error('[LOCATIONS] write failed:', JSON.stringify(error));
        }
        else {
            updated++;
        }
    }
    res.json({ message: 'Location updated', updated });
});
/**
 * Live locations of a circle. Membership is checked first, then locations are
 * fetched with an explicit member-id filter (no reliance on embedded filters,
 * so other circles' positions can never leak in).
 * GET /api/locations/:circleId
 */
router.get('/:circleId/locations', handler);
router.get('/:circleId', handler);
async function handler(req, res) {
    const { circleId } = req.params;
    const user = req.user;
    const { data: membership } = await db_1.adminSupabase
        .from('circle_members')
        .select('id')
        .eq('circle_id', circleId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .maybeSingle();
    if (!membership) {
        return res.status(403).json({ error: 'Not a member of this circle' });
    }
    // Active member ids of this circle
    const { data: members, error: membersError } = await db_1.adminSupabase
        .from('circle_members')
        .select('id, role, users(id, name, avatar_url)')
        .eq('circle_id', circleId)
        .eq('status', 'active');
    if (membersError)
        return res.status(500).json({ error: membersError.message });
    if (!members?.length)
        return res.json([]);
    const ids = members.map((m) => m.id);
    const { data, error } = await db_1.adminSupabase
        .from('member_locations')
        .select('*')
        .in('circle_member_id', ids)
        .order('last_seen_at', { ascending: false });
    if (error)
        return res.status(500).json({ error: error.message });
    // Shape: join location + member info for the map
    const shaped = (data ?? []).map((loc) => {
        const member = members.find((m) => m.id === loc.circle_member_id);
        return { ...loc, circle_member: member ?? null };
    });
    res.json(shaped);
}
exports.default = router;
