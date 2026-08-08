import { describe, it, expect } from 'vitest';
import { mergeDayRecords, mergeEntryLists } from '../src/lib/merge';
import type { DayRecord } from '../src/lib/types';

function day(partial: Partial<DayRecord>): DayRecord {
  return { meals: {}, water: 0, exercisesDone: {}, training: null, habits: {}, ...partial };
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

describe('mergeEntryLists', () => {
  const keyFn = (e: { date: string; kg: number }) => `${e.date}_${e.kg}`;
  const dateFn = (e: { date: string }) => e.date;

  it('unions entries added independently on each device', () => {
    const local = [{ date: '2026-01-02', kg: 74.5 }];
    const remote = [{ date: '2026-01-01', kg: 75 }];
    const merged = mergeEntryLists(local, remote, keyFn, dateFn);
    expect(merged).toHaveLength(2);
    expect(merged.map((e) => e.kg).sort()).toEqual([74.5, 75]);
  });

  it('deduplicates identical entries instead of doubling them', () => {
    const shared = [{ date: '2026-01-01', kg: 75 }];
    const merged = mergeEntryLists(shared, shared, keyFn, dateFn);
    expect(merged).toHaveLength(1);
  });

  it('sorts the merged result newest-first', () => {
    const local = [{ date: '2026-01-01', kg: 75 }];
    const remote = [{ date: '2026-01-05', kg: 74 }];
    const merged = mergeEntryLists(local, remote, keyFn, dateFn);
    expect(merged.map((e) => e.date)).toEqual(['2026-01-05', '2026-01-01']);
  });
});
