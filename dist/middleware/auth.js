"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const db_1 = require("../lib/db");
async function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    const token = authHeader.slice(7);
    try {
        // Verify JWT with Supabase
        const { data: { user }, error } = await db_1.authSupabase.auth.getUser(token);
        if (error || !user) {
            console.log('Auth error:', error?.message);
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        if (!user.id) {
            console.log('User object missing id:', user);
            return res.status(401).json({ error: 'Invalid user data' });
        }
        // Attach user to request
        req.user = user;
        next();
    }
    catch (err) {
        console.log('Auth middleware exception:', err.message);
        return res.status(401).json({ error: 'Authentication failed' });
    }
}
