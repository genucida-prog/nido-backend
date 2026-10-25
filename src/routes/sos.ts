import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { adminSupabase } from '../lib/db';

const router = Router();

const triggerSosSchema = z.object({
  circleId: z.string().uuid(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

/** Active membership id of user in circle, or null. */
async function activeMemberId(circleId: string, userId: string): Promise<string | null> {
  const { data } = await adminSupabase
    .from('circle_members')
    .select('id')
    .eq('circle_id', circleId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  return data?.id ?? null;
}

// ── POST /api/sos/trigger ────────────────────────────────────────────────────
router.post('/trigger', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { circleId, latitude, longitude } = triggerSosSchema.parse(req.body);

  const memberId = await activeMemberId(circleId, user.id);
  if (!memberId) return res.status(403).json({ error: 'Not a member of this circle' });

  const { data: sos, error } = await adminSupabase
    .from('sos_alerts')
    .insert({
      circle_id: circleId,
      initiator_id: memberId,
      location_lat: String(latitude),
      location_lon: String(longitude),
      status: 'triggered',
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  // Notify all circle members (except initiator) via notifications table
  const { data: members } = await adminSupabase
    .from('circle_members')
    .select('user_id')
    .eq('circle_id', circleId)
    .eq('status', 'active')
    .neq('id', memberId);

  if (members) {
    await adminSupabase.from('notifications').insert(
      members.map((m) => ({
        circle_id: circleId,
        user_id: m.user_id,
        type: 'sos',
        title: `SOS de ${user.name}`,
        body: `Un miembro ha activado una alerta SOS. Ubicación: https://maps.google.com/?q=${latitude},${longitude}`,
        data: { sosId: sos.id, latitude, longitude },
      }))
    );
  }

  res.status(201).json(sos);
});

// ── POST /api/sos/:id/acknowledge ───────────────────────────────────────────
router.post('/:id/acknowledge', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;

  // Verify user is a member of the same circle as the SOS
  const { data: sos, error: fetchErr } = await adminSupabase
    .from('sos_alerts')
    .select('circle_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) return res.status(500).json({ error: fetchErr.message });
  if (!sos) return res.status(404).json({ error: 'SOS not found' });

  const memberId = await activeMemberId(sos.circle_id, user.id);
  if (!memberId) return res.status(403).json({ error: 'Not a member of this circle' });

  const { data, error } = await adminSupabase
    .from('sos_alerts')
    .update({
      status: 'acknowledged',
      acknowledged_by: memberId,
      acknowledged_at: new Date(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── POST /api/sos/:id/resolve ───────────────────────────────────────────────
router.post('/:id/resolve', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;

  const { data: sos, error: fetchErr } = await adminSupabase
    .from('sos_alerts')
    .select('circle_id')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) return res.status(500).json({ error: fetchErr.message });
  if (!sos) return res.status(404).json({ error: 'SOS not found' });

  const memberId = await activeMemberId(sos.circle_id, user.id);
  if (!memberId) return res.status(403).json({ error: 'Not a member of this circle' });

  const { data, error } = await adminSupabase
    .from('sos_alerts')
    .update({
      status: 'resolved',
      resolved_at: new Date(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ── GET /api/sos/circle/:circleId ────────────────────────────────────────────
router.get('/circle/:circleId', async (req: Request, res: Response) => {
  const circleId = req.params.circleId as string;
  const user = (req as any).user;

  const memberId = await activeMemberId(circleId, user.id);
  if (!memberId) return res.status(403).json({ error: 'Not a member of this circle' });

  const { data: sosList, error } = await adminSupabase
    .from('sos_alerts')
    .select('*')
    .eq('circle_id', circleId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return res.status(500).json({ error: error.message });
  if (!sosList?.length) return res.json([]);

  // Fetch initiator info in a single query (avoid PostgREST embed ambiguity with 2 FKs)
  const initiatorIds = [...new Set(sosList.map((s) => s.initiator_id))];
  const { data: initiators } = await adminSupabase
    .from('circle_members')
    .select(`id, users(id, name, avatar_url)`)
    .in('id', initiatorIds);

  const initiatorMap = new Map((initiators ?? []).map((m) => [m.id, m]));

  const shaped = sosList.map((sos) => {
    const initiator = initiatorMap.get(sos.initiator_id);
    return { ...sos, initiator };
  });

  res.json(shaped);
});

export default router;
