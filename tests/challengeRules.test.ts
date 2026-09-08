import { describe, it, expect, beforeEach } from 'vitest';
import { challengeDayStatus, challengeCompletedFlags } from '../src/lib/challengeRules';
import { setWater, setTrainingDone, saveSettings, addSkill, logSkillSession, setChallengeDayLog } from '../src/lib/storage';
import type { Challenge } from '../src/data/types-challenges';

const k75: Challenge = { id: 'ch1', title: 'Kaipora 75', totalDays: 75, startDate: '2026-01-01', kind: 'kaipora75' };
const k45WithRest: Challenge = {
  id: 'ch2',
  title: 'Kaipora 45',
  totalDays: 45,
  startDate: '2026-01-01',
  kind: 'kaipora45',
  restWeekday: 'dom' // 2026-01-04 is a Sunday
};

beforeEach(() => {
  localStorage.clear();
  saveSettings({ waterGoalMl: 2000 }); // glassGoal = 8
});

describe('challengeDayStatus', () => {
  it('a day with nothing logged fails every rule', () => {
    const status = challengeDayStatus(k75, '2026-01-01');
    expect(status).toEqual({ water: false, training: false, skill: false, diet: false, allDone: false });
  });

  it('only counts as allDone when água, treino/atividade, habilidade and dieta are all met', () => {
    setWater('2026-01-01', 8);
    setTrainingDone('2026-01-01', 'academia', 'seg-academia', true);
    addSkill({ id: 'sk1', name: 'Piano' });
    logSkillSession({ skillId: 'sk1', date: '2026-01-01', minutes: 20 });
    setChallengeDayLog(k75.id, '2026-01-01', { dietOk: true });

    expect(challengeDayStatus(k75, '2026-01-01')).toEqual({
      water: true,
      training: true,
      skill: true,
      diet: true,
      allDone: true
    });
  });

  it('"outra atividade física" satisfies the training rule without a formal treino', () => {
    setChallengeDayLog(k75.id, '2026-01-01', { extraActivity: true });
    expect(challengeDayStatus(k75, '2026-01-01').training).toBe(true);
  });

  it('a skill session logged for any skill on that date satisfies the skill rule', () => {
    addSkill({ id: 'sk1', name: 'Mandarim' });
    logSkillSession({ skillId: 'sk1', date: '2026-01-05', minutes: 10 });
    expect(challengeDayStatus(k75, '2026-01-05').skill).toBe(true);
    expect(challengeDayStatus(k75, '2026-01-04').skill).toBe(false);
  });

  it('diet/extraActivity logs for a different challenge id do not leak across challenges', () => {
    setChallengeDayLog(k75.id, '2026-01-01', { dietOk: true, extraActivity: true });
    const other = challengeDayStatus(k45WithRest, '2026-01-01');
    expect(other.diet).toBe(false);
    expect(other.training).toBe(false);
  });

  it("Kaipora 45's planned rest weekday satisfies training automatically, never a miss", () => {
    // 2026-01-04 is a Sunday, the configured restWeekday
    expect(challengeDayStatus(k45WithRest, '2026-01-04').training).toBe(true);
    // any other day of that week still needs a real treino/atividade
    expect(challengeDayStatus(k45WithRest, '2026-01-05').training).toBe(false);
  });

  it('a challenge without restWeekday never gets the automatic pass (Kaipora 75)', () => {
    expect(challengeDayStatus(k75, '2026-01-04').training).toBe(false);
  });
});

describe('challengeCompletedFlags', () => {
  it('returns one flag per day in the inclusive range, oldest first', () => {
    const flags = challengeCompletedFlags(k75, '2026-01-01', '2026-01-05');
    expect(flags).toHaveLength(5);
    expect(flags.every((f) => f === false)).toBe(true);
  });

  it('returns an empty array when the range is inverted', () => {
    expect(challengeCompletedFlags(k75, '2026-01-05', '2026-01-01')).toEqual([]);
  });

  it('a missed day is just false, not an error, and later days can still be true', () => {
    setWater('2026-01-02', 8);
    setTrainingDone('2026-01-02', 'academia', 'seg-academia', true);
    addSkill({ id: 'sk1', name: 'Desenho' });
    logSkillSession({ skillId: 'sk1', date: '2026-01-02', minutes: 15 });
    setChallengeDayLog(k75.id, '2026-01-02', { dietOk: true });

    const flags = challengeCompletedFlags(k75, '2026-01-01', '2026-01-03');
    expect(flags).toEqual([false, true, false]);
  });
});
