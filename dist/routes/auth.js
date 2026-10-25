"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const zod_1 = require("zod");
const db_1 = require("../lib/db");
const router = (0, express_1.Router)();
const signupSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
    name: zod_1.z.string().min(1),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string(),
});
router.post('/signup', async (req, res) => {
    try {
        const data = signupSchema.parse(req.body);
        const { data: authData, error } = await db_1.authSupabase.auth.signUp({
            email: data.email,
            password: data.password,
            options: { data: { name: data.name } },
        });
        if (error)
            throw error;
        if (!authData.user)
            throw new Error('No user returned');
        // Create user record
        await db_1.adminSupabase.from('users').insert({
            id: authData.user.id,
            email: data.email,
            name: data.name,
        });
        res.status(201).json({ message: 'User created', user: authData.user });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.post('/login', async (req, res) => {
    try {
        const data = loginSchema.parse(req.body);
        const { data: authData, error } = await db_1.authSupabase.auth.signInWithPassword({
            email: data.email,
            password: data.password,
        });
        if (error)
            throw error;
        if (!authData.session?.access_token) {
            throw new Error('No session created');
        }
        res.json({ token: authData.session.access_token });
    }
    catch (error) {
        res.status(401).json({ error: error.message });
    }
});
exports.default = router;
