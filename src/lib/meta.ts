import { PFX, rawGet, rawSet, onChange } from './storage';

const META_KEY = `${PFX}_meta`;

type MetaMap = Record<string, number>;

function readMeta(): MetaMap {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? (JSON.parse(raw) as MetaMap) : {};
  } catch {
    return {};
  }
}

function writeMeta(m: MetaMap): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(m));
  } catch {
    /* ignore */
  }
}

/** Records when each app key last changed locally, for last-write-wins sync. */
export function touchedAt(key: string): number | undefined {
  return readMeta()[key];
}

export function markTouched(key: string, ts = Date.now()): void {
  const m = readMeta();
  m[key] = ts;
  writeMeta(m);
}

// Every write through storage.ts's rawSet/rawRemove fires onChange — record it,
// skipping the meta key itself to avoid recursion.
onChange((key) => {
  if (key === META_KEY) return;
  markTouched(key);
});

export function lastSyncedAt(): number {
  return rawGet<number>(`${PFX}_last_synced_at`, 0);
}

export function setLastSyncedAt(ts: number): void {
  rawSet(`${PFX}_last_synced_at`, ts);
}
