import './lib/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { adminSupabase } from './lib/db';
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rate-limit';
import authRoutes from './routes/auth';
import circleRoutes from './routes/circles';
import memberRoutes from './routes/members';
import locationRoutes from './routes/locations';
import driveRoutes from './routes/drives';
import sosRoutes from './routes/sos';
import notificationRoutes from './routes/notifications';
import membershipRoutes from './routes/memberships';
import placesRoutes from './routes/places';
import stripeWebhook from './routes/stripe-webhook';

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

// Diagnostics: which Supabase key role is the admin client using?
try {
  const keyPart = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').split('.')[1] ?? '';
  const claims = JSON.parse(Buffer.from(keyPart, 'base64').toString());
  console.log(`🔑 SUPABASE_SERVICE_ROLE_KEY role=${claims.role} sub=${claims.sub ?? claims.ref ?? ''}`);
} catch (e) {
  console.error('🔑 Could not decode service role key');
}

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? '*',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// Health check (public, before auth middleware)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rate limiting
app.use('/api/auth', rateLimitMiddleware(60 * 1000, 5));
app.use('/api/auth/signup', rateLimitMiddleware(60 * 60 * 1000, 3));

// Public routes
app.use('/api/webhooks/stripe', stripeWebhook);

// Auth routes (public)
app.use('/api/auth', authRoutes);

// Protected routes middleware
app.use(authMiddleware);

// User profile (protected)
app.get('/api/user/me', async (req: Request, res: Response) => {
  const user = (req as any).user;

  if (!user || !user.id) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { data, error } = await adminSupabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Update user profile (protected)
app.patch('/api/user/me', async (req: Request, res: Response) => {
  const user = (req as any).user;

  if (!user || !user.id) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  const { name, avatar_url } = req.body;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = String(name).trim();
  if (avatar_url !== undefined) updates.avatar_url = String(avatar_url);

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'Nothing to update' });
  }

  const { data, error } = await adminSupabase
    .from('users')
    .update({ ...updates, updated_at: new Date() })
    .eq('id', user.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Protected routes
app.use('/api/circles', circleRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/drives', driveRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/memberships', membershipRoutes);
app.use('/api/places', placesRoutes);

// Error handler — Zod validation errors become 400s
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err?.name === 'ZodError') {
    return res.status(400).json({
      error: 'Validation failed',
      issues: err.issues?.map((i: any) => ({ path: i.path, message: i.message })),
    });
  }
  // Malformed JSON body
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  const status = err?.statusCode ?? err?.status;
  if (typeof status === 'number' && status >= 400 && status < 600) {
    return res.status(status).json({ error: err.message });
  }
  console.error('[UNHANDLED]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Async safety wrapper ──────────────────────────────────────────────
// Express 4 does NOT forward rejected promises from async handlers to the
// error middleware — an uncaught throw (e.g. a ZodError from .parse())
// becomes an unhandled rejection and crashes the whole process. Wrap every
// registered handler once so any rejection goes to the error handler above.
type AnyLayer = {
  name?: string;
  handle: any;
  route?: { stack: AnyLayer[] };
};

function wrapOne(layer: AnyLayer): void {
  const fn = layer?.handle;
  // Skip error middleware (4 args — Express distinguishes by arity)
  if (typeof fn !== 'function' || (fn as any).__asyncSafe || fn.length === 4) return;
  const wrapper = (req: any, res: any, next: any) => {
    try {
      const result = fn(req, res, next);
      if (result && typeof result.catch === 'function') result.catch(next);
    } catch (err) {
      next(err);
    }
  };
  (wrapper as any).__asyncSafe = true;
  layer.handle = wrapper;
}

function wrapAll(stack: AnyLayer[]): void {
  for (const layer of stack) {
    if (layer.route) {
      for (const routeLayer of layer.route.stack) wrapOne(routeLayer);
    } else if (layer.name === 'router' && layer.handle?.stack) {
      wrapAll(layer.handle.stack);
    } else {
      wrapOne(layer);
    }
  }
}

const rootStack: AnyLayer[] | undefined =
  (app as any)._router?.stack ?? (app as any).router?.stack;
if (rootStack) wrapAll(rootStack);

// Last-resort net: log loudly instead of dying silently
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});