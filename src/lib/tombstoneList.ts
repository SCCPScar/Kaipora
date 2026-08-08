import type { Tombstonable } from './types';

/**
 * Shared behavior for every append-only list that syncs across devices
 * (weights, measurements, notes, exercise loads): entries are never
 * physically removed locally before a delete has had a chance to sync — see
 * the merge strategy in merge.ts for why. `visible()` is what every read
 * path (UI, totals, charts) should use; the raw array (with tombstones
 * still in it) is what gets persisted and synced.
 */

export function visible<T extends Tombstonable>(raw: T[]): T[] {
  return raw.filter((e) => !e.deleted);
}

export function withAdded<T extends Tombstonable>(raw: T[], entry: Omit<T, 'updatedAt' | 'deleted'>): T[] {
  return [{ ...entry, updatedAt: Date.now() } as T, ...raw];
}

/**
 * Soft-deletes the entry at `visibleIndex` in the user-facing (visible-only)
 * ordering — that's the index every UI list renders against — by finding the
 * matching raw entry via `matches` and flagging it deleted with a fresh
 * updatedAt, rather than splicing it out.
 */
export function withSoftDeleted<T extends Tombstonable>(
  raw: T[],
  visibleIndex: number,
  matches: (candidate: T, target: T) => boolean
): T[] {
  const target = visible(raw)[visibleIndex];
  if (!target) return raw;
  const rawIndex = raw.findIndex((e) => !e.deleted && matches(e, target));
  if (rawIndex === -1) return raw;
  const next = [...raw];
  next[rawIndex] = { ...next[rawIndex], deleted: true, updatedAt: Date.now() };
  return next;
}
