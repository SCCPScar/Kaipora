import { supabase, isCloudConfigured } from './supabaseClient';
import { allKeys, rawGet, rawSet } from './storage';
import type { DayRecord, WeightEntry, MeasurementEntry, NoteEntry } from './types';
import type { ExerciseLogEntry } from './storage';
import { lastSyncedAt, setLastSyncedAt, touchedAt, markTouched } from './meta';
import { mergeDayRecords, mergeEntryLists } from './merge';

export { isCloudConfigured };

const TABLE = 'user_data';
const DAY_KEY_RE = /^vp_day_\d{4}-\d{2}-\d{2}$/;
const LOAD_KEY_RE = /^vp_loads_/;

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
 * Reconciles one pulled row against local state. `since` is the timestamp of
 * this device's last successful sync — it's what lets us tell "remote hasn't
 * changed since we last agreed" and "we haven't changed locally either" apart
 * from an actual concurrent edit, so we only ever fall back to a merge when
 * both sides genuinely diverged since the last sync.
 */
interface Reconciliation {
  applied: boolean;
  value: unknown;
  /** true when `value` is a freshly-computed merge that must be pushed back this cycle. */
  isMerge: boolean;
}

/**
 * Exported (not just used internally by fullSync) so tests can exercise the
 * conflict-resolution decision tree directly against seeded localStorage
 * state, without needing a live Supabase connection to simulate two devices
 * syncing at different times.
 */
export function reconcile(key: string, remoteValue: unknown, remoteTs: number, since: number): Reconciliation {
  const hasLocal = rawGet<unknown>(key, undefined) !== undefined;
  const localTs = touchedAt(key) ?? 0;

  if (!hasLocal) return { applied: true, value: remoteValue, isMerge: false };
  if (since > 0 && remoteTs <= since) return { applied: false, value: undefined, isMerge: false }; // remote is old news, local stands
  if (localTs <= since) return { applied: true, value: remoteValue, isMerge: false }; // we haven't touched it, remote wins cleanly

  // True concurrent conflict: both sides changed since the last sync.
  const localValue = rawGet<unknown>(key, null);
  return { applied: true, value: mergeConflicting(key, localValue, remoteValue), isMerge: true };
}

function mergeConflicting(key: string, local: unknown, remote: unknown): unknown {
  if (DAY_KEY_RE.test(key)) {
    return mergeDayRecords(local as DayRecord, remote as DayRecord);
  }
  if (key === 'vp_weights') {
    return mergeEntryLists(
      local as WeightEntry[],
      remote as WeightEntry[],
      (e) => `${e.date}_${e.kg}`,
      (e) => e.date
    );
  }
  if (key === 'vp_measurements') {
    return mergeEntryLists(
      local as MeasurementEntry[],
      remote as MeasurementEntry[],
      (e) => `${e.date}_${e.waist}_${e.hip}_${e.thigh}_${e.arm}`,
      (e) => e.date
    );
  }
  if (key === 'vp_notes') {
    return mergeEntryLists(
      local as NoteEntry[],
      remote as NoteEntry[],
      (e) => `${e.date}_${e.text}`,
      (e) => e.date
    );
  }
  if (LOAD_KEY_RE.test(key)) {
    return mergeEntryLists(
      local as ExerciseLogEntry[],
      remote as ExerciseLogEntry[],
      (e) => `${e.date}_${e.weightKg}_${e.reps}_${e.seconds}_${e.note}`,
      (e) => e.date
    );
  }
  // Opaque scalar (settings, ...): no field-level merge possible — the
  // remote copy is as good a pick as any for this rare, low-stakes case.
  return remote;
}

/**
 * Pulls remote rows, reconciling each against local state (merging only on
 * genuine concurrent conflicts — see reconcile() above), then pushes every
 * local key touched since the last successful sync, including any merge
 * results so the cloud converges too. Safe to call repeatedly (on load, on
 * regaining connectivity, on a timer, or from a manual "Sincronizar agora"
 * button) — it's a no-op when cloud sync isn't configured or the user isn't
 * signed in.
 */
export async function fullSync(): Promise<SyncResult> {
  if (!supabase) return { ok: false, reason: 'Sincronização cloud não configurada.' };
  const session = await getSession();
  if (!session) return { ok: false, reason: 'Sessão não iniciada.' };
  if (!navigator.onLine) return { ok: false, reason: 'Sem ligação à internet.' };

  const userId = session.user.id;
  const since = lastSyncedAt();
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
      const { applied, value, isMerge } = reconcile(row.key, row.value, remoteTs, since);
      if (!applied) continue;
      rawSet(row.key, value);
      // A pure pull (no local conflict) should carry the remote's real edit
      // time forward, not "now" — otherwise a later genuine edit from a third
      // device could be wrongly judged older than this device's pull. A merge
      // result, by contrast, IS a brand-new local state that must be pushed
      // back this same cycle, so it keeps the "touched now" that rawSet's
      // onChange hook already recorded for it.
      if (!isMerge) markTouched(row.key, remoteTs);
      pulled++;
    }

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
