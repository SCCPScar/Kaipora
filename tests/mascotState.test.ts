import { describe, it, expect } from 'vitest';
import { shouldShowComeBack, shouldShowReminder } from '../src/lib/mascotState';

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
