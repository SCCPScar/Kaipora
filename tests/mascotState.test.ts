import { describe, it, expect } from 'vitest';
import { shouldShowComeBack, shouldShowReminder, consecutiveDifficultDays, shouldUseAdaptiveTone } from '../src/lib/mascotState';

describe('shouldShowComeBack', () => {
  it('shows once when yesterday was incomplete and not shown yet today', () => {
    expect(shouldShowComeBack(false, false)).toBe(true);
  });

  it('never shows twice for the same day', () => {
    expect(shouldShowComeBack(false, true)).toBe(false);
  });

  it('never shows when yesterday was complete', () => {
    expect(shouldShowComeBack(true, false)).toBe(false);
  });

  it('never shows when there is no record for yesterday (new user)', () => {
    expect(shouldShowComeBack(null, false)).toBe(false);
  });
});

describe('shouldShowReminder', () => {
  it('does not nag early in the day even if the essencial is missing', () => {
    expect(shouldShowReminder(9, false)).toBe(false);
  });

  it('reminds later in the day if still missing', () => {
    expect(shouldShowReminder(18, false)).toBe(true);
  });

  it('never reminds once the essencial is already done', () => {
    expect(shouldShowReminder(20, true)).toBe(false);
  });

  it('respects a custom threshold hour', () => {
    expect(shouldShowReminder(13, false, 12)).toBe(true);
    expect(shouldShowReminder(11, false, 12)).toBe(false);
  });
});

describe('consecutiveDifficultDays', () => {
  it('counts from the most recent day backwards, stopping at the first done day', () => {
    expect(consecutiveDifficultDays([false, false, true, false])).toBe(2);
  });

  it('is 0 when the most recent day was done', () => {
    expect(consecutiveDifficultDays([true, false, false])).toBe(0);
  });

  it('counts every entry when none were done', () => {
    expect(consecutiveDifficultDays([false, false, false])).toBe(3);
  });

  it('is 0 for an empty history', () => {
    expect(consecutiveDifficultDays([])).toBe(0);
  });
});

describe('shouldUseAdaptiveTone', () => {
  it('stays off for a single difficult day', () => {
    expect(shouldUseAdaptiveTone(1)).toBe(false);
  });

  it('turns on from two difficult days in a row', () => {
    expect(shouldUseAdaptiveTone(2)).toBe(true);
    expect(shouldUseAdaptiveTone(5)).toBe(true);
  });

  it('stays off with none', () => {
    expect(shouldUseAdaptiveTone(0)).toBe(false);
  });
});
