// Memberships — simplified: free for all, no payments
import { Router, Request, Response } from 'express';
import { adminSupabase } from '../lib/db';

const router = Router();

// List user's memberships
router.get('/', async (req: Request, res: Response) => {
  const user = (req as any).user;

  const { data: memberships } = await adminSupabase
    .from('memberships')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (!memberships?.length) return res.json([]);

  const circleIds = memberships.map((m: any) => m.circle_id);
  const { data: circles } = await adminSupabase
    .from('circles')
    .select('id, name, join_code')
    .in('id', circleIds);

  const { data: members } = await adminSupabase
    .from('circle_members')
    .select('user_id, circle_id, role, status, joined_at')
    .in('user_id', [user.id])
    .in('circle_id', circleIds);

  const circleMap = new Map((circles ?? []).map((c: any) => [c.id, c]));
  const memberMap = new Map<string, any>();
  for (const m of members ?? []) memberMap.set(`${m.user_id}:${m.circle_id}`, m);

  const shaped = (memberships ?? []).map((m: any) => ({
    ...m,
    circle: circleMap.get(m.circle_id),
    member: memberMap.get(`${m.user_id}:${m.circle_id}`),
  }));

  res.json(shaped);
});

// Get membership for a specific circle
router.get('/:circleId', async (req: Request, res: Response) => {
  const { circleId } = req.params;
  const user = (req as any).user;
  const circleIdStr = circleId as string;

  const { data, error } = await adminSupabase
    .from('memberships')
    .select('*')
    .eq('user_id', user.id)
    .eq('circle_id', circleIdStr)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Membership not found' });

  const { data: circle } = await adminSupabase
    .from('circles')
    .select('id, name, join_code')
    .eq('id', circleIdStr)
    .maybeSingle();

  const { data: member } = await adminSupabase
    .from('circle_members')
    .select('role, status, joined_at')
    .eq('user_id', user.id)
    .eq('circle_id', circleIdStr)
    .maybeSingle();

  res.json({ ...data, circle, member });
});

export default router;
