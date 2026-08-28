import { rawGet, rawSet, PFX } from './storage';
import type { DayRecord } from './types';
import { HABITS } from '../data/habits';
import { toISO, addDays, fromISO } from './dates';

const OLD_PFX = 'scar';
const MIGRATION_FLAG = `${PFX}_migrated_from_scar`;

interface OldDay {
  [mealId: string]: boolean;
}

/**
 * One-time, non-destructive migration of the original plano-scar.html
 * localStorage keys (prefix "scar_") into the Kaipora schema (prefix "vp_").
 * Old keys are never deleted, so nothing is lost even if this runs more than once
 * or the new schema changes again later.
 */
export function migrateFromLegacyApp(): { migrated: boolean; warnings: string[] } {
  const warnings: string[] = [];
  if (rawGet<boolean>(MIGRATION_FLAG, false)) {
    return { migrated: false, warnings };
  }

  let touchedAnything = false;

  // Weights: scar_weights -> vp_weights ({val,date}[] -> {kg,date}[])
  const oldWeights = rawGet<{ val: number; date: string }[]>(`${OLD_PFX}_weights`, []);
  if (oldWeights.length) {
    const existing = rawGet<{ kg: number; date: string }[]>(`${PFX}_weights`, []);
    if (!existing.length) {
      rawSet(
        `${PFX}_weights`,
        oldWeights.map((w) => ({ kg: w.val, date: w.date }))
      );
      touchedAnything = true;
    }
  }

  // Measurements: scar_meds -> vp_measurements ({date,c,q,co,b}[] -> typed fields)
  const oldMeds = rawGet<{ date: string; c?: string; q?: string; co?: string; b?: string }[]>(`${OLD_PFX}_meds`, []);
  if (oldMeds.length) {
    const existing = rawGet<unknown[]>(`${PFX}_measurements`, []);
    if (!existing.length) {
      const num = (v?: string) => (v && v !== '-' ? parseFloat(v) : undefined);
      rawSet(
        `${PFX}_measurements`,
        oldMeds.map((m) => ({
          date: m.date,
          waist: num(m.c),
          hip: num(m.q),
          thigh: num(m.co),
          arm: num(m.b)
        }))
      );
      touchedAnything = true;
    }
  }

  // Notes: scar_notes -> vp_notes (same shape)
  const oldNotes = rawGet<{ date: string; text: string }[]>(`${OLD_PFX}_notes`, []);
  if (oldNotes.length) {
    const existing = rawGet<unknown[]>(`${PFX}_notes`, []);
    if (!existing.length) {
      rawSet(`${PFX}_notes`, oldNotes);
      touchedAnything = true;
    }
  }

  // Per-day records: scar_day_{date}, scar_water_{date}, scar_ex_{date}_{dayId}
  const dateKeys = new Set<string>();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const dayMatch = key.match(/^scar_day_(\d{4}-\d{2}-\d{2})$/);
    const waterMatch = key.match(/^scar_water_(\d{4}-\d{2}-\d{2})$/);
    const exMatch = key.match(/^scar_ex_(\d{4}-\d{2}-\d{2})_/);
    if (dayMatch) dateKeys.add(dayMatch[1]);
    if (waterMatch) dateKeys.add(waterMatch[1]);
    if (exMatch) dateKeys.add(exMatch[1]);
  }

  const oldTrainDays = rawGet<Record<string, boolean>>(`${OLD_PFX}_train_days`, {});

  for (const date of dateKeys) {
    const newDayKey = `${PFX}_day_${date}`;
    const alreadyMigrated = rawGet<DayRecord | null>(newDayKey, null);
    if (alreadyMigrated) continue;

    const oldMeals = rawGet<OldDay>(`${OLD_PFX}_day_${date}`, {});
    const oldWater = rawGet<number>(`${OLD_PFX}_water_${date}`, 0);

    const exercisesDone: Record<string, string[]> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const m = key.match(new RegExp(`^scar_ex_${date}_(.+)$`));
      if (m) {
        const workoutId = m[1];
        exercisesDone[workoutId] = rawGet<string[]>(key, []);
      }
    }

    // Old app only recorded "trained: true/false" with no modality. We default
    // migrated true days to "academia" (the more frequent modality in the old
    // plan) and flag this so it's visible to the user — see README limitations.
    const trained = oldTrainDays[date];
    const record: DayRecord = {
      meals: oldMeals,
      water: oldWater,
      exercisesDone,
      training: trained ? { modality: 'academia', workoutId: 'migrated', done: true } : null,
      habits: {},
      routineDone: []
    };

    rawSet(newDayKey, record);
    touchedAnything = true;
  }

  if (dateKeys.size > 0) {
    warnings.push(
      `${dateKeys.size} dia(s) de dados antigos foram migrados. O tipo de treino (Academia/Casa) desses dias antigos foi assumido como "Academia" porque a app original não guardava essa informação.`
    );
  }

  // Habits: scar_hab_{weekStartISO} -> per-day vp_day_{date}.habits.
  // Old format tracked one checkbox per habit PER DAY OF THE WEEK
  // (key "{habitIndex}_{dayOfWeekIndex}"), so it maps exactly onto the new
  // per-day schema — no approximation needed, unlike the trained-days flag above.
  let habitDaysMigrated = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key) continue;
    const weekMatch = key.match(/^scar_hab_(\d{4}-\d{2}-\d{2})$/);
    if (!weekMatch) continue;

    const weekStart = fromISO(weekMatch[1]);
    const weekData = rawGet<Record<string, boolean>>(key, {});

    for (const [entryKey, done] of Object.entries(weekData)) {
      if (!done) continue;
      const [hStr, diStr] = entryKey.split('_');
      const habitIndex = Number(hStr);
      const dayOfWeek = Number(diStr);
      const habit = HABITS[habitIndex];
      if (!habit || Number.isNaN(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) continue;

      const date = toISO(addDays(weekStart, dayOfWeek));
      const dayKey = `${PFX}_day_${date}`;
      const existing = rawGet<DayRecord | null>(dayKey, null);
      const merged: DayRecord = existing ?? { meals: {}, water: 0, exercisesDone: {}, training: null, habits: {}, routineDone: [] };
      if (!merged.habits[habit.id]) {
        merged.habits[habit.id] = true;
        rawSet(dayKey, merged);
        habitDaysMigrated++;
        touchedAnything = true;
      }
    }
  }

  if (habitDaysMigrated > 0) {
    warnings.push(`${habitDaysMigrated} registo(s) de hábitos antigos foram migrados para os dias correspondentes.`);
  }

  rawSet(MIGRATION_FLAG, true);
  return { migrated: touchedAnything, warnings };
}
