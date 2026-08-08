import { describe, it, expect, beforeEach } from 'vitest';
import {
  rawGet,
  rawSet,
  getDay,
  toggleMeal,
  getWater,
  setWater,
  toggleExercise,
  getExercisesDone,
  setTrainingDone,
  toggleHabit,
  getWeights,
  addWeight,
  deleteWeight,
  getMeasurements,
  addMeasurement,
  getNotes,
  addNote,
  getSettings,
  saveSettings,
  exportBackup,
  importBackup
} from '../src/lib/storage';

beforeEach(() => {
  localStorage.clear();
});

describe('raw get/set', () => {
  it('round-trips JSON values', () => {
    rawSet('vp_test', { a: 1 });
    expect(rawGet('vp_test', null)).toEqual({ a: 1 });
  });

  it('returns the fallback when nothing stored', () => {
    expect(rawGet('vp_missing', 'fallback')).toBe('fallback');
  });
});

describe('day records', () => {
  it('toggles a meal option on and off', () => {
    const date = '2026-01-01';
    expect(toggleMeal(date, 'pa1')).toBe(true);
    expect(getDay(date).meals.pa1).toBe(true);
    expect(toggleMeal(date, 'pa1')).toBe(false);
    expect(getDay(date).meals.pa1).toBe(false);
  });

  it('tracks water glasses per day independently', () => {
    setWater('2026-01-01', 3);
    setWater('2026-01-02', 5);
    expect(getWater('2026-01-01')).toBe(3);
    expect(getWater('2026-01-02')).toBe(5);
  });

  it('never lets water go negative', () => {
    setWater('2026-01-01', -5);
    expect(getWater('2026-01-01')).toBe(0);
  });

  it('toggles exercises done for a specific workout', () => {
    const date = '2026-01-01';
    expect(toggleExercise(date, 'seg-academia', 'crucifixo')).toBe(true);
    expect(getExercisesDone(date, 'seg-academia')).toContain('crucifixo');
    expect(toggleExercise(date, 'seg-academia', 'crucifixo')).toBe(false);
    expect(getExercisesDone(date, 'seg-academia')).not.toContain('crucifixo');
  });

  it('records which modality/workout was completed', () => {
    const date = '2026-01-01';
    setTrainingDone(date, 'casa', 'seg-casa', true);
    expect(getDay(date).training).toEqual({ modality: 'casa', workoutId: 'seg-casa', done: true });
    setTrainingDone(date, 'casa', 'seg-casa', false);
    expect(getDay(date).training).toBeNull();
  });

  it('toggles habits per day', () => {
    const date = '2026-01-01';
    expect(toggleHabit(date, 'agua')).toBe(true);
    expect(getDay(date).habits.agua).toBe(true);
  });
});

describe('weights', () => {
  it('adds newest weight first and deletes by index', () => {
    addWeight(75, '2026-01-01');
    addWeight(74.5, '2026-01-02');
    expect(getWeights().map((w) => w.kg)).toEqual([74.5, 75]);
    deleteWeight(0);
    expect(getWeights().map((w) => w.kg)).toEqual([75]);
  });
});

describe('measurements & notes', () => {
  it('stores measurement entries', () => {
    addMeasurement({ date: '2026-01-01', waist: 82, hip: 104 });
    expect(getMeasurements()).toHaveLength(1);
    expect(getMeasurements()[0].waist).toBe(82);
  });

  it('stores notes newest first', () => {
    addNote('primeiro dia', '2026-01-01');
    addNote('segundo dia', '2026-01-02');
    expect(getNotes().map((n) => n.text)).toEqual(['segundo dia', 'primeiro dia']);
  });
});

describe('settings', () => {
  it('falls back to defaults and merges patches', () => {
    expect(getSettings().waterGoalMl).toBe(2000);
    saveSettings({ waterGoalMl: 2500 });
    expect(getSettings().waterGoalMl).toBe(2500);
    expect(getSettings().calorieGoal).toBe(1615); // untouched default preserved
  });
});

describe('backup export/import', () => {
  it('round-trips all app data through export/import', () => {
    addWeight(75, '2026-01-01');
    setWater('2026-01-01', 4);
    const backup = exportBackup();

    localStorage.clear();
    expect(getWeights()).toHaveLength(0);

    importBackup(backup);
    expect(getWeights()).toHaveLength(1);
    expect(getWater('2026-01-01')).toBe(4);
  });

  it('rejects a malformed backup instead of silently wiping data', () => {
    addWeight(75, '2026-01-01');
    // @ts-expect-error intentionally malformed input
    expect(() => importBackup({ notABackup: true })).toThrow();
    expect(getWeights()).toHaveLength(1);
  });
});
