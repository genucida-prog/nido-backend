"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Memberships — simplified: free for all, no payments
const express_1 = require("express");
const db_1 = require("../lib/db");
const router = (0, express_1.Router)();
// List user's memberships
router.get('/', async (req, res) => {
    const user = req.user;
    const { data: memberships } = await db_1.adminSupabase
        .from('memberships')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
    if (!memberships?.length)
        return res.json([]);
    const circleIds = memberships.map((m) => m.circle_id);
    const { data: circles } = await db_1.adminSupabase
        .from('circles')
        .select('id, name, join_code')
        .in('id', circleIds);
    const { data: members } = await db_1.adminSupabase
        .from('circle_members')
        .select('user_id, circle_id, role, status, joined_at')
        .in('user_id', [user.id])
        .in('circle_id', circleIds);
    const circleMap = new Map((circles ?? []).map((c) => [c.id, c]));
    const memberMap = new Map();
    for (const m of members ?? [])
        memberMap.set(`${m.user_id}:${m.circle_id}`, m);
    const shaped = (memberships ?? []).map((m) => ({
        ...m,
        circle: circleMap.get(m.circle_id),
        member: memberMap.get(`${m.user_id}:${m.circle_id}`),
    }));
    res.json(shaped);
});
// Get membership for a specific circle
router.get('/:circleId', async (req, res) => {
    const { circleId } = req.params;
    const user = req.user;
    const circleIdStr = circleId;
    const { data, error } = await db_1.adminSupabase
        .from('memberships')
        .select('*')
        .eq('user_id', user.id)
        .eq('circle_id', circleIdStr)
        .maybeSingle();
    if (error)
        return res.status(500).json({ error: error.message });
    if (!data)
        return res.status(404).json({ error: 'Membership not found' });
    const { data: circle } = await db_1.adminSupabase
        .from('circles')
        .select('id, name, join_code')
        .eq('id', circleIdStr)
        .maybeSingle();
    const { data: member } = await db_1.adminSupabase
        .from('circle_members')
        .select('role, status, joined_at')
        .eq('user_id', user.id)
        .eq('circle_id', circleIdStr)
        .maybeSingle();
    res.json({ ...data, circle, member });
});
exports.default = router;
