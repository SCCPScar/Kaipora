import { describe, it, expect } from 'vitest';
import { totalMinutesForSkill, totalMinutesAllSkills, lastPracticedDate, daysPracticed } from '../src/lib/skillStats';
import type { SkillSession } from '../src/data/types-skills';

function session(skillId: string, date: string, minutes: number): SkillSession {
  return { skillId, date, minutes };
}

describe('skillStats', () => {
  it('sums minutes for a single skill, ignoring other skills', () => {
    const sessions = [session('piano', '2026-01-01', 30), session('piano', '2026-01-02', 45), session('mandarim', '2026-01-01', 20)];
    expect(totalMinutesForSkill(sessions, 'piano')).toBe(75);
    expect(totalMinutesForSkill(sessions, 'mandarim')).toBe(20);
    expect(totalMinutesForSkill(sessions, 'does-not-exist')).toBe(0);
  });

  it('sums minutes across every skill for totalMinutesAllSkills', () => {
    const sessions = [session('piano', '2026-01-01', 30), session('mandarim', '2026-01-01', 20)];
    expect(totalMinutesAllSkills(sessions)).toBe(50);
    expect(totalMinutesAllSkills([])).toBe(0);
  });

  it('finds the most recent practice date for a skill', () => {
    const sessions = [session('piano', '2026-01-01', 30), session('piano', '2026-01-10', 20), session('piano', '2026-01-05', 15)];
    expect(lastPracticedDate(sessions, 'piano')).toBe('2026-01-10');
  });

  it('returns null when a skill has never been practiced', () => {
    expect(lastPracticedDate([], 'piano')).toBeNull();
  });

  it('counts distinct days practiced, not session count', () => {
    // Two sessions on the same day should count as one day practiced.
    const sessions = [session('piano', '2026-01-01', 30), session('piano', '2026-01-01', 15), session('piano', '2026-01-02', 20)];
    expect(daysPracticed(sessions, 'piano')).toBe(2);
  });
});
