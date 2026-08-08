export type Location = 'academia' | 'casa';

export interface Exercise {
  id: string;
  name: string;
  muscles: string[];
  location: Location;
  gluteFocus: boolean;
  desc: string;
  tip: string;
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
