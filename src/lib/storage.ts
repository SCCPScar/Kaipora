import type { DayRecord, MeasurementEntry, NoteEntry, JournalEntry, Settings, WeightEntry, Modality, Tombstonable } from './types';
import { DEFAULT_SETTINGS } from './types';
import { visible, withAdded, withSoftDeleted } from './tombstoneList';
import type { FixedCommitment, FlexibleActivity } from '../data/types-routine';
import type { CustomFoodOption, FoodLogEntry } from '../data/types-diet';
import type { CustomExercise, CustomWorkout, WorkoutExercise } from '../data/types-training';
import type { Skill, SkillSession, Reward } from '../data/types-skills';
import type { Challenge } from '../data/types-challenges';

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

const emptyDay = (): DayRecord => ({ meals: {}, water: 0, exercisesDone: {}, training: null, habits: {}, routineDone: [] });

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

export function toggleRoutineItem(date: string, itemId: string): boolean {
  const day = getDay(date);
  const idx = day.routineDone.indexOf(itemId);
  let done: boolean;
  if (idx >= 0) {
    day.routineDone.splice(idx, 1);
    done = false;
  } else {
    day.routineDone.push(itemId);
    done = true;
  }
  setDay(date, day);
  return done;
}

// ---- Weights ----
// Deletes are soft (tombstoned), never spliced out, so a delete made offline
// on one device can't be silently undone by a stale copy still held by
// another device once they sync — see tombstoneList.ts and merge.ts.

function getWeightsRaw(): WeightEntry[] {
  return rawGet<WeightEntry[]>(`${PFX}_weights`, []);
}

export function getWeights(): WeightEntry[] {
  return visible(getWeightsRaw());
}

export function addWeight(kg: number, date: string): void {
  rawSet(`${PFX}_weights`, withAdded(getWeightsRaw(), { kg, date }));
}

export function deleteWeight(visibleIndex: number): void {
  rawSet(
    `${PFX}_weights`,
    withSoftDeleted(getWeightsRaw(), visibleIndex, (a, b) => a.date === b.date && a.kg === b.kg)
  );
}

// ---- Measurements ----

function getMeasurementsRaw(): MeasurementEntry[] {
  return rawGet<MeasurementEntry[]>(`${PFX}_measurements`, []);
}

export function getMeasurements(): MeasurementEntry[] {
  return visible(getMeasurementsRaw());
}

function sameMeasurement(a: MeasurementEntry, b: MeasurementEntry): boolean {
  return (
    a.date === b.date &&
    a.waist === b.waist &&
    a.hip === b.hip &&
    a.thigh === b.thigh &&
    a.arm === b.arm &&
    JSON.stringify(a.extra ?? {}) === JSON.stringify(b.extra ?? {})
  );
}

export function addMeasurement(entry: Omit<MeasurementEntry, 'updatedAt' | 'deleted'>): void {
  rawSet(`${PFX}_measurements`, withAdded(getMeasurementsRaw(), entry));
}

export function deleteMeasurement(visibleIndex: number): void {
  rawSet(`${PFX}_measurements`, withSoftDeleted(getMeasurementsRaw(), visibleIndex, sameMeasurement));
}

/**
 * Edits are implemented as tombstone-the-old-entry + add-a-new-one, rather
 * than mutating fields in place. The sync/merge layer identifies entries by
 * their content (see merge.ts), so an in-place field change would silently
 * create a duplicate on the next sync instead of replacing anything — going
 * through the same soft-delete + add primitives keeps editing exactly as
 * sync-safe as deleting already is.
 */
export function updateMeasurement(visibleIndex: number, next: Omit<MeasurementEntry, 'updatedAt' | 'deleted'>): void {
  const withDeleted = withSoftDeleted(getMeasurementsRaw(), visibleIndex, sameMeasurement);
  rawSet(`${PFX}_measurements`, withAdded(withDeleted, next));
}

// ---- Notes ----

function getNotesRaw(): NoteEntry[] {
  return rawGet<NoteEntry[]>(`${PFX}_notes`, []);
}

export function getNotes(): NoteEntry[] {
  return visible(getNotesRaw());
}

export function addNote(text: string, date: string): void {
  rawSet(`${PFX}_notes`, withAdded(getNotesRaw(), { text, date }));
}

