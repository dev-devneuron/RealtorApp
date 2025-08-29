import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://cmpywleowxnvucymvwgv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtcHl3bGVvd3hudnVjeW12d2d2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NDkwMjUsImV4cCI6MjA2OTQyNTAyNX0.O8jmR0zS_mK0KALSjAfHutRLDMtWB_Gzl1A8YVCLz4o";

// 👇 Prevent multiple clients in dev with Vite HMR
const globalForSupabase = globalThis as unknown as {
  supabase?: ReturnType<typeof createClient<Database>>;
};

export const supabase =
  globalForSupabase.supabase ??
  createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.supabase = supabase;
}
