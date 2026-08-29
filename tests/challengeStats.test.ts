import { describe, it, expect } from 'vitest';
import { challengeStats } from '../src/lib/challengeStats';

describe('challengeStats (Kaipora 75 e outros desafios)', () => {
  it('reports days elapsed and completed for a challenge in progress', () => {
    const flags = [true, false, true, true]; // day 4 of a 75-day challenge
    const stats = challengeStats(flags, 75);
    expect(stats.daysElapsed).toBe(4);
    expect(stats.daysCompleted).toBe(3);
    expect(stats.daysRemaining).toBe(71);
    expect(stats.finished).toBe(false);
  });

  it('a missed day never resets progress — it just is not counted', () => {
    // THE SPEC SCENARIO: "sem reinício automático em caso de falha".
    const flags = [true, true, true, false, true];
    const stats = challengeStats(flags, 75);
    expect(stats.daysCompleted).toBe(4); // the miss just isn't counted...
    expect(stats.daysElapsed).toBe(5); // ...but the challenge keeps advancing regardless
    expect(stats.finished).toBe(false);
  });

  it('marks the challenge finished once totalDays have elapsed, whatever the completion rate', () => {
    const flags = Array(75).fill(false); // every single day missed
    const stats = challengeStats(flags, 75);
    expect(stats.finished).toBe(true);
    expect(stats.daysCompleted).toBe(0);
    expect(stats.daysRemaining).toBe(0);
  });

  it('caps daysElapsed at totalDays even if the window given is longer', () => {
    const flags = Array(80).fill(true);
    const stats = challengeStats(flags, 75);
    expect(stats.daysElapsed).toBe(75);
    expect(stats.daysCompleted).toBe(80); // completed count is not capped, just elapsed days shown
  });

  it('handles a brand new challenge (no days elapsed yet)', () => {
    const stats = challengeStats([], 75);
    expect(stats).toEqual({ daysElapsed: 0, daysCompleted: 0, daysRemaining: 75, finished: false });
  });
});
