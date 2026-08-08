import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isCloudConfigured = Boolean(url && anonKey);

/**
 * `null` whenever VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY aren't set —
 * every caller must treat that as "cloud sync unavailable, stay local-only",
 * never throw. This keeps VProject fully usable without any backend.
 */
export const supabase: SupabaseClient | null = isCloudConfigured
  ? createClient(url as string, anonKey as string, {
      auth: { persistSession: true, autoRefreshToken: true }
    })
  : null;
