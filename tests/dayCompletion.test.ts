import { describe, it, expect } from 'vitest';
import { isDayComplete } from '../src/lib/dayCompletion';

describe('isDayComplete', () => {
  it('is incomplete when neither essential is done', () => {
    expect(isDayComplete({ waterGlasses: 0, waterGoalGlasses: 8, trainingDone: false })).toBe(false);
  });

  it('is incomplete when only water is done', () => {
    expect(isDayComplete({ waterGlasses: 8, waterGoalGlasses: 8, trainingDone: false })).toBe(false);
  });

  it('is incomplete when only training is done', () => {
    expect(isDayComplete({ waterGlasses: 3, waterGoalGlasses: 8, trainingDone: true })).toBe(false);
  });

  it('is complete once water meets goal exactly and training is done', () => {
    expect(isDayComplete({ waterGlasses: 8, waterGoalGlasses: 8, trainingDone: true })).toBe(true);
  });

  it('stays complete when water exceeds the goal', () => {
    expect(isDayComplete({ waterGlasses: 10, waterGoalGlasses: 8, trainingDone: true })).toBe(true);
  });

  it('never blocks completion on anything beyond the two essentials (no hidden requirements)', () => {
    // Same essentials, wildly different "extra" context — must not matter.
    expect(isDayComplete({ waterGlasses: 8, waterGoalGlasses: 8, trainingDone: true })).toBe(true);
  });
});
