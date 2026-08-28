import { describe, it, expect, beforeEach } from 'vitest';
import { reconcile } from '../src/lib/sync';
import { rawSet, getWeights, deleteWeight, addWeight } from '../src/lib/storage';
import { markTouched, touchedAt } from '../src/lib/meta';
import type { WeightEntry } from '../src/lib/types';
import type { FoodLogEntry } from '../src/data/types-diet';

// These exercise sync.ts's reconcile() directly against seeded localStorage,
// simulating what happens when this device processes one row pulled from
// Supabase — the exact decision tree fullSync() drives, without needing a
// live network connection to stand up "two real devices".

beforeEach(() => {
  localStorage.clear();
});

function seedWeights(entries: WeightEntry[], touchedAtTs: number) {
  rawSet('vp_weights', entries);
  markTouched('vp_weights', touchedAtTs);
}

describe('reconcile — delete made while online (no conflict window)', () => {
  it('a delete pushed and then immediately reconciled against its own stale echo stays deleted', () => {
    // Device had the entry, already synced once at T=100.
    seedWeights([{ date: '2026-01-01', kg: 75, updatedAt: 100 }], 100);

    // User deletes it right away (still online) — this is a real storage.ts call.
    deleteWeight(0);
    expect(getWeights()).toHaveLength(0);
    const deletedTs = touchedAt('vp_weights') as number;
    expect(deletedTs).toBeGreaterThan(100);

    // A moment later, the pull phase of the same sync cycle returns the row
    // as it stood before the push landed (remote hasn't caught up yet).
    const result = reconcile('vp_weights', [{ date: '2026-01-01', kg: 75, updatedAt: 100 }], 100, 100);

    // since=100 and remoteTs=100 -> "remote is old news", local (deleted) stands.
    expect(result.applied).toBe(false);
    expect(getWeights()).toHaveLength(0);
  });
});

describe('reconcile — THE SPEC SCENARIO: delete offline, reconnect later', () => {
  it('does not resurrect the entry when the remote pull still has the old, unchanged copy', () => {
    // Both devices synced at T=100 with the entry present.
    seedWeights([{ date: '2026-01-01', kg: 75, updatedAt: 100 }], 100);

    // iPhone goes offline and deletes the entry at T=200.
    markTouched('vp_weights', 200);
    const raw = JSON.parse(localStorage.getItem('vp_weights') as string) as WeightEntry[];
    raw[0] = { ...raw[0], deleted: true, updatedAt: 200 };
    rawSet('vp_weights', raw);

    // iPhone reconnects. The PC never touched vp_weights, so the pulled row
    // is exactly what it was at the last sync (updated_at=100, since=100).
    const result = reconcile('vp_weights', [{ date: '2026-01-01', kg: 75, updatedAt: 100 }], 100, 100);

    expect(result.applied).toBe(false); // remote is old news — local deletion is authoritative
    expect(getWeights()).toHaveLength(0); // NOT resurrected
  });

  it('a second device that never touched the key cleanly adopts the propagated delete', () => {
    // This represents the PC, at its OWN last sync (T=100), still holding the
    // original entry, having made no local changes since.
    seedWeights([{ date: '2026-01-01', kg: 75, updatedAt: 100 }], 100);

    // The PC pulls the row after the iPhone's delete has reached Supabase
    // (updated_at is now 200, from the iPhone's push).
    const result = reconcile('vp_weights', [{ date: '2026-01-01', kg: 75, updatedAt: 100, deleted: true }], 200, 100);

    expect(result.applied).toBe(true); // localTs(100) <= since(100): remote wins cleanly, no merge needed
    rawSet('vp_weights', result.value as WeightEntry[]);
    expect(getWeights()).toHaveLength(0); // PC now also has it deleted
  });
});

