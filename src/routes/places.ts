import { Router, Request, Response } from 'express';
import { adminSupabase } from '../lib/db';
import { z } from 'zod';

const router = Router();

const createPlaceSchema = z.object({
  name: z.string().min(1).max(50),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z.number().min(50).max(500).default(100),
});

const updatePlaceSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  radiusMeters: z.number().min(50).max(500).optional(),
});

const alertsSchema = z.object({
  arrivalAlert: z.boolean().optional(),
  departureAlert: z.boolean().optional(),
  enabled: z.boolean().optional(),
});

/** Active membership of user in circle, or null. */
async function activeMembership(circleId: string, userId: string) {
  const { data } = await adminSupabase
    .from('circle_members')
    .select('id, role')
    .eq('circle_id', circleId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();
  return data;
}

/**
 * Place count limit by membership tier.
 * memberships has no FK to circle_members, so the tier is read from
 * memberships (user_id + circle_id) directly — not from an embed.
 */
async function tierLimitFor(circleId: string, userId: string): Promise<number> {
  const { data: membership } = await adminSupabase
    .from('memberships')
    .select('tier, status')
    .eq('circle_id', circleId)
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  const tier = membership?.tier ?? 'free';
  if (tier === 'silver') return 5;
  if (tier === 'gold' || tier === 'platinum') return Infinity;
  return 2; // free
}

// GET /api/places/circle/:circleId — list places of a circle
// (separate from GET /:id so the detail route is reachable)
async function listPlaces(req: Request, res: Response) {
  const circleId = req.params.circleId as string;
  const user = (req as any).user;

  const membership = await activeMembership(circleId, user.id);
  if (!membership) return res.status(403).json({ error: 'Not a member of this circle' });

  const { data, error } = await adminSupabase
    .from('places')
    .select(`
      *,
      owner:users(id, name, avatar_url),
      alerts:place_alerts(*)
    `)
    .eq('circle_id', circleId)
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data ?? []);
}

router.get('/circle/:circleId', listPlaces);

// POST /api/places/circle/:circleId (alias: POST /api/places/:circleId)
async function createPlace(req: Request, res: Response) {
  const circleId = req.params.circleId as string;
  const user = (req as any).user;
  const body = createPlaceSchema.parse(req.body);

  const membership = await activeMembership(circleId, user.id);
  if (!membership) return res.status(403).json({ error: 'Not a member of this circle' });

  const maxPlaces = await tierLimitFor(circleId, user.id);
  const { count } = await adminSupabase
    .from('places')
    .select('id', { count: 'exact', head: true })
    .eq('circle_id', circleId);
  const placesCount = Number(count) || 0;

  if (placesCount >= maxPlaces) {
    return res.status(402).json({
      error: `Límite de ${maxPlaces} lugares alcanzado. Actualiza tu plan para más.`,
      limit: maxPlaces,
    });
  }

  // Check duplicate name (constraint is not enforced in DB — add validation here)
  const { data: exists } = await adminSupabase
    .from('places')
    .select('id')
    .eq('circle_id', circleId)
    .eq('name', body.name)
    .maybeSingle();

  if (exists) {
    return res.status(409).json({ error: 'Ya existe un lugar con ese nombre en este círculo' });
  }

  const { data, error } = await adminSupabase
    .from('places')
    .insert({
      circle_id: circleId,
      owner_id: user.id,
      name: body.name,
      latitude: String(body.latitude),
      longitude: String(body.longitude),
      radius_meters: body.radiusMeters,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un lugar con ese nombre en este círculo' });
    }
    console.error('[PLACES POST] insert error:', JSON.stringify(error));
    return res.status(500).json({ error: error.message });
  }

  // Default alerts for the new place
  const { error: alertError } = await adminSupabase.from('place_alerts').insert({
    place_id: data.id,
    circle_id: circleId,
    user_id: user.id,
    arrival_alert: true,
    departure_alert: true,
    enabled: true,
  });
  if (alertError) console.error('[PLACES POST] alert error:', JSON.stringify(alertError));

  res.status(201).json(data);
}

router.post('/circle/:circleId', createPlace);
router.post('/:circleId', createPlace); // backwards-compatible alias

// GET /api/places/:id — place detail
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  const { data, error } = await adminSupabase
    .from('places')
    .select(`
      *,
      owner:users(id, name, avatar_url),
      alerts:place_alerts(*)
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Place not found' });

  const membership = await activeMembership(data.circle_id, user.id);
  if (!membership) return res.status(403).json({ error: 'Not a member of this circle' });

  res.json(data);
});

// PATCH /api/places/:id — update place (owner or circle admin)
router.patch('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  const body = updatePlaceSchema.parse(req.body);

  const { data: place } = await adminSupabase
    .from('places')
    .select('circle_id, owner_id')
    .eq('id', id)
    .maybeSingle();

  if (!place) return res.status(404).json({ error: 'Place not found' });

  const membership = await activeMembership(place.circle_id, user.id);
  if (!membership) return res.status(403).json({ error: 'Not a member of this circle' });
  if (place.owner_id !== user.id && membership.role !== 'admin') {
    return res.status(403).json({ error: 'Only the creator can edit this place' });
  }

  // places table has no updated_at column
  const update: Record<string, unknown> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.latitude !== undefined) update.latitude = String(body.latitude);
  if (body.longitude !== undefined) update.longitude = String(body.longitude);
  if (body.radiusMeters !== undefined) update.radius_meters = body.radiusMeters;

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  const { data, error } = await adminSupabase
    .from('places')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un lugar con ese nombre en este círculo' });
    }
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

// DELETE /api/places/:id — delete place (owner or circle admin)
router.delete('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  const { data: place } = await adminSupabase
    .from('places')
    .select('circle_id, owner_id')
    .eq('id', id)
    .maybeSingle();

  if (!place) return res.status(404).json({ error: 'Place not found' });

  const membership = await activeMembership(place.circle_id, user.id);
  if (!membership || (place.owner_id !== user.id && membership.role !== 'admin')) {
    return res.status(403).json({ error: 'No permission' });
  }

  const { error } = await adminSupabase.from('places').delete().eq('id', id);
  if (error) return res.status(500).json({ error: error.message });

  res.json({ success: true });
});

// POST /api/places/:id/alerts — configure arrival/departure alerts
router.post('/:id/alerts', async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  const body = alertsSchema.parse(req.body);

  const { data: place } = await adminSupabase
    .from('places')
    .select('circle_id')
    .eq('id', id)
    .maybeSingle();

  if (!place) return res.status(404).json({ error: 'Place not found' });

  const membership = await activeMembership(place.circle_id, user.id);
  if (!membership) return res.status(403).json({ error: 'Not a member of this circle' });

  // place_alerts has no unique constraint on place_id → read-then-write
  const { data: existing } = await adminSupabase
    .from('place_alerts')
    .select('id')
    .eq('place_id', id)
    .maybeSingle();

  const payload = {
    place_id: id,
    circle_id: place.circle_id,
    user_id: user.id,
    arrival_alert: body.arrivalAlert ?? true,
    departure_alert: body.departureAlert ?? true,
    enabled: body.enabled ?? true,
  };

  const { data, error } = existing
    ? await adminSupabase.from('place_alerts').update(payload).eq('id', existing.id).select().single()
    : await adminSupabase.from('place_alerts').insert(payload).select().single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

export default router;
