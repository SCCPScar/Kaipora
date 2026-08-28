import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isCloudConfigured = Boolean(url && anonKey);

/**
 * `null` whenever VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY aren't set —
 * every caller must treat that as "cloud sync unavailable, stay local-only",
 * never throw. This keeps Kaipora fully usable without any backend.
 */
export const supabase: SupabaseClient | null = isCloudConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true, // keep the session across refresh/close-reopen without re-login
        autoRefreshToken: true, // renew the access token in the background while the app is open
        detectSessionInUrl: true // required to pick up the session after the magic-link redirect lands back here
      }
    })
  : null;