describe('reconcile — concurrent conflict (both sides changed since last sync)', () => {
  it('a delete on one device survives a merge against an unrelated concurrent addition on the other', () => {
    // Last agreed state at T=100.
    seedWeights([{ date: '2026-01-01', kg: 75, updatedAt: 100 }], 100);

    // iPhone (local): deletes the entry offline at T=200.
    const raw = JSON.parse(localStorage.getItem('vp_weights') as string) as WeightEntry[];
    raw[0] = { ...raw[0], deleted: true, updatedAt: 200 };
    rawSet('vp_weights', raw);
    markTouched('vp_weights', 200);

    // PC (remote): meanwhile logged an unrelated new weigh-in, pushed at T=250.
    const remoteRow: WeightEntry[] = [
      { date: '2026-01-01', kg: 75, updatedAt: 100 }, // PC never saw the delete
      { date: '2026-01-08', kg: 74.2, updatedAt: 250 }
    ];

    const result = reconcile('vp_weights', remoteRow, 250, 100);

    expect(result.isMerge).toBe(true); // both sides changed since since=100 -> genuine conflict
    const merged = result.value as WeightEntry[];
    const jan1 = merged.find((e) => e.date === '2026-01-01');
    const jan8 = merged.find((e) => e.date === '2026-01-08');
    expect(jan1?.deleted).toBe(true); // delete survives the merge
    expect(jan8).toBeDefined(); // PC's concurrent addition is not lost either
  });

  it('a normal (non-delete) concurrent edit still merges as an additive union', () => {
    seedWeights([{ date: '2026-01-01', kg: 75, updatedAt: 100 }], 100);
    addWeight(74.8, '2026-01-10'); // local addition, offline, after last sync

    const remoteRow: WeightEntry[] = [
      { date: '2026-01-01', kg: 75, updatedAt: 100 },
      { date: '2026-01-12', kg: 74.5, updatedAt: 300 } // PC's own concurrent addition
    ];

    const result = reconcile('vp_weights', remoteRow, 300, 100);
    expect(result.isMerge).toBe(true);
    const merged = result.value as WeightEntry[];
    expect(merged.map((e) => e.date).sort()).toEqual(['2026-01-01', '2026-01-10', '2026-01-12']);
  });
});

describe('reconcile — two devices converge to the same final state', () => {
  it('a device with no local changes since last sync adopts a merge result produced elsewhere verbatim', () => {
    // Simulates: device A already resolved a conflict and pushed the merge
    // result (updated_at = the merge's push time, 400). This device (B)
    // hasn't touched the key since its own last sync at 100, so it must
    // adopt the merged result cleanly, not attempt to merge again.
    seedWeights([{ date: '2026-01-01', kg: 75, updatedAt: 100 }], 100);

    const mergedFromDeviceA: WeightEntry[] = [
      { date: '2026-01-01', kg: 75, updatedAt: 200, deleted: true },
      { date: '2026-01-08', kg: 74.2, updatedAt: 250 }
    ];

    const result = reconcile('vp_weights', mergedFromDeviceA, 400, 100);
    expect(result.isMerge).toBe(false);
    expect(result.applied).toBe(true);
    rawSet('vp_weights', result.value as WeightEntry[]);
    expect(getWeights().map((e) => e.date)).toEqual(['2026-01-08']);
  });
});

describe('reconcile — first pull onto a brand new device', () => {
  it('adopts remote data wholesale when the device has nothing local yet', () => {
    // No seedWeights() call: this key has never existed on this device.
    const result = reconcile('vp_weights', [{ date: '2026-01-01', kg: 75, updatedAt: 100 }], 100, 0);
    expect(result.applied).toBe(true);
    expect(result.isMerge).toBe(false);
  });
});

describe('reconcile — vp_food_log (Diário Livre) uses the same tombstoned-list merge as weights', () => {
  it('a delete made offline is not resurrected by a stale remote copy', () => {
    const local: FoodLogEntry[] = [{ date: '2026-01-01', label: 'Bolo', kcal: 300, protein: 4, carbs: 40, fat: 12, updatedAt: 100 }];
    rawSet('vp_food_log', local);
    markTouched('vp_food_log', 100);

    // Offline delete at T=200.
    rawSet('vp_food_log', [{ ...local[0], deleted: true, updatedAt: 200 }]);
    markTouched('vp_food_log', 200);

    // Remote (unaware of the delete) has a concurrent, unrelated addition pushed at T=250.
    const remote: FoodLogEntry[] = [
      { date: '2026-01-01', label: 'Bolo', kcal: 300, protein: 4, carbs: 40, fat: 12, updatedAt: 100 },
      { date: '2026-01-02', label: 'Fruta', kcal: 90, protein: 1, carbs: 22, fat: 0, updatedAt: 250 }
    ];

    const result = reconcile('vp_food_log', remote, 250, 100);
    expect(result.isMerge).toBe(true);
    const merged = result.value as FoodLogEntry[];
    expect(merged.find((e) => e.label === 'Bolo')?.deleted).toBe(true);
    expect(merged.find((e) => e.label === 'Fruta')).toBeDefined();
  });
});
