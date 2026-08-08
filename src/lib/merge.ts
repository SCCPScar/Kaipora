import type { DayRecord } from './types';

/**
 * Merge strategy for the sync layer, used only when BOTH the local and the
 * remote copy of a key changed since the last successful sync (a genuine
 * concurrent edit — e.g. exercises marked on the iPhone at the gym while
 * offline, and water logged on the PC in the same window). Outside that
 * narrow window, sync.ts takes whichever side is known to be unchanged
 * without calling this — merging is the exception, not the default path.
 *
 * Bias: never lose a "done"/checked state, and never lose a list entry
 * either side added. The one accepted trade-off (documented in the README)
 * is that a deletion made offline on one device can be "resurrected" by a
 * union-merge if the other device still had the old entry — there is no
 * tombstone list. This is judged an acceptable trade-off for a personal
 * 2-device app: it never silently drops something you recorded, at the cost
 * of occasionally requiring a manual re-delete after a real conflict.
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

/** Union-merges two append-only lists (weights, measurements, notes, exercise loads) by content key. */
export function mergeEntryLists<T>(
  local: T[],
  remote: T[],
  keyFn: (entry: T) => string,
  dateFn: (entry: T) => string
): T[] {
  const map = new Map<string, T>();
  for (const entry of remote ?? []) map.set(keyFn(entry), entry);
  for (const entry of local ?? []) map.set(keyFn(entry), entry);
  return [...map.values()].sort((x, y) => {
    const dx = dateFn(x);
    const dy = dateFn(y);
    return dx < dy ? 1 : dx > dy ? -1 : 0;
  });
}
