import { Router, Request, Response } from 'express';
import { adminSupabase } from '../lib/db';
import { z } from 'zod';

const router = Router();
const createCircleSchema = z.object({
  name: z.string().min(1).max(50),
});

router.get('/', async (req: Request, res: Response) => {
  const user = (req as any).user;

  // Get the circles the user is an active member of (admin client bypasses RLS)
  const { data: myMemberships } = await adminSupabase
    .from('circle_members')
    .select('circle_id')
    .eq('user_id', user.id)
    .eq('status', 'active');

  const circleIds = (myMemberships ?? []).map((m) => m.circle_id);

  // Valid PostgREST OR filter: only columns of the same table (circles)
  const filter = circleIds.length
    ? `id.in.(${circleIds.join(',')}),created_by.eq.${user.id}`
    : `created_by.eq.${user.id}`;

  const { data, error } = await adminSupabase
    .from('circles')
    .select(`
      *,
      circle_members (
        id, role, status,
        users (id, name, avatar_url)
      ),
      memberships (tier, status)
    `)
    .or(filter)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
});

router.post('/', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { name } = createCircleSchema.parse(req.body);

  const { data, error } = await adminSupabase
    .from('circles')
    .insert([{ name, created_by: user.id }])
    .select()
    .single();

  if (error) {
    console.error('[CIRCLES POST] insert error:', JSON.stringify(error));
    return res.status(400).json({ error: error.message });
  }
  if (!data) return res.status(500).json({ error: 'Failed to create circle' });

  // Add creator as admin
  const { error: memberErr } = await adminSupabase.from('circle_members').insert({
    circle_id: data.id,
    user_id: user.id,
    role: 'admin',
  });
  if (memberErr) {
    console.error('[CIRCLES POST] member insert error:', JSON.stringify(memberErr));
    return res.status(500).json({ error: `Circle created but member setup failed: ${memberErr.message}` });
  }

  // Create free membership
  const { error: membershipErr } = await adminSupabase.from('memberships').insert({
    user_id: user.id,
    circle_id: data.id,
    tier: 'free',
    status: 'active',
  });
  if (membershipErr) {
    console.error('[CIRCLES POST] membership insert error:', JSON.stringify(membershipErr));
    // Non-fatal: circle + admin member already exist
  }

  res.status(201).json(data);
});

export default router;