export function deleteNote(visibleIndex: number): void {
  rawSet(
    `${PFX}_notes`,
    withSoftDeleted(getNotesRaw(), visibleIndex, (a, b) => a.date === b.date && a.text === b.text)
  );
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

export interface ExerciseLogEntry extends Tombstonable {
  date: string;
  weightKg?: number; // academia: carga
  reps?: number; // ambos: repetições
  seconds?: number; // ambos: duração (ex. prancha, exercícios isométricos)
  note?: string; // casa: variação/dificuldade (ex. "joelhos", "avançado", "elástico vermelho")
}

function getExerciseLoadsRaw(exerciseId: string): ExerciseLogEntry[] {
  return rawGet<ExerciseLogEntry[]>(`${PFX}_loads_${exerciseId}`, []);
}

export function getExerciseLoads(exerciseId: string): ExerciseLogEntry[] {
  return visible(getExerciseLoadsRaw(exerciseId));
}

export function logExerciseLoad(exerciseId: string, entry: Omit<ExerciseLogEntry, 'updatedAt' | 'deleted'>): void {
  rawSet(`${PFX}_loads_${exerciseId}`, withAdded(getExerciseLoadsRaw(exerciseId), entry));
}

export function deleteExerciseLoad(exerciseId: string, visibleIndex: number): void {
  rawSet(
    `${PFX}_loads_${exerciseId}`,
    withSoftDeleted(
      getExerciseLoadsRaw(exerciseId),
      visibleIndex,
      (a, b) => a.date === b.date && a.weightKg === b.weightKg && a.reps === b.reps && a.seconds === b.seconds && a.note === b.note
    )
  );
}

// ---- Rotina: compromissos fixos e atividades flexíveis ----

function getFixedCommitmentsRaw(): FixedCommitment[] {
  return rawGet<FixedCommitment[]>(`${PFX}_routine_fixed`, []);
}

export function getFixedCommitments(): FixedCommitment[] {
  return visible(getFixedCommitmentsRaw());
}

export function addFixedCommitment(entry: Omit<FixedCommitment, 'updatedAt' | 'deleted'>): void {
  rawSet(`${PFX}_routine_fixed`, withAdded(getFixedCommitmentsRaw(), entry));
}

export function deleteFixedCommitment(visibleIndex: number): void {
  rawSet(
    `${PFX}_routine_fixed`,
    withSoftDeleted(
      getFixedCommitmentsRaw(),
      visibleIndex,
      (a, b) => a.label === b.label && a.startMin === b.startMin && a.endMin === b.endMin
    )
  );
}

function getFlexibleActivitiesRaw(): FlexibleActivity[] {
  return rawGet<FlexibleActivity[]>(`${PFX}_routine_flexible`, []);
}

export function getFlexibleActivities(): FlexibleActivity[] {
  return visible(getFlexibleActivitiesRaw());
}

export function addFlexibleActivity(entry: Omit<FlexibleActivity, 'updatedAt' | 'deleted'>): void {
  rawSet(`${PFX}_routine_flexible`, withAdded(getFlexibleActivitiesRaw(), entry));
}

export function deleteFlexibleActivity(visibleIndex: number): void {
  rawSet(
    `${PFX}_routine_flexible`,
    withSoftDeleted(getFlexibleActivitiesRaw(), visibleIndex, (a, b) => a.label === b.label && a.durationMin === b.durationMin)
  );
}

// ---- Alimentação: opções personalizadas na Minha Dieta ----
// Additive overlay over the built-in MEALS plan (src/data/diet.ts) — the
// built-in options are never edited or deleted, only hidden per device/account
// (see getHiddenMealOptionIds below) so the curated plan itself is preserved.

function getCustomFoodOptionsRaw(): CustomFoodOption[] {
  return rawGet<CustomFoodOption[]>(`${PFX}_diet_custom_options`, []);
}

export function getCustomFoodOptions(mealId?: string): CustomFoodOption[] {
  const all = visible(getCustomFoodOptionsRaw());
  return mealId ? all.filter((o) => o.mealId === mealId) : all;
}

export function addCustomFoodOption(entry: Omit<CustomFoodOption, 'updatedAt' | 'deleted'>): void {
  rawSet(`${PFX}_diet_custom_options`, withAdded(getCustomFoodOptionsRaw(), entry));
}

/** `visibleIndex` must be the entry's index within the FULL visible list
 * (getCustomFoodOptions() with no mealId filter) — see withSoftDeleted. */
export function deleteCustomFoodOption(visibleIndex: number): void {
  rawSet(
    `${PFX}_diet_custom_options`,
    withSoftDeleted(getCustomFoodOptionsRaw(), visibleIndex, (a, b) => a.mealId === b.mealId && a.label === b.label && a.kcal === b.kcal)
  );
}

/**
 * Which built-in FoodOption ids are hidden from view for this
 * device/account. A plain string array rather than a tombstoned list — like
 * Settings, it's a rare, low-stakes conflict on sync (worst case: a hide/show
 * toggle from one device is overwritten by another's), never data loss of an
 * actual logged entry.
 */
export function getHiddenMealOptionIds(): string[] {
  return rawGet<string[]>(`${PFX}_diet_hidden_options`, []);
}

export function toggleHiddenMealOption(optionId: string): boolean {
  const hidden = getHiddenMealOptionIds();
  const idx = hidden.indexOf(optionId);
  let isHidden: boolean;
  if (idx >= 0) {
    hidden.splice(idx, 1);
    isHidden = false;
  } else {
    hidden.push(optionId);
    isHidden = true;
  }
  rawSet(`${PFX}_diet_hidden_options`, hidden);
  return isHidden;
}

// ---- Alimentação: Diário Livre (registo alimentar fora do plano fixo) ----

function getFoodLogRaw(): FoodLogEntry[] {
  return rawGet<FoodLogEntry[]>(`${PFX}_food_log`, []);
}

export function getFoodLog(date?: string): FoodLogEntry[] {
  const all = visible(getFoodLogRaw());
  return date ? all.filter((e) => e.date === date) : all;
}

export function addFoodLogEntry(entry: Omit<FoodLogEntry, 'updatedAt' | 'deleted'>): void {
  rawSet(`${PFX}_food_log`, withAdded(getFoodLogRaw(), entry));
}

/** `visibleIndex` must be the entry's index within the FULL visible list
 * (getFoodLog() with no date filter) — see withSoftDeleted. */
export function deleteFoodLogEntry(visibleIndex: number): void {
  rawSet(
    `${PFX}_food_log`,
    withSoftDeleted(getFoodLogRaw(), visibleIndex, (a, b) => a.date === b.date && a.label === b.label && a.kcal === b.kcal)
  );
}

// ---- Treinos personalizáveis: exercícios e treinos criados pela utilizadora ----
// The built-in TRAINING_WEEK plan (src/data/training.ts) is never edited or
// deleted — this is a separate, additive library the user builds on top of it.

function getCustomExercisesRaw(): CustomExercise[] {
  return rawGet<CustomExercise[]>(`${PFX}_custom_exercises`, []);
}

export function getCustomExercises(): CustomExercise[] {
  return visible(getCustomExercisesRaw());
}

export function addCustomExercise(entry: Omit<CustomExercise, 'updatedAt' | 'deleted'>): void {
  rawSet(`${PFX}_custom_exercises`, withAdded(getCustomExercisesRaw(), entry));
}

export function deleteCustomExercise(visibleIndex: number): void {
  rawSet(`${PFX}_custom_exercises`, withSoftDeleted(getCustomExercisesRaw(), visibleIndex, (a, b) => a.id === b.id));
}

function getCustomWorkoutsRaw(): CustomWorkout[] {
  return rawGet<CustomWorkout[]>(`${PFX}_custom_workouts`, []);
}

export function getCustomWorkouts(): CustomWorkout[] {
  return visible(getCustomWorkoutsRaw());
}

export function addCustomWorkout(entry: Omit<CustomWorkout, 'updatedAt' | 'deleted'>): void {
  rawSet(`${PFX}_custom_workouts`, withAdded(getCustomWorkoutsRaw(), entry));
}

export function deleteCustomWorkout(visibleIndex: number): void {
  rawSet(`${PFX}_custom_workouts`, withSoftDeleted(getCustomWorkoutsRaw(), visibleIndex, (a, b) => a.id === b.id));
}

/**
 * A CustomWorkout's exercise list is edited as a whole (tombstone the old
 * version + add the edited one) rather than mutated in place — same
 * sync-safe pattern as updateMeasurement, since CustomWorkout has a stable
 * `id` to match on instead of a content tuple.
 */
function replaceCustomWorkoutExercises(workoutId: string, exercises: WorkoutExercise[]): void {
  const raw = getCustomWorkoutsRaw();
  const current = visible(raw).find((w) => w.id === workoutId);
  if (!current) return;
  const tombstoned = withSoftDeleted(
    raw,
    visible(raw).findIndex((w) => w.id === workoutId),
    (a, b) => a.id === b.id
  );
  rawSet(`${PFX}_custom_workouts`, withAdded(tombstoned, { ...current, exercises }));
}

export function addExerciseToCustomWorkout(workoutId: string, exercise: WorkoutExercise): void {
  const current = getCustomWorkouts().find((w) => w.id === workoutId);
  if (!current) return;
  replaceCustomWorkoutExercises(workoutId, [...current.exercises, exercise]);
}

export function removeExerciseFromCustomWorkout(workoutId: string, exerciseIndex: number): void {
  const current = getCustomWorkouts().find((w) => w.id === workoutId);
  if (!current) return;
  replaceCustomWorkoutExercises(
    workoutId,
    current.exercises.filter((_, i) => i !== exerciseIndex)
  );
}

// ---- Habilidades: skills, sessões de prática, recompensas ----
// Deleting a skill only removes it from the active list (soft-delete) — its
// logged sessions are never touched, so past time invested is never lost.

function getSkillsRaw(): Skill[] {
  return rawGet<Skill[]>(`${PFX}_skills`, []);
}

export function getSkills(): Skill[] {
  return visible(getSkillsRaw());
}

export function addSkill(entry: Omit<Skill, 'updatedAt' | 'deleted'>): void {
  rawSet(`${PFX}_skills`, withAdded(getSkillsRaw(), entry));
}

export function deleteSkill(visibleIndex: number): void {
  rawSet(`${PFX}_skills`, withSoftDeleted(getSkillsRaw(), visibleIndex, (a, b) => a.id === b.id));
}

function getSkillSessionsRaw(): SkillSession[] {
  return rawGet<SkillSession[]>(`${PFX}_skill_sessions`, []);
}

export function getSkillSessions(skillId?: string): SkillSession[] {
  const all = visible(getSkillSessionsRaw());
  return skillId ? all.filter((s) => s.skillId === skillId) : all;
}

export function logSkillSession(entry: Omit<SkillSession, 'updatedAt' | 'deleted'>): void {
  rawSet(`${PFX}_skill_sessions`, withAdded(getSkillSessionsRaw(), entry));
}

/** `visibleIndex` must be the entry's index within the FULL visible list
 * (getSkillSessions() with no skillId filter) — see withSoftDeleted. */
export function deleteSkillSession(visibleIndex: number): void {
  rawSet(
    `${PFX}_skill_sessions`,
    withSoftDeleted(getSkillSessionsRaw(), visibleIndex, (a, b) => a.skillId === b.skillId && a.date === b.date && a.minutes === b.minutes)
  );
}

function getRewardsRaw(): Reward[] {
  return rawGet<Reward[]>(`${PFX}_rewards`, []);
}

export function getRewards(): Reward[] {
  return visible(getRewardsRaw());
}

export function addReward(entry: Omit<Reward, 'updatedAt' | 'deleted' | 'claimed' | 'claimedAt'>): void {
  rawSet(`${PFX}_rewards`, withAdded(getRewardsRaw(), { ...entry, claimed: false }));
}

export function deleteReward(visibleIndex: number): void {
  rawSet(`${PFX}_rewards`, withSoftDeleted(getRewardsRaw(), visibleIndex, (a, b) => a.id === b.id));
}

/** Marking a reward claimed is an edit like updateMeasurement/
 * replaceCustomWorkoutExercises: tombstone the old version, add the claimed
 * one, matched by the reward's stable id. */
export function claimReward(rewardId: string, claimedAt: string): void {
  const raw = getRewardsRaw();
  const current = visible(raw).find((r) => r.id === rewardId);
  if (!current) return;
  const tombstoned = withSoftDeleted(
    raw,
    visible(raw).findIndex((r) => r.id === rewardId),
    (a, b) => a.id === b.id
  );
  rawSet(`${PFX}_rewards`, withAdded(tombstoned, { ...current, claimed: true, claimedAt }));
}

// ---- Diário livre — distinct from Progresso's vp_notes (body/training notes) ----

function getJournalRaw(): JournalEntry[] {
  return rawGet<JournalEntry[]>(`${PFX}_journal`, []);
}

export function getJournalEntries(): JournalEntry[] {
  return visible(getJournalRaw());
}

export function addJournalEntry(text: string, date: string): void {
  rawSet(`${PFX}_journal`, withAdded(getJournalRaw(), { text, date }));
}

export function deleteJournalEntry(visibleIndex: number): void {
  rawSet(
    `${PFX}_journal`,
    withSoftDeleted(getJournalRaw(), visibleIndex, (a, b) => a.date === b.date && a.text === b.text)
  );
}

// ---- Desafios: Kaipora 75 e outros desafios pessoais ----
// Progress is never stored here — see challengeStats.ts. Deleting a
// challenge just stops tracking it; the day records it was based on are
// untouched, so nothing about past days is lost.

function getChallengesRaw(): Challenge[] {
  return rawGet<Challenge[]>(`${PFX}_challenges`, []);
}

export function getChallenges(): Challenge[] {
  return visible(getChallengesRaw());
}

export function addChallenge(entry: Omit<Challenge, 'updatedAt' | 'deleted'>): void {
  rawSet(`${PFX}_challenges`, withAdded(getChallengesRaw(), entry));
}

export function deleteChallenge(visibleIndex: number): void {
  rawSet(`${PFX}_challenges`, withSoftDeleted(getChallengesRaw(), visibleIndex, (a, b) => a.id === b.id));
}
