import type { NextFunction, Request, Response } from 'express';
import { authSupabase } from '../lib/db';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.slice(7);

  try {
    // Verify JWT with Supabase
    const { data: { user }, error } = await authSupabase.auth.getUser(token);
    
    if (error || !user) {
      console.log('Auth error:', error?.message);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    if (!user.id) {
      console.log('User object missing id:', user);
      return res.status(401).json({ error: 'Invalid user data' });
    }

    // Attach user to request
    (req as any).user = user;
    next();
  } catch (err: any) {
    console.log('Auth middleware exception:', err.message);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}