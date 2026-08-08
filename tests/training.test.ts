import { describe, it, expect } from 'vitest';
import { TRAINING_WEEK, getWorkoutById, getGluteWorkouts, getTrainingDay } from '../src/data/training';
import { EXERCISES } from '../src/data/exercises';

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
