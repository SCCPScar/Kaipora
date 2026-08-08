export type Modality = 'academia' | 'casa';

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  kg: number;
}

export interface MeasurementEntry {
  date: string;
  waist?: number; // cintura
  hip?: number; // quadril / glúteos
  thigh?: number; // coxa
  arm?: number; // braço
  extra?: Record<string, number>;
}

export interface NoteEntry {
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

export interface Settings {
  waterGoalMl: number;
  calorieGoal: number;
  proteinGoal: number;
  goalWeightKg: number;
  heightCm: number;
  notificationsEnabled: boolean;
  reminderTimes: { water: string[]; meals: string[]; training: string[] };
  reducedMotion: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  waterGoalMl: 2000,
  calorieGoal: 1615,
  proteinGoal: 135,
  goalWeightKg: 65,
  heightCm: 171,
  notificationsEnabled: false,
  reminderTimes: { water: ['11:00', '15:00'], meals: ['07:00', '13:00', '19:00'], training: ['18:00'] },
  reducedMotion: false
};
