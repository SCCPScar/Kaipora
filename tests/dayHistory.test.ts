import { describe, it, expect, beforeEach } from 'vitest';
import { essentialsCompletedFlags } from '../src/lib/dayHistory';
import { setWater, setTrainingDone, saveSettings } from '../src/lib/storage';

beforeEach(() => {
  localStorage.clear();
});

describe('essentialsCompletedFlags', () => {
  it('marks a day complete only when both water and training essentials are met', () => {
    saveSettings({ waterGoalMl: 2000 }); // glassGoal = 8
    setWater('2026-01-01', 8);
    setTrainingDone('2026-01-01', 'academia', 'seg-academia', true);

    setWater('2026-01-02', 3); // water goal not met
    setTrainingDone('2026-01-02', 'academia', 'seg-academia', true);

    const flags = essentialsCompletedFlags('2026-01-01', '2026-01-02');
    expect(flags).toEqual([true, false]);
  });

  it('returns one flag per day in the inclusive range, oldest first', () => {
    const flags = essentialsCompletedFlags('2026-01-01', '2026-01-05');
    expect(flags).toHaveLength(5);
  });

  it('returns an empty array when the range is inverted', () => {
    expect(essentialsCompletedFlags('2026-01-05', '2026-01-01')).toEqual([]);
  });

  it('a day with no record at all is simply incomplete, not an error', () => {
    expect(essentialsCompletedFlags('2026-01-01', '2026-01-01')).toEqual([false]);
  });
});
