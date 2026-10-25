import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authSupabase, adminSupabase } from '../lib/db';

const router = Router();

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/signup', async (req: Request, res: Response) => {
  try {
    const data = signupSchema.parse(req.body);
    
    const { data: authData, error } = await authSupabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { name: data.name } },
    });
    
    if (error) throw error;
    if (!authData.user) throw new Error('No user returned');
    
    // Create user record
    await adminSupabase.from('users').insert({
      id: authData.user.id,
      email: data.email,
      name: data.name,
    });
    
    res.status(201).json({ message: 'User created', user: authData.user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const data = loginSchema.parse(req.body);
    
    const { data: authData, error } = await authSupabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    
    if (error) throw error;
    if (!authData.session?.access_token) {
      throw new Error('No session created');
    }
    
    res.json({ token: authData.session.access_token });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
});

export default router;