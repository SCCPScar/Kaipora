/** The built-in plan always has exactly these two variants per day. */
export type BuiltInModality = 'academia' | 'casa';

/** 'academia' | 'casa' for the built-in plan, or any free-text category the
 * user names for a custom workout (e.g. 'Calistenia', 'Personal Trainer'). */
export type Modality = string;
export type Weekday = 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';

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

/** A free-form Diário entry — distinct from NoteEntry (Progresso's
 * body/training notes): this is a general personal journal, not scoped to
 * fitness. Same shape, separate storage key, so the two never mix. */
export interface JournalEntry extends Tombstonable {
  date: string;
  text: string;
}

/** A single free-text intention set for a given week, keyed by the ISO date
 * of that week's start (Sunday) — see startOfWeek in dates.ts. One entry
 * per week: setting a new one for the same week replaces the old text. */
export interface WeeklyIntention extends Tombstonable {
  weekKey: string;
  text: string;
}

export interface DayRecord {
  meals: Record<string, boolean>;
  water: number;
  exercisesDone: Record<string, string[]>; // workoutId -> exercise ids done
  training: { modality: Modality; workoutId: string; done: boolean } | null;
  habits: Record<string, boolean>;
  /** ids of Rotina items (fixed commitments / flexible activities) marked done today. */
  routineDone: string[];
}

export type ThemePreference = 'system' | 'dark' | 'light';

/** Supported UI languages — see src/i18n/index.ts. Kept here (not imported
 * from i18n) so lib/types.ts has no dependency on the i18n module. */
export type Locale = 'pt-BR' | 'pt-PT' | 'es' | 'en' | 'fr' | 'zh';

export interface Settings {
  /** Shown in greetings (Hoje, Progresso) instead of a hardcoded name — empty
   * means no name is inserted at all. */
  userName: string;
  waterGoalMl: number;
  calorieGoal: number;
  proteinGoal: number;
  carbGoal: number;
  fatGoal: number;
  goalWeightKg: number;
  heightCm: number;
  notificationsEnabled: boolean;
  /** `water` is kept only for backward-compat with existing saved settings —
   * the water reminder now fires based on how much is still missing to the
   * goal, not a fixed schedule (see notifications.ts). */
  reminderTimes: { water: string[]; meals: string[]; training: string[] };
  reducedMotion: boolean;
  theme: ThemePreference;
  /** Day boundaries for Rotina's scheduling window (HH:MM, 24h). */
  wakeTime: string;
  sleepTime: string;
  /** Recompensas (Habilidades) is opt-in and fully hideable — off by default
   * so it never intrudes until the user deliberately turns it on. */
  rewardsEnabled: boolean;
  /** UI language — see src/i18n. Defaults to pt-BR (also the fallback used
   * for any key missing from another locale). */
  language: Locale;
  /** When true, Treino/Alimentação show the built-in example training week
   * (TRAINING_WEEK) and diet plan (MEALS) alongside the user's own custom
   * workouts/food log, exactly as the app has always behaved. When false
   * (the default for brand-new installs), the built-in plan is hidden
   * entirely and those tabs start blank — just the user's own custom
   * workouts and the free-form food diary — so a new tester isn't shown
   * Scarllett's personal, medically-specific plan as if it were generic
   * starter content. See src/lib/migrate.ts for how existing installs are
   * switched to `true` so nothing changes for them. */
  useDefaultPlan: boolean;
}

// carbGoal/fatGoal derived from the average carbs/fat across all options of
// each meal slot in src/data/diet.ts, the same way calorieGoal/proteinGoal were.
export const DEFAULT_SETTINGS: Settings = {
  userName: '',
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
  theme: 'system',
  wakeTime: '07:00',
  sleepTime: '23:00',
  rewardsEnabled: false,
  language: 'pt-BR',
  useDefaultPlan: false
};
