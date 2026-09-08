import { describe, it, expect } from 'vitest';
import { evaluateMilestones } from '../src/lib/milestones';

describe('evaluateMilestones', () => {
  it('reaches no milestones from zero', () => {
    const result = evaluateMilestones(0, 0);
    expect(result.every((m) => !m.reached)).toBe(true);
  });

  it('reaches only the streak milestones a longest streak clears', () => {
    const result = evaluateMilestones(30, 0);
    expect(result.find((m) => m.id === 'streak-7')?.reached).toBe(true);
    expect(result.find((m) => m.id === 'streak-30')?.reached).toBe(true);
    expect(result.find((m) => m.id === 'streak-75')?.reached).toBe(false);
  });

  it('reaches only the daysDone milestones total days clears', () => {
    const result = evaluateMilestones(0, 100);
    expect(result.find((m) => m.id === 'days-50')?.reached).toBe(true);
    expect(result.find((m) => m.id === 'days-100')?.reached).toBe(true);
    expect(result.find((m) => m.id === 'days-365')?.reached).toBe(false);
  });

  it('a milestone stays reached even if the current streak later resets (based on longest, not current)', () => {
    // Simulates: best-ever streak was 30, current streak is irrelevant here
    // since evaluateMilestones is never given "current" at all.
    const result = evaluateMilestones(30, 40);
    expect(result.find((m) => m.id === 'streak-30')?.reached).toBe(true);
  });
});
