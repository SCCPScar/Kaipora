import type { DayRecord, Tombstonable } from './types';

/**
 * Merge strategy for the sync layer, used only when BOTH the local and the
 * remote copy of a key changed since the last successful sync (a genuine
 * concurrent edit — e.g. exercises marked on the iPhone at the gym while
 * offline, and water logged on the PC in the same window). Outside that
 * narrow window, sync.ts takes whichever side is known to be unchanged
 * without calling this — merging is the exception, not the default path.
 *
 * Bias for DayRecord fields (meals/habits/exercises/water/training): never
 * lose a "done"/checked state either side recorded — see mergeDayRecords.
 *
 * Bias for entry lists (weights/measurements/notes/exercise loads): resolve
 * same-content conflicts by `updatedAt` (see tombstoneList.ts) — whichever
 * side touched that entry more recently wins, INCLUDING a delete, so a
 * deletion made offline is not resurrected by a stale remote copy once both
 * sides have a chance to sync. Entries without `updatedAt` (pre-tombstone
 * data) are treated as oldest, so real timestamps always take precedence.
 */

export function mergeDayRecords(a: DayRecord, b: DayRecord): DayRecord {
  return {
    meals: unionBooleans(a.meals, b.meals),
    habits: unionBooleans(a.habits, b.habits),
    water: Math.max(a.water ?? 0, b.water ?? 0),
    exercisesDone: unionStringArrays(a.exercisesDone, b.exercisesDone),
    training: a.training?.done ? a.training : b.training?.done ? b.training : null
  };
}

function unionBooleans(a: Record<string, boolean>, b: Record<string, boolean>): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const k of new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})])) {
    out[k] = Boolean(a?.[k]) || Boolean(b?.[k]);
  }
  return out;
}

function unionStringArrays(a: Record<string, string[]>, b: Record<string, string[]>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const k of new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})])) {
    out[k] = [...new Set([...(a?.[k] ?? []), ...(b?.[k] ?? [])])];
  }
  return out;
}

/**
 * Union-merges two append-only, tombstoned lists (weights, measurements,
 * notes, exercise loads) by content key. When both sides have an entry under
 * the same key, the one with the later `updatedAt` wins outright — deleted
 * or not — instead of always keeping the local copy. The result keeps
 * tombstones in place (callers persist the raw array); UI reads must go
 * through storage.ts's visible-only getters, which already filter deleted
 * entries out.
 */
export function mergeEntryLists<T extends Tombstonable>(
  local: T[],
  remote: T[],
  keyFn: (entry: T) => string,
  dateFn: (entry: T) => string
): T[] {
  const map = new Map<string, T>();
  const consider = (entry: T) => {
    const k = keyFn(entry);
    const existing = map.get(k);
    if (!existing || (entry.updatedAt ?? 0) >= (existing.updatedAt ?? 0)) {
      map.set(k, entry);
    }
  };
  for (const entry of remote ?? []) consider(entry);
  for (const entry of local ?? []) consider(entry);
  return [...map.values()].sort((x, y) => {
    const dx = dateFn(x);
    const dy = dateFn(y);
    return dx < dy ? 1 : dx > dy ? -1 : 0;
  });
}
