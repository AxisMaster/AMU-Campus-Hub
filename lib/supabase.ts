import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'placeholder';

export const isSupabaseConfigured = supabaseUrl !== 'https://placeholder.supabase.co' && supabaseAnonKey !== 'placeholder';

// Standard client for client-side operations (respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to create a service role client for bypassing RLS (server-side only)
export const createAdminClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY is not set. Admin operations may fail due to RLS.');
    return supabase; // Fallback to anon client, which will likely fail RLS
  }
  return createClient(supabaseUrl, serviceRoleKey);
};
