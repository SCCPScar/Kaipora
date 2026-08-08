import type { DayRecord, MeasurementEntry, NoteEntry, Settings, WeightEntry, Modality } from './types';
import { DEFAULT_SETTINGS } from './types';

export const PFX = 'vp';

/** Keys changed by any set* call, used by the sync layer to know what to push. */
export type ChangeListener = (key: string) => void;
const listeners = new Set<ChangeListener>();
export function onChange(fn: ChangeListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function notify(key: string) {
  for (const fn of listeners) fn(key);
}

export function rawGet<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v !== null ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function rawSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notify(key);
  } catch {
    // storage full or unavailable — data stays in memory for this session
  }
}

export function rawRemove(key: string): void {
  try {
    localStorage.removeItem(key);
    notify(key);
  } catch {
    /* ignore */
  }
}

/**
 * Internal bookkeeping keys that live under the same "vp_" prefix but are
 * NOT user data — they must never be synced to the cloud (a stale
 * vp_last_synced_at pulled from another device would corrupt this device's
 * sync cursor) and never included in backups.
 */
const INTERNAL_KEYS = new Set([`${PFX}_meta`, `${PFX}_last_synced_at`, `${PFX}_migrated_from_scar`]);

/** Every user-data key currently in localStorage, for backup/export/sync. */
export function allKeys(): string[] {
  const out: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PFX + '_') && !INTERNAL_KEYS.has(k)) out.push(k);
  }
  return out;
}

// ---- Day records (meals, water, exercises, training, habits) ----

const emptyDay = (): DayRecord => ({ meals: {}, water: 0, exercisesDone: {}, training: null, habits: {} });

export function getDay(date: string): DayRecord {
  const d = rawGet<Partial<DayRecord>>(`${PFX}_day_${date}`, {});
  return { ...emptyDay(), ...d };
}

function setDay(date: string, day: DayRecord): void {
  rawSet(`${PFX}_day_${date}`, day);
}

export function toggleMeal(date: string, mealId: string): boolean {
  const day = getDay(date);
  day.meals[mealId] = !day.meals[mealId];
  setDay(date, day);
  return day.meals[mealId];
}

export function getWater(date: string): number {
  return getDay(date).water;
}

export function setWater(date: string, glasses: number): void {
  const day = getDay(date);
  day.water = Math.max(0, glasses);
  setDay(date, day);
}

export function getExercisesDone(date: string, workoutId: string): string[] {
  return getDay(date).exercisesDone[workoutId] ?? [];
}

export function toggleExercise(date: string, workoutId: string, exerciseId: string): boolean {
  const day = getDay(date);
  const list = day.exercisesDone[workoutId] ?? [];
  const idx = list.indexOf(exerciseId);
  let done: boolean;
  if (idx >= 0) {
    list.splice(idx, 1);
    done = false;
  } else {
    list.push(exerciseId);
    done = true;
  }
  day.exercisesDone[workoutId] = list;
  setDay(date, day);
  return done;
}

export function setTrainingDone(date: string, modality: Modality, workoutId: string, done = true): void {
  const day = getDay(date);
  day.training = done ? { modality, workoutId, done: true } : null;
  setDay(date, day);
}

export function getHabits(date: string): Record<string, boolean> {
  return getDay(date).habits;
}

export function toggleHabit(date: string, habitId: string): boolean {
  const day = getDay(date);
  day.habits[habitId] = !day.habits[habitId];
  setDay(date, day);
  return day.habits[habitId];
}

// ---- Weights ----

export function getWeights(): WeightEntry[] {
  return rawGet<WeightEntry[]>(`${PFX}_weights`, []);
}

export function addWeight(kg: number, date: string): void {
  const list = getWeights();
  list.unshift({ kg, date });
  rawSet(`${PFX}_weights`, list);
}

export function deleteWeight(index: number): void {
  const list = getWeights();
  list.splice(index, 1);
  rawSet(`${PFX}_weights`, list);
}

// ---- Measurements ----

export function getMeasurements(): MeasurementEntry[] {
  return rawGet<MeasurementEntry[]>(`${PFX}_measurements`, []);
}

export function addMeasurement(entry: MeasurementEntry): void {
  const list = getMeasurements();
  list.unshift(entry);
  rawSet(`${PFX}_measurements`, list);
}

export function deleteMeasurement(index: number): void {
  const list = getMeasurements();
  list.splice(index, 1);
  rawSet(`${PFX}_measurements`, list);
}

// ---- Notes ----

export function getNotes(): NoteEntry[] {
  return rawGet<NoteEntry[]>(`${PFX}_notes`, []);
}

export function addNote(text: string, date: string): void {
  const list = getNotes();
  list.unshift({ text, date });
  rawSet(`${PFX}_notes`, list);
}

export function deleteNote(index: number): void {
  const list = getNotes();
  list.splice(index, 1);
  rawSet(`${PFX}_notes`, list);
}

// ---- Settings ----

export function getSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...rawGet<Partial<Settings>>(`${PFX}_settings`, {}) };
}

export function saveSettings(patch: Partial<Settings>): Settings {
  const next = { ...getSettings(), ...patch };
  rawSet(`${PFX}_settings`, next);
  return next;
}

// ---- Full export / import (backup) ----

export interface Backup {
  version: 2;
  exportedAt: string;
  data: Record<string, unknown>;
}

export function exportBackup(): Backup {
  const data: Record<string, unknown> = {};
  for (const key of allKeys()) {
    data[key] = rawGet(key, null);
  }
  return { version: 2, exportedAt: new Date().toISOString(), data };
}

export function importBackup(backup: Backup): void {
  if (!backup || typeof backup !== 'object' || !backup.data) {
    throw new Error('Ficheiro de backup inválido.');
  }
  for (const [key, value] of Object.entries(backup.data)) {
    if (key.startsWith(PFX + '_') && !INTERNAL_KEYS.has(key)) rawSet(key, value);
  }
}

// ---- Exercise load / strength progression ----

export interface ExerciseLogEntry {
  date: string;
  weightKg?: number;
  reps?: number;
}

export function getExerciseLoads(exerciseId: string): ExerciseLogEntry[] {
  return rawGet<ExerciseLogEntry[]>(`${PFX}_loads_${exerciseId}`, []);
}

export function logExerciseLoad(exerciseId: string, entry: ExerciseLogEntry): void {
  const list = getExerciseLoads(exerciseId);
  list.unshift(entry);
  rawSet(`${PFX}_loads_${exerciseId}`, list);
}

export function deleteExerciseLoad(exerciseId: string, index: number): void {
  const list = getExerciseLoads(exerciseId);
  list.splice(index, 1);
  rawSet(`${PFX}_loads_${exerciseId}`, list);
}
