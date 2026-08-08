import { supabase, isCloudConfigured } from './supabaseClient';
import { allKeys, rawGet, rawSet } from './storage';
import { lastSyncedAt, setLastSyncedAt, touchedAt } from './meta';

export { isCloudConfigured };

const TABLE = 'user_data';

export type SyncResult =
  | { ok: true; pushed: number; pulled: number }
  | { ok: false; reason: string };

export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

/** Passwordless sign-in: sends a magic link, no password ever touches the frontend. */
export async function signInWithEmail(email: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Sincronização cloud não configurada.' };
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.href }
  });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut();
}

export function onAuthChange(cb: (signedIn: boolean) => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => cb(Boolean(session)));
  return () => data.subscription.unsubscribe();
}

/**
 * Pulls remote rows newer than what's stored locally (last-write-wins by
 * timestamp), then pushes every local key touched since the last successful
 * sync. Safe to call repeatedly (on load, on regaining connectivity, on a
 * timer, or from a manual "Sincronizar agora" button) — it's a no-op when
 * cloud sync isn't configured or the user isn't signed in.
 */
export async function fullSync(): Promise<SyncResult> {
  if (!supabase) return { ok: false, reason: 'Sincronização cloud não configurada.' };
  const session = await getSession();
  if (!session) return { ok: false, reason: 'Sessão não iniciada.' };
  if (!navigator.onLine) return { ok: false, reason: 'Sem ligação à internet.' };

  const userId = session.user.id;
  let pulled = 0;
  let pushed = 0;

  try {
    const { data: remoteRows, error: pullError } = await supabase
      .from(TABLE)
      .select('key,value,updated_at')
      .eq('user_id', userId);
    if (pullError) throw pullError;

    for (const row of remoteRows ?? []) {
      const remoteTs = new Date(row.updated_at).getTime();
      const localTs = touchedAt(row.key) ?? 0;
      const hasLocal = rawGet<unknown>(row.key, undefined) !== undefined;
      if (!hasLocal || remoteTs > localTs) {
        rawSet(row.key, row.value);
        pulled++;
      }
    }

    const since = lastSyncedAt();
    const toPush = allKeys().filter((k) => (touchedAt(k) ?? 0) > since || since === 0);
    if (toPush.length) {
      const rows = toPush.map((key) => ({
        user_id: userId,
        key,
        value: rawGet(key, null),
        updated_at: new Date(touchedAt(key) ?? Date.now()).toISOString()
      }));
      const { error: pushError } = await supabase.from(TABLE).upsert(rows, { onConflict: 'user_id,key' });
      if (pushError) throw pushError;
      pushed = rows.length;
    }

    setLastSyncedAt(Date.now());
    return { ok: true, pushed, pulled };
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : 'Erro desconhecido ao sincronizar.' };
  }
}

let syncTimer: ReturnType<typeof setInterval> | undefined;

/** Wires background sync: on load, on regaining connectivity, and every 2 minutes. */
export function startBackgroundSync(onResult?: (r: SyncResult) => void): void {
  if (!supabase) return;
  const run = () => void fullSync().then((r) => onResult?.(r));
  run();
  window.addEventListener('online', run);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') run();
  });
  if (syncTimer) clearInterval(syncTimer);
  syncTimer = setInterval(run, 2 * 60 * 1000);
}
