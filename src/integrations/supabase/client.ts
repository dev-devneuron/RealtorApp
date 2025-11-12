/**
 * Supabase Client Configuration
 * 
 * This module initializes and exports a singleton Supabase client instance.
 * The client is configured for authentication with session persistence and
 * automatic token refresh. In development, we prevent multiple client instances
 * from being created during Vite's Hot Module Replacement (HMR).
 * 
 * @module integrations/supabase/client
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Supabase project configuration
const SUPABASE_URL = "https://cmpywleowxnvucymvwgv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtcHl3bGVvd3hudnVjeW12d2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NDkwMjUsImV4cCI6MjA2OTQyNTAyNX0.O8jmR0zS_mK0KALSjAfHutRLDMtWB_Gzl1A8YVCLz4o";

/**
 * Global storage for Supabase client instance
 * 
 * Prevents multiple client instances in development when Vite HMR reloads modules.
 * This ensures we maintain a single connection pool and avoid memory leaks.
 */
const globalForSupabase = globalThis as unknown as {
  supabase?: ReturnType<typeof createClient<Database>>;
};

/**
 * Supabase client instance
 * 
 * Creates a new client if one doesn't exist, or reuses the existing one.
 * Configured with:
 * - localStorage for session persistence
 * - Automatic session persistence
 * - Automatic token refresh
 */
export const supabase =
  globalForSupabase.supabase ??
  createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });

// In development, store the client globally to prevent duplicate instances during HMR
if (process.env.NODE_ENV !== "production") {
  globalForSupabase.supabase = supabase;
}
