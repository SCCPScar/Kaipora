import { describe, it, expect, beforeEach } from 'vitest';
import { kaipora75DayStatus, kaipora75CompletedFlags } from '../src/lib/kaipora75';
import { setWater, setTrainingDone, saveSettings, addSkill, logSkillSession, setChallengeDayLog } from '../src/lib/storage';

beforeEach(() => {
  localStorage.clear();
  saveSettings({ waterGoalMl: 2000 }); // glassGoal = 8
});

describe('kaipora75DayStatus', () => {
  it('a day with nothing logged fails every rule', () => {
    const status = kaipora75DayStatus('ch1', '2026-01-01');
    expect(status).toEqual({ water: false, training: false, skill: false, diet: false, allDone: false });
  });

  it('only counts as allDone when água, treino/atividade, habilidade and dieta are all met', () => {
    setWater('2026-01-01', 8);
    setTrainingDone('2026-01-01', 'academia', 'seg-academia', true);
    addSkill({ id: 'sk1', name: 'Piano' });
    logSkillSession({ skillId: 'sk1', date: '2026-01-01', minutes: 20 });
    setChallengeDayLog('ch1', '2026-01-01', { dietOk: true });

    expect(kaipora75DayStatus('ch1', '2026-01-01')).toEqual({
      water: true,
      training: true,
      skill: true,
      diet: true,
      allDone: true
    });
  });

  it('"outra atividade física" satisfies the training rule without a formal treino', () => {
    setChallengeDayLog('ch1', '2026-01-01', { extraActivity: true });
    expect(kaipora75DayStatus('ch1', '2026-01-01').training).toBe(true);
  });

  it('a skill session logged for any skill on that date satisfies the skill rule', () => {
    addSkill({ id: 'sk1', name: 'Mandarim' });
    logSkillSession({ skillId: 'sk1', date: '2026-01-05', minutes: 10 });
    expect(kaipora75DayStatus('ch1', '2026-01-05').skill).toBe(true);
    expect(kaipora75DayStatus('ch1', '2026-01-04').skill).toBe(false);
  });

  it('diet/extraActivity logs for a different challenge id do not leak across challenges', () => {
    setChallengeDayLog('ch1', '2026-01-01', { dietOk: true, extraActivity: true });
    const other = kaipora75DayStatus('ch2', '2026-01-01');
    expect(other.diet).toBe(false);
    expect(other.training).toBe(false);
  });
});

describe('kaipora75CompletedFlags', () => {
  it('returns one flag per day in the inclusive range, oldest first', () => {
    const flags = kaipora75CompletedFlags('ch1', '2026-01-01', '2026-01-05');
    expect(flags).toHaveLength(5);
    expect(flags.every((f) => f === false)).toBe(true);
  });

  it('returns an empty array when the range is inverted', () => {
    expect(kaipora75CompletedFlags('ch1', '2026-01-05', '2026-01-01')).toEqual([]);
  });

  it('a missed day is just false, not an error, and later days can still be true', () => {
    setWater('2026-01-02', 8);
    setTrainingDone('2026-01-02', 'academia', 'seg-academia', true);
    addSkill({ id: 'sk1', name: 'Desenho' });
    logSkillSession({ skillId: 'sk1', date: '2026-01-02', minutes: 15 });
    setChallengeDayLog('ch1', '2026-01-02', { dietOk: true });

    const flags = kaipora75CompletedFlags('ch1', '2026-01-01', '2026-01-03');
    expect(flags).toEqual([false, true, false]);
  });
});
