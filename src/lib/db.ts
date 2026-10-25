import { createClient } from '@supabase/supabase-js';
import { config } from './config';

// Auth client — SEPARATE from adminSupabase on purpose.
// signInWithPassword/signUp store the session in memory on that instance;
// if we reused adminSupabase, every later query would run with the *user's*
// JWT (role authenticated) instead of service_role, and RLS would block them.
export const authSupabase = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Admin client (service role) for server operations — DB access only.
export const adminSupabase = createClient(
  config.supabaseUrl,
  config.supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

// Public client for anonymous reads
export const publicSupabase = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey
);

// Helper types
export type SupabaseError = {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
};

export type SupabaseResponse<T> = {
  data: T | null;
  error: SupabaseError | null;
};