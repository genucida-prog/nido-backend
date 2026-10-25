import { Router, Request, Response } from 'express';
import { adminSupabase } from '../lib/db';

const router = Router();

// Get user's notifications
router.get('/', async (req: Request, res: Response) => {
  const user = (req as any).user;

  const { data, error } = await adminSupabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return res.status(500).json({ error: error.message });
  res.json(Array.isArray(data) ? data : []);
});

// Mark as read
router.patch('/:id/read', async (req: Request, res: Response) => {
  const user = (req as any).user;
  const { id } = req.params;

  const { error } = await adminSupabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Mark all as read
router.patch('/read-all', async (req: Request, res: Response) => {
  const user = (req as any).user;

  await adminSupabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id);

  res.json({ success: true });
});

// Get unread count
router.get('/unread-count', async (req: Request, res: Response) => {
  const user = (req as any).user;

  const { count, error } = await adminSupabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false);

  if (error) return res.status(500).json({ error: error.message });
  // count is a number when head: true, or undefined if null
  res.json({ count: count ?? 0 });
});

export default router;