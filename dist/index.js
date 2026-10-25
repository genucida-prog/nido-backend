"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./lib/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const db_1 = require("./lib/db");
const auth_1 = require("./middleware/auth");
const rate_limit_1 = require("./middleware/rate-limit");
const auth_2 = __importDefault(require("./routes/auth"));
const circles_1 = __importDefault(require("./routes/circles"));
const members_1 = __importDefault(require("./routes/members"));
const locations_1 = __importDefault(require("./routes/locations"));
const drives_1 = __importDefault(require("./routes/drives"));
const sos_1 = __importDefault(require("./routes/sos"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const memberships_1 = __importDefault(require("./routes/memberships"));
const places_1 = __importDefault(require("./routes/places"));
const stripe_webhook_1 = __importDefault(require("./routes/stripe-webhook"));
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT ?? '3001', 10);
// Diagnostics: which Supabase key role is the admin client using?
try {
    const keyPart = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').split('.')[1] ?? '';
    const claims = JSON.parse(Buffer.from(keyPart, 'base64').toString());
    console.log(`🔑 SUPABASE_SERVICE_ROLE_KEY role=${claims.role} sub=${claims.sub ?? claims.ref ?? ''}`);
}
catch (e) {
    console.error('🔑 Could not decode service role key');
}
// Security
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN ?? '*',
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
// Health check (public, before auth middleware)
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Rate limiting
app.use('/api/auth', (0, rate_limit_1.rateLimitMiddleware)(60 * 1000, 5));
app.use('/api/auth/signup', (0, rate_limit_1.rateLimitMiddleware)(60 * 60 * 1000, 3));
// Public routes
app.use('/api/webhooks/stripe', stripe_webhook_1.default);
// Auth routes (public)
app.use('/api/auth', auth_2.default);
// Protected routes middleware
app.use(auth_1.authMiddleware);
// User profile (protected)
app.get('/api/user/me', async (req, res) => {
    const user = req.user;
    if (!user || !user.id) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    const { data, error } = await db_1.adminSupabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
// Update user profile (protected)
app.patch('/api/user/me', async (req, res) => {
    const user = req.user;
    if (!user || !user.id) {
        return res.status(401).json({ error: 'User not authenticated' });
    }
    const { name, avatar_url } = req.body;
    const updates = {};
    if (name !== undefined)
        updates.name = String(name).trim();
    if (avatar_url !== undefined)
        updates.avatar_url = String(avatar_url);
    if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'Nothing to update' });
    }
    const { data, error } = await db_1.adminSupabase
        .from('users')
        .update({ ...updates, updated_at: new Date() })
        .eq('id', user.id)
        .select()
        .single();
    if (error)
        return res.status(500).json({ error: error.message });
    res.json(data);
});
// Protected routes
app.use('/api/circles', circles_1.default);
app.use('/api/members', members_1.default);
app.use('/api/locations', locations_1.default);
app.use('/api/drives', drives_1.default);
app.use('/api/sos', sos_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/memberships', memberships_1.default);
app.use('/api/places', places_1.default);
// Error handler — Zod validation errors become 400s
app.use((err, _req, res, _next) => {
    if (err?.name === 'ZodError') {
        return res.status(400).json({
            error: 'Validation failed',
            issues: err.issues?.map((i) => ({ path: i.path, message: i.message })),
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
function wrapOne(layer) {
    const fn = layer?.handle;
    // Skip error middleware (4 args — Express distinguishes by arity)
    if (typeof fn !== 'function' || fn.__asyncSafe || fn.length === 4)
        return;
    const wrapper = (req, res, next) => {
        try {
            const result = fn(req, res, next);
            if (result && typeof result.catch === 'function')
                result.catch(next);
        }
        catch (err) {
            next(err);
        }
    };
    wrapper.__asyncSafe = true;
    layer.handle = wrapper;
}
function wrapAll(stack) {
    for (const layer of stack) {
        if (layer.route) {
            for (const routeLayer of layer.route.stack)
                wrapOne(routeLayer);
        }
        else if (layer.name === 'router' && layer.handle?.stack) {
            wrapAll(layer.handle.stack);
        }
        else {
            wrapOne(layer);
        }
    }
}
const rootStack = app._router?.stack ?? app.router?.stack;
if (rootStack)
    wrapAll(rootStack);
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
