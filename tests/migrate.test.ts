import { describe, it, expect, beforeEach } from 'vitest';
import { migrateFromLegacyApp } from '../src/lib/migrate';
import { getWeights, getMeasurements, getNotes, getDay } from '../src/lib/storage';

beforeEach(() => {
  localStorage.clear();
});

function seedLegacyApp() {
  localStorage.setItem('scar_weights', JSON.stringify([{ val: 75, date: '2026-01-01' }, { val: 74.2, date: '2026-01-05' }]));
  localStorage.setItem('scar_meds', JSON.stringify([{ date: '2026-01-01', c: '82', q: '104', co: '-', b: '28' }]));
  localStorage.setItem('scar_notes', JSON.stringify([{ date: '2026-01-01', text: 'primeiro dia' }]));
  localStorage.setItem('scar_day_2026-01-01', JSON.stringify({ pa1: true, lm2: true }));
  localStorage.setItem('scar_water_2026-01-01', JSON.stringify(5));
  localStorage.setItem('scar_ex_2026-01-01_seg', JSON.stringify(['crucifixo', 'desenvolvimento']));
  localStorage.setItem('scar_train_days', JSON.stringify({ '2026-01-01': true }));
}

describe('legacy migration', () => {
  it('migrates weights, measurements and notes without touching old keys', () => {
    seedLegacyApp();
    const { migrated } = migrateFromLegacyApp();
    expect(migrated).toBe(true);

    // migration preserves the original array order — it doesn't re-sort
    expect(getWeights()).toEqual([
      { kg: 75, date: '2026-01-01' },
      { kg: 74.2, date: '2026-01-05' }
    ]);
    expect(getMeasurements()[0]).toMatchObject({ date: '2026-01-01', waist: 82, hip: 104, arm: 28 });
    expect(getMeasurements()[0].thigh).toBeUndefined();
    expect(getNotes()).toEqual([{ date: '2026-01-01', text: 'primeiro dia' }]);

    // old keys are preserved, never deleted
    expect(localStorage.getItem('scar_weights')).not.toBeNull();
  });

  it('migrates per-day meals, water and exercises, defaulting trained days to academia', () => {
    seedLegacyApp();
    migrateFromLegacyApp();

    const day = getDay('2026-01-01');
    expect(day.meals).toEqual({ pa1: true, lm2: true });
    expect(day.water).toBe(5);
    expect(day.exercisesDone.seg).toEqual(['crucifixo', 'desenvolvimento']);
    expect(day.training).toEqual({ modality: 'academia', workoutId: 'migrated', done: true });
  });

  it('is idempotent and safe to run with no legacy data', () => {
    const first = migrateFromLegacyApp();
    expect(first.migrated).toBe(false);

    seedLegacyApp();
    const second = migrateFromLegacyApp();
    // already flagged as migrated on first run, so seeding afterwards has no effect
    expect(second.migrated).toBe(false);
    expect(getWeights()).toHaveLength(0);
  });

  it('does not overwrite data the user already entered in the new app', () => {
    seedLegacyApp();
    localStorage.removeItem(`vp_migrated_from_scar`);
    localStorage.setItem('vp_weights', JSON.stringify([{ kg: 70, date: '2026-02-01' }]));

    migrateFromLegacyApp();

    expect(getWeights()).toEqual([{ kg: 70, date: '2026-02-01' }]);
  });
});
