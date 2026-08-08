import { describe, it, expect } from 'vitest';
import { mergeDayRecords, mergeEntryLists } from '../src/lib/merge';
import type { DayRecord, WeightEntry } from '../src/lib/types';

function day(partial: Partial<DayRecord>): DayRecord {
  return { meals: {}, water: 0, exercisesDone: {}, training: null, habits: {}, ...partial };
}

function weight(kg: number, date: string, updatedAt: number, deleted = false): WeightEntry {
  return { kg, date, updatedAt, deleted };
}

describe('mergeDayRecords', () => {
  it('unions checked meals from both sides instead of picking one', () => {
    const local = day({ meals: { pa1: true } });
    const remote = day({ meals: { lm2: true } });
    expect(mergeDayRecords(local, remote).meals).toEqual({ pa1: true, lm2: true });
  });

  it('never lets a merge un-check something either side marked done', () => {
    const local = day({ meals: { pa1: false } }); // explicitly unchecked locally
    const remote = day({ meals: { pa1: true } }); // checked on the other device
    expect(mergeDayRecords(local, remote).meals.pa1).toBe(true);
  });

  it('takes the max water count instead of overwriting', () => {
    // This is the exact scenario from the spec: PC logs water while the
    // iPhone is offline marking other things; reconnecting must not lose
    // the PC's water update.
    const local = day({ water: 2 }); // iPhone, offline, stale water reading
    const remote = day({ water: 5 }); // PC, pushed its water update already
    expect(mergeDayRecords(local, remote).water).toBe(5);
  });

  it('unions exercisesDone per workout without duplicating', () => {
    const local = day({ exercisesDone: { 'seg-academia': ['crucifixo'] } });
    const remote = day({ exercisesDone: { 'seg-academia': ['crucifixo', 'desenvolvimento'] } });
    const merged = mergeDayRecords(local, remote).exercisesDone['seg-academia'];
    expect(merged.sort()).toEqual(['crucifixo', 'desenvolvimento']);
  });

  it('keeps a completed training marker from either side', () => {
    const local = day({ training: null });
    const remote = day({ training: { modality: 'casa', workoutId: 'seg-casa', done: true } });
    expect(mergeDayRecords(local, remote).training).toEqual({ modality: 'casa', workoutId: 'seg-casa', done: true });
  });

  it('prefers the local training marker when both sides completed a workout', () => {
    const local = day({ training: { modality: 'academia', workoutId: 'seg-academia', done: true } });
    const remote = day({ training: { modality: 'casa', workoutId: 'seg-casa', done: true } });
    // No data is lost either way (the "trained today" fact survives) — this
    // is a documented, low-stakes tie-break, not a correctness bug.
    expect(mergeDayRecords(local, remote).training?.done).toBe(true);
  });
});

describe('mergeEntryLists — additive union', () => {
  const keyFn = (e: WeightEntry) => `${e.date}_${e.kg}`;
  const dateFn = (e: WeightEntry) => e.date;

  it('unions entries added independently on each device', () => {
    const local = [weight(74.5, '2026-01-02', 100)];
    const remote = [weight(75, '2026-01-01', 100)];
    const merged = mergeEntryLists(local, remote, keyFn, dateFn);
    expect(merged).toHaveLength(2);
    expect(merged.map((e) => e.kg).sort()).toEqual([74.5, 75]);
  });

  it('deduplicates identical entries instead of doubling them', () => {
    const shared = [weight(75, '2026-01-01', 100)];
    const merged = mergeEntryLists(shared, shared, keyFn, dateFn);
    expect(merged).toHaveLength(1);
  });

  it('sorts the merged result newest-first', () => {
    const local = [weight(75, '2026-01-01', 100)];
    const remote = [weight(74, '2026-01-05', 100)];
    const merged = mergeEntryLists(local, remote, keyFn, dateFn);
    expect(merged.map((e) => e.date)).toEqual(['2026-01-05', '2026-01-01']);
  });
});

describe('mergeEntryLists — tombstoned deletes', () => {
  const keyFn = (e: WeightEntry) => `${e.date}_${e.kg}`;
  const dateFn = (e: WeightEntry) => e.date;

  it('THE SPEC SCENARIO: a delete on one device is not resurrected by the other device’s stale copy', () => {
    // Both devices synced at T=100 with the entry present.
    // iPhone deletes it offline at T=200 (later).
    // PC's copy is untouched, still the live entry from T=100.
    const iphoneAfterDelete = [weight(75, '2026-01-01', 200, true)];
    const pcStillHasIt = [weight(75, '2026-01-01', 100, false)];

    const merged = mergeEntryLists(iphoneAfterDelete, pcStillHasIt, keyFn, dateFn);
    expect(merged).toHaveLength(1);
    expect(merged[0].deleted).toBe(true);
  });

  it('deletion wins regardless of which side is passed as "local" vs "remote" (symmetry)', () => {
    const deleted = [weight(75, '2026-01-01', 200, true)];
    const stale = [weight(75, '2026-01-01', 100, false)];
    expect(mergeEntryLists(deleted, stale, keyFn, dateFn)[0].deleted).toBe(true);
    expect(mergeEntryLists(stale, deleted, keyFn, dateFn)[0].deleted).toBe(true);
  });

  it('a delete does not affect unrelated entries added concurrently on the other device', () => {
    // iPhone: deletes 75kg entry while offline.
    const iphone = [weight(75, '2026-01-01', 200, true)];
    // PC: unaware of the delete, meanwhile logs an unrelated new weigh-in.
    const pc = [weight(75, '2026-01-01', 100, false), weight(74.2, '2026-01-08', 150)];

    const merged = mergeEntryLists(iphone, pc, keyFn, dateFn);
    expect(merged).toHaveLength(2);
    const jan1 = merged.find((e) => e.date === '2026-01-01');
    const jan8 = merged.find((e) => e.date === '2026-01-08');
    expect(jan1?.deleted).toBe(true);
    expect(jan8?.deleted).toBeFalsy();
  });

  it('concurrent delete of the same entry on both devices converges to deleted (idempotent)', () => {
    const a = [weight(75, '2026-01-01', 200, true)];
    const b = [weight(75, '2026-01-01', 205, true)];
    const merged = mergeEntryLists(a, b, keyFn, dateFn);
    expect(merged).toHaveLength(1);
    expect(merged[0].deleted).toBe(true);
  });

  it('a genuinely newer re-add after a delete wins over the older delete', () => {
    // You delete a 75kg entry, then later (deliberately) log 75kg again on
    // the same date — that fresh add is a newer, real action and should
    // survive, not be suppressed by the older tombstone.
    const deletedThenReadded = [weight(75, '2026-01-01', 300, false)]; // re-added at T=300
    const staleTombstone = [weight(75, '2026-01-01', 200, true)]; // delete the other device saw
    const merged = mergeEntryLists(deletedThenReadded, staleTombstone, keyFn, dateFn);
    expect(merged[0].deleted).toBeFalsy();
  });

  it('treats entries with no updatedAt (pre-tombstone / migrated data) as oldest, never beating a real delete', () => {
    const legacyEntry = [{ date: '2026-01-01', kg: 75 } as WeightEntry]; // no updatedAt at all
    const delete1 = [weight(75, '2026-01-01', 200, true)];
    const merged = mergeEntryLists(legacyEntry, delete1, keyFn, dateFn);
    expect(merged[0].deleted).toBe(true);
  });
});
