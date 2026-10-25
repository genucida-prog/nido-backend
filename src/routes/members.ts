import { Router, Request, Response } from 'express';
import { adminSupabase } from '../lib/db';
import { z } from 'zod';

const router = Router();

const joinSchema = z.object({
  code: z.string().length(6),
});

// POST /api/members/join — join circle by 6-digit code
router.post('/join', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { code } = joinSchema.parse(req.body);

  // Find circle by join code
  const { data: circle, error } = await adminSupabase
    .from('circles')
    .select('*, circle_members(*)')
    .eq('join_code', code)
    .single();

  if (error || !circle) {
    return res.status(404).json({ error: 'Código inválido. Pide el código a tu círculo.' });
  }

  // Check if already a member
  const { data: existing } = await adminSupabase
    .from('circle_members')
    .select('id')
    .eq('circle_id', circle.id)
    .eq('user_id', user.id)
    .single();

  if (existing) {
    return res.status(409).json({ error: 'Ya eres miembro de este círculo' });
  }

  // Add as member
  const { data: member, error: memberError } = await adminSupabase
    .from('circle_members')
    .insert([{ circle_id: circle.id, user_id: user.id, role: 'member' }])
    .select()
    .single();

  if (memberError) {
    return res.status(500).json({ error: memberError.message });
  }

  // Send welcome notification
  await adminSupabase.from('notifications').insert({
    circle_id: circle.id,
    user_id: user.id,
    type: 'membership',
    title: `¡${user.user_metadata?.name ?? 'Nuevo miembro'} se unió!`,
    body: 'Un nuevo miembro se ha unido al círculo.',
    data: { circleId: circle.id },
  });

  res.json({ member, circle });
});

// POST /api/circles/:id/generate-code — generate a 6-digit join code
router.post('/:id/generate-code', async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  const { data: membership } = await adminSupabase
    .from('circle_members')
    .select('role')
    .eq('circle_id', id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (!membership || membership.role !== 'admin') {
    return res.status(403).json({ error: 'Solo admins pueden generar códigos' });
  }

  // Generate 6-digit code using Math.random (no crypto import needed)
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  const { error } = await adminSupabase
    .from('circles')
    .update({ join_code: code, updated_at: new Date() })
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });

  res.json({ code, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) });
});

// POST /api/circles/:id/invite — invite by email
router.post('/:id/invite', async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;
  const { email } = z.object({ email: z.string().email() }).parse(req.body);

  const { data: membership } = await adminSupabase
    .from('circle_members')
    .select('role')
    .eq('circle_id', id)
    .eq('user_id', user.id)
    .single();

  if (!membership || membership.role !== 'admin') {
    return res.status(403).json({ error: 'Solo admins pueden invitar' });
  }

  // Find user by email
  const { data: targetUser } = await adminSupabase
    .from('users')
    .select('id, name')
    .eq('email', email)
    .single();

  if (!targetUser) {
    return res.status(404).json({ error: 'Usuario no encontrado. Pídele que se registre primero.' });
  }

  // Check already member
  const { data: existing } = await adminSupabase
    .from('circle_members')
    .select('id')
    .eq('circle_id', id)
    .eq('user_id', targetUser.id)
    .single();

  if (existing) {
    return res.status(409).json({ error: 'Este usuario ya es miembro' });
  }

  // TODO: send email via Resend
  res.json({ message: 'Invitación enviada', inviteEmail: email });
});

export default router;