import { describe, it, expect, beforeEach } from 'vitest';
import { TRAINING_WEEK, getWorkoutById, getGluteWorkouts, getTrainingDay } from '../src/data/training';
import { EXERCISES, getExerciseById } from '../src/data/exercises';
import { EXERCISE_DIAGRAMS } from '../src/data/exerciseDiagrams';
import { addCustomExercise } from '../src/lib/storage';

beforeEach(() => {
  localStorage.clear();
});

describe('training plan', () => {
  it('has all seven weekdays, each with both Academia and Casa', () => {
    expect(TRAINING_WEEK).toHaveLength(7);
    for (const day of TRAINING_WEEK) {
      expect(day.academia.location).toBe('academia');
      expect(day.casa.location).toBe('casa');
      expect(day.academia.exercises.length).toBeGreaterThan(0);
      expect(day.casa.exercises.length).toBeGreaterThan(0);
    }
  });

  it('never leaves a home workout thinner than a token substitute for its gym version', () => {
    for (const day of TRAINING_WEEK) {
      expect(day.casa.exercises.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('references only exercises that exist in the exercise library', () => {
    for (const day of TRAINING_WEEK) {
      for (const workout of [day.academia, day.casa]) {
        for (const we of workout.exercises) {
          expect(EXERCISES[we.exerciseId], `missing exercise ${we.exerciseId} in ${workout.id}`).toBeDefined();
        }
      }
    }
  });

  it('includes a dedicated glute program spanning both modalities', () => {
    const gluteWorkouts = getGluteWorkouts();
    expect(gluteWorkouts.length).toBeGreaterThanOrEqual(2);
    expect(gluteWorkouts.some((w) => w.location === 'academia')).toBe(true);
    expect(gluteWorkouts.some((w) => w.location === 'casa')).toBe(true);
    for (const workout of gluteWorkouts) {
      const hasGluteExercise = workout.exercises.some((we) => EXERCISES[we.exerciseId]?.gluteFocus);
      expect(hasGluteExercise).toBe(true);
    }
  });

  it('looks up a workout by id in either modality', () => {
    const monday = getTrainingDay('seg');
    expect(getWorkoutById(monday.academia.id)?.id).toBe(monday.academia.id);
    expect(getWorkoutById(monday.casa.id)?.id).toBe(monday.casa.id);
    expect(getWorkoutById('does-not-exist')).toBeUndefined();
  });
});

describe('exercise library', () => {
  it('has muscle tags and instructions for every exercise', () => {
    for (const ex of Object.values(EXERCISES)) {
      expect(ex.muscles.length).toBeGreaterThan(0);
      expect(ex.desc.length).toBeGreaterThan(10);
      expect(ex.tip.length).toBeGreaterThan(5);
    }
  });

  it('has a meaningful set of glute-focused exercises for both locations', () => {
    const gluteExercises = Object.values(EXERCISES).filter((e) => e.gluteFocus);
    expect(gluteExercises.filter((e) => e.location === 'academia').length).toBeGreaterThanOrEqual(3);
    expect(gluteExercises.filter((e) => e.location === 'casa').length).toBeGreaterThanOrEqual(3);
  });
});

describe('getExerciseById (Treinos personalizáveis)', () => {
  it('finds a built-in exercise by id', () => {
    expect(getExerciseById('flexao')?.name).toBe(EXERCISES.flexao.name);
  });

  it('falls back to a user-added custom exercise when not in the built-in library', () => {
    addCustomExercise({ id: 'cex1', name: 'Elevação unilateral', muscles: ['Panturrilha'], gluteFocus: false, desc: '', tip: '' });
    expect(getExerciseById('cex1')?.name).toBe('Elevação unilateral');
  });

  it('returns undefined for an id that exists nowhere', () => {
    expect(getExerciseById('does-not-exist')).toBeUndefined();
  });
});

describe('exercise diagrams', () => {
  it('every diagram key matches a real exercise in the library', () => {
    for (const exerciseId of Object.keys(EXERCISE_DIAGRAMS)) {
      expect(EXERCISES[exerciseId], `EXERCISE_DIAGRAMS has an entry for unknown exercise "${exerciseId}"`).toBeDefined();
    }
  });

  it('every diagram is well-formed SVG markup', () => {
    for (const [id, svg] of Object.entries(EXERCISE_DIAGRAMS)) {
      expect(svg.startsWith('<svg'), `diagram for ${id} doesn't start with <svg`).toBe(true);
      expect(svg.trim().endsWith('</svg>'), `diagram for ${id} doesn't end with </svg>`).toBe(true);
    }
  });

  it('covers at least the curated glute + calisthenics + high-risk-form categories', () => {
    // Documents intent rather than an exact count, so this doesn't need
    // updating every time a diagram is added — just that coverage isn't
    // accidentally dropped to zero for these priority categories.
    const covered = new Set(Object.keys(EXERCISE_DIAGRAMS));
    expect(covered.has('hip_thrust')).toBe(true); // glutes, academia
    expect(covered.has('glute_bridge')).toBe(true); // glutes, casa
    expect(covered.has('plank') || covered.has('prancha')).toBe(true); // common form fault (sagging hips)
    expect(covered.has('squat') || covered.has('agachamento')).toBe(true); // calisthenics staple
  });
});
