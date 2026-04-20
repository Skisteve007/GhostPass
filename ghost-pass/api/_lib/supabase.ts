import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client that bypasses RLS — only use in trusted server-side code
export const adminSupabase = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase; // fallback to anon if service key not configured

