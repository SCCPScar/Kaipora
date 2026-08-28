import type { Tombstonable } from '../lib/types';

export type Location = 'academia' | 'casa';

/** Fields every exercise card / info modal needs, whether it's a built-in
 * Exercise or a user-defined CustomExercise. */
export interface ExerciseLike {
  id: string;
  name: string;
  muscles: string[];
  gluteFocus: boolean;
  desc: string;
  tip: string;
}

export interface Exercise extends ExerciseLike {
  location: Location;
}

/** A user-added exercise not in the built-in library — reusable across any
 * CustomWorkout once created. Same shape as a built-in Exercise (minus
 * location, which only applies to the fixed plan) so it works everywhere an
 * ExerciseLike is expected, e.g. the info modal — fields left blank by the
 * user (a quick "personal trainer told me to do X" entry) are just empty. */
export interface CustomExercise extends ExerciseLike, Tombstonable {}

/** A user-created workout — reusable across any day, independent of the
 * built-in weekly plan. `category` is free text (e.g. "Academia", "Casa",
 * "Calistenia", "Personal Trainer") rather than the fixed Location union, so
 * it isn't limited to the two built-in modalities. */
export interface CustomWorkout extends Tombstonable {
  id: string;
  title: string;
  focus: string;
  category: string;
  exercises: WorkoutExercise[];
}

export interface WorkoutExercise {
  exerciseId: string;
  sets: number;
  reps: string; // e.g. "10-12" or "30s" or "até à falha"
  restSeconds: number;
  note?: string;
}

export interface Workout {
  id: string;
  title: string;
  focus: string;
  location: Location;
  /** e.g. 'gluteos' to mark workouts that belong to the dedicated glute program */
  tags?: string[];
  exercises: WorkoutExercise[];
}

/** One weekday's training: always has both an Academia and a Casa option. */
export interface TrainingDay {
  weekday: 'seg' | 'ter' | 'qua' | 'qui' | 'sex' | 'sab' | 'dom';
  label: string;
  academia: Workout;
  casa: Workout;
}
