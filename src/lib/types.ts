export type Modality = 'academia' | 'casa';

/**
 * Every append-only, sync-merged list entry (weights, measurements, notes,
 * exercise loads) carries these two fields so deletions survive sync as
 * tombstones instead of being resurrected by a stale copy from another
 * device — see src/lib/tombstoneList.ts and src/lib/merge.ts.
 */
export interface Tombstonable {
  /** epoch ms of the last create/delete of this entry — used to resolve conflicts. */
  updatedAt?: number;
  /** true once soft-deleted; entries are never physically removed pre-sync. */
  deleted?: boolean;
}

export interface WeightEntry extends Tombstonable {
  date: string; // YYYY-MM-DD
  kg: number;
}

export interface MeasurementEntry extends Tombstonable {
  date: string;
  waist?: number; // cintura
  hip?: number; // quadril / glúteos
  thigh?: number; // coxa
  arm?: number; // braço
  extra?: Record<string, number>;
}

export interface NoteEntry extends Tombstonable {
  date: string;
  text: string;
}

export interface DayRecord {
  meals: Record<string, boolean>;
  water: number;
  exercisesDone: Record<string, string[]>; // workoutId -> exercise ids done
  training: { modality: Modality; workoutId: string; done: boolean } | null;
  habits: Record<string, boolean>;
}

export type ThemePreference = 'system' | 'dark' | 'light';

export interface Settings {
  waterGoalMl: number;
  calorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
  goalWeightKg: number;
  heightCm: number;
  notificationsEnabled: boolean;
  reminderTimes: { water: string[]; meals: string[]; training: string[] };
  reducedMotion: boolean;
  theme: ThemePreference;
}

// carbGoal/fatGoal derived from the average carbs/fat across all options of
// each meal slot in src/data/diet.ts, the same way calorieGoal/proteinGoal were.
export const DEFAULT_SETTINGS: Settings = {
  waterGoalMl: 2000,
  calorieGoal: 1615,
  proteinGoal: 135,
  carbGoal: 140,
  fatGoal: 55,
  goalWeightKg: 65,
  heightCm: 171,
  notificationsEnabled: false,
  reminderTimes: { water: ['11:00', '15:00'], meals: ['07:00', '13:00', '19:00'], training: ['18:00'] },
  reducedMotion: false,
  theme: 'system'
};
