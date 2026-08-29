import { describe, it, expect } from 'vitest';
import { currentStreakFromToday, longestStreak } from '../src/lib/streaks';

describe('currentStreakFromToday', () => {
  it('counts consecutive complete days ending today (last entry)', () => {
    expect(currentStreakFromToday([true, true, true])).toBe(3);
  });

  it('is 0 when today (the last entry) was not complete, regardless of history', () => {
    expect(currentStreakFromToday([true, true, false])).toBe(0);
  });

  it('stops counting at the first gap looking backward from today', () => {
    expect(currentStreakFromToday([true, false, true, true])).toBe(2);
  });

  it('returns 0 for an empty window', () => {
    expect(currentStreakFromToday([])).toBe(0);
  });
});

describe('longestStreak', () => {
  it('finds the longest run of consecutive true values anywhere in the window', () => {
    expect(longestStreak([true, true, false, true, true, true, false])).toBe(3);
  });

  it('a missed day never erases a longer streak earlier in the window', () => {
    // The spec's non-punitive requirement: today failing must not affect the
    // recorded best streak from earlier in the history.
    expect(longestStreak([true, true, true, true, true, false])).toBe(5);
  });

  it('returns 0 when nothing was ever complete', () => {
    expect(longestStreak([false, false, false])).toBe(0);
  });

  it('returns 0 for an empty window', () => {
    expect(longestStreak([])).toBe(0);
  });
});
