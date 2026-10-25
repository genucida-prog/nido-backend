"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicSupabase = exports.adminSupabase = exports.authSupabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("./config");
// Auth client — SEPARATE from adminSupabase on purpose.
// signInWithPassword/signUp store the session in memory on that instance;
// if we reused adminSupabase, every later query would run with the *user's*
// JWT (role authenticated) instead of service_role, and RLS would block them.
exports.authSupabase = (0, supabase_js_1.createClient)(config_1.config.supabaseUrl, config_1.config.supabaseServiceRoleKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});
// Admin client (service role) for server operations — DB access only.
exports.adminSupabase = (0, supabase_js_1.createClient)(config_1.config.supabaseUrl, config_1.config.supabaseServiceRoleKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
});
// Public client for anonymous reads
exports.publicSupabase = (0, supabase_js_1.createClient)(config_1.config.supabaseUrl, config_1.config.supabaseAnonKey);
