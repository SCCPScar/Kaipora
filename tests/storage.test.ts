import { describe, it, expect, beforeEach } from 'vitest';
import {
  rawGet,
  rawSet,
  getDay,
  toggleMeal,
  getWater,
  setWater,
  toggleExercise,
  getExercisesDone,
  setTrainingDone,
  toggleHabit,
  getWeights,
  addWeight,
  deleteWeight,
  getMeasurements,
  addMeasurement,
  updateMeasurement,
  deleteMeasurement,
  getNotes,
  addNote,
  getSettings,
  saveSettings,
  exportBackup,
  importBackup,
  allKeys,
  getExerciseLoads,
  logExerciseLoad,
  deleteExerciseLoad,
  getCustomFoodOptions,
  addCustomFoodOption,
  deleteCustomFoodOption,
  getHiddenMealOptionIds,
  toggleHiddenMealOption,
  getFoodLog,
  addFoodLogEntry,
  deleteFoodLogEntry,
  getCustomExercises,
  addCustomExercise,
  deleteCustomExercise,
  getCustomWorkouts,
  addCustomWorkout,
  deleteCustomWorkout,
  addExerciseToCustomWorkout,
  removeExerciseFromCustomWorkout,
  getSkills,
  addSkill,
  deleteSkill,
  getSkillSessions,
  logSkillSession,
  deleteSkillSession,
  getRewards,
  addReward,
  deleteReward,
  claimReward,
  getJournalEntries,
  addJournalEntry,
  deleteJournalEntry,
  getChallenges,
  addChallenge,
  deleteChallenge
} from '../src/lib/storage';
import { touchedAt } from '../src/lib/meta';

beforeEach(() => {
  localStorage.clear();
});

describe('raw get/set', () => {
  it('round-trips JSON values', () => {
    rawSet('vp_test', { a: 1 });
    expect(rawGet('vp_test', null)).toEqual({ a: 1 });
  });

  it('returns the fallback when nothing stored', () => {
    expect(rawGet('vp_missing', 'fallback')).toBe('fallback');
  });
});

describe('day records', () => {
  it('toggles a meal option on and off', () => {
    const date = '2026-01-01';
    expect(toggleMeal(date, 'pa1')).toBe(true);
    expect(getDay(date).meals.pa1).toBe(true);
    expect(toggleMeal(date, 'pa1')).toBe(false);
    expect(getDay(date).meals.pa1).toBe(false);
  });

  it('tracks water glasses per day independently', () => {
    setWater('2026-01-01', 3);
    setWater('2026-01-02', 5);
    expect(getWater('2026-01-01')).toBe(3);
    expect(getWater('2026-01-02')).toBe(5);
  });

  it('never lets water go negative', () => {
    setWater('2026-01-01', -5);
    expect(getWater('2026-01-01')).toBe(0);
  });

  it('toggles exercises done for a specific workout', () => {
    const date = '2026-01-01';
    expect(toggleExercise(date, 'seg-academia', 'crucifixo')).toBe(true);
    expect(getExercisesDone(date, 'seg-academia')).toContain('crucifixo');
    expect(toggleExercise(date, 'seg-academia', 'crucifixo')).toBe(false);
    expect(getExercisesDone(date, 'seg-academia')).not.toContain('crucifixo');
  });

  it('records which modality/workout was completed', () => {
    const date = '2026-01-01';
    setTrainingDone(date, 'casa', 'seg-casa', true);
    expect(getDay(date).training).toEqual({ modality: 'casa', workoutId: 'seg-casa', done: true });
    setTrainingDone(date, 'casa', 'seg-casa', false);
    expect(getDay(date).training).toBeNull();
  });

  it('toggles habits per day', () => {
    const date = '2026-01-01';
    expect(toggleHabit(date, 'agua')).toBe(true);
    expect(getDay(date).habits.agua).toBe(true);
  });
});

describe('weights', () => {
  it('adds newest weight first and deletes by (visible) index', () => {
    addWeight(75, '2026-01-01');
    addWeight(74.5, '2026-01-02');
    expect(getWeights().map((w) => w.kg)).toEqual([74.5, 75]);
    deleteWeight(0);
    expect(getWeights().map((w) => w.kg)).toEqual([75]);
  });

  it('soft-deletes (tombstones) instead of physically removing the entry, for sync safety', () => {
    addWeight(75, '2026-01-01');
    deleteWeight(0);
    // Gone from the visible API...
    expect(getWeights()).toHaveLength(0);
    // ...but still present in raw storage as a tombstone, not spliced out —
    // this is what stops a stale remote copy from resurrecting it on sync.
    const raw = rawGet<{ kg: number; deleted?: boolean; updatedAt?: number }[]>('vp_weights', []);
    expect(raw).toHaveLength(1);
    expect(raw[0].deleted).toBe(true);
    expect(raw[0].updatedAt).toBeDefined();
  });
});

describe('measurements & notes', () => {
  it('stores measurement entries, including a custom extra measurement', () => {
    addMeasurement({ date: '2026-01-01', waist: 82, hip: 104, extra: { peito: 92 } });
    expect(getMeasurements()).toHaveLength(1);
    expect(getMeasurements()[0].waist).toBe(82);
    expect(getMeasurements()[0].extra).toEqual({ peito: 92 });
  });

  it('edits a measurement in place (as far as the UI is concerned) without creating a duplicate', () => {
    addMeasurement({ date: '2026-01-01', waist: 82, hip: 104 });
    updateMeasurement(0, { date: '2026-01-01', waist: 80, hip: 103 });
    const list = getMeasurements();
    expect(list).toHaveLength(1); // not two entries
    expect(list[0]).toMatchObject({ waist: 80, hip: 103 });
  });

  it('edit is sync-safe: the old value is tombstoned, not silently mutated', () => {
    addMeasurement({ date: '2026-01-01', waist: 82, hip: 104 });
    updateMeasurement(0, { date: '2026-01-01', waist: 80, hip: 103 });
    const raw = rawGet<{ waist?: number; deleted?: boolean }[]>('vp_measurements', []);
    expect(raw).toHaveLength(2); // old (tombstoned) + new
    expect(raw.find((e) => e.waist === 82)?.deleted).toBe(true);
    expect(raw.find((e) => e.waist === 80)?.deleted).toBeFalsy();
  });

  it('deletes measurement entries', () => {
    addMeasurement({ date: '2026-01-01', waist: 82 });
    deleteMeasurement(0);
    expect(getMeasurements()).toHaveLength(0);
  });

  it('stores notes newest first', () => {
    addNote('primeiro dia', '2026-01-01');
    addNote('segundo dia', '2026-01-02');
    expect(getNotes().map((n) => n.text)).toEqual(['segundo dia', 'primeiro dia']);
  });
});

describe('settings', () => {
  it('falls back to defaults and merges patches', () => {
    expect(getSettings().waterGoalMl).toBe(2000);
    saveSettings({ waterGoalMl: 2500 });
    expect(getSettings().waterGoalMl).toBe(2500);
    expect(getSettings().calorieGoal).toBe(1615); // untouched default preserved
  });
});

describe('backup export/import', () => {
  it('round-trips all app data through export/import', () => {
    addWeight(75, '2026-01-01');
    setWater('2026-01-01', 4);
    const backup = exportBackup();

    localStorage.clear();
    expect(getWeights()).toHaveLength(0);

    importBackup(backup);
    expect(getWeights()).toHaveLength(1);
    expect(getWater('2026-01-01')).toBe(4);
  });

  it('round-trips every category of data the app persists, with no duplication (EXPORT -> CLEAR -> IMPORT)', () => {
    // Peso
    addWeight(75, '2026-01-01');
    addWeight(74.5, '2026-01-08');
    // Medidas, incluindo uma medida personalizada
    addMeasurement({ date: '2026-01-01', waist: 82, hip: 104, extra: { peito: 92 } });
    // Treinos / progressão (dia + carga de exercício)
    setTrainingDone('2026-01-01', 'academia', 'qui-academia', true);
    toggleExercise('2026-01-01', 'qui-academia', 'hip_thrust');
    logExerciseLoad('hip_thrust', { date: '2026-01-01', weightKg: 40, reps: 10 });
    // Refeições
    toggleMeal('2026-01-01', 'pa1');
    // Água
    setWater('2026-01-01', 5);
    // Hábitos
    toggleHabit('2026-01-01', 'agua');
    // Notas
    addNote('Senti-me forte hoje', '2026-01-01');
    // Configurações
    saveSettings({ waterGoalMl: 2500, calorieGoal: 1700 });

    const backup = exportBackup();
    localStorage.clear();

    // Confirm CLEAR actually cleared everything before importing.
    expect(getWeights()).toHaveLength(0);
    expect(getMeasurements()).toHaveLength(0);

    importBackup(backup);

    expect(getWeights()).toHaveLength(2);
    expect(getMeasurements()).toHaveLength(1);
    expect(getMeasurements()[0].extra).toEqual({ peito: 92 });
    const day = getDay('2026-01-01');
    expect(day.training).toEqual({ modality: 'academia', workoutId: 'qui-academia', done: true });
    expect(day.exercisesDone['qui-academia']).toEqual(['hip_thrust']);
    expect(day.meals.pa1).toBe(true);
    expect(day.water).toBe(5);
    expect(day.habits.agua).toBe(true);
    expect(getExerciseLoads('hip_thrust')).toHaveLength(1);
    expect(getExerciseLoads('hip_thrust')[0]).toMatchObject({ weightKg: 40, reps: 10 });
    expect(getNotes()).toHaveLength(1);
    expect(getSettings().waterGoalMl).toBe(2500);
    expect(getSettings().calorieGoal).toBe(1700);

    // Importing the same backup again must not duplicate anything — each
    // key is a full replace, not an append.
    importBackup(backup);
    expect(getWeights()).toHaveLength(2);
    expect(getMeasurements()).toHaveLength(1);
    expect(getNotes()).toHaveLength(1);
  });

  it('rejects a malformed backup instead of silently wiping data', () => {
    addWeight(75, '2026-01-01');
    // @ts-expect-error intentionally malformed input
    expect(() => importBackup({ notABackup: true })).toThrow();
    expect(getWeights()).toHaveLength(1);
  });

  it('never includes internal sync bookkeeping keys in a backup', () => {
    addWeight(75, '2026-01-01'); // this also touches vp_meta and (via meta.ts) leaves a timestamp behind
    const backup = exportBackup();
    expect(Object.keys(backup.data)).not.toContain('vp_meta');
    expect(Object.keys(backup.data)).not.toContain('vp_last_synced_at');
    expect(Object.keys(backup.data)).not.toContain('vp_migrated_from_scar');
  });
});

describe('allKeys', () => {
  it('excludes internal bookkeeping keys from the syncable/exportable key set', () => {
    addWeight(75, '2026-01-01');
    rawSet('vp_last_synced_at', Date.now());
    rawSet('vp_migrated_from_scar', true);
    expect(allKeys()).toContain('vp_weights');
    expect(allKeys()).not.toContain('vp_meta');
    expect(allKeys()).not.toContain('vp_last_synced_at');
    expect(allKeys()).not.toContain('vp_migrated_from_scar');
  });
});

describe('exercise load tracking', () => {
  it('logs and lists loads newest first, and deletes by index', () => {
    logExerciseLoad('hip_thrust', { date: '2026-01-01', weightKg: 40, reps: 12 });
    logExerciseLoad('hip_thrust', { date: '2026-01-08', weightKg: 45, reps: 10 });
    expect(getExerciseLoads('hip_thrust').map((l) => l.weightKg)).toEqual([45, 40]);

    deleteExerciseLoad('hip_thrust', 0);
    expect(getExerciseLoads('hip_thrust').map((l) => l.weightKg)).toEqual([40]);
  });

  it('keeps load history isolated per exercise', () => {
    logExerciseLoad('hip_thrust', { date: '2026-01-01', weightKg: 40 });
    logExerciseLoad('agachamento', { date: '2026-01-01', weightKg: 60 });
    expect(getExerciseLoads('hip_thrust')).toHaveLength(1);
    expect(getExerciseLoads('agachamento')).toHaveLength(1);
  });

  it('supports duration and variation notes for calisthenics exercises without a weight', () => {
    // e.g. plank: no load, just a held duration and a difficulty variation.
    logExerciseLoad('plank', { date: '2026-01-01', seconds: 30, note: 'joelhos' });
    logExerciseLoad('plank', { date: '2026-01-08', seconds: 45, note: 'completa' });
    const loads = getExerciseLoads('plank');
    expect(loads[0]).toMatchObject({ seconds: 45, note: 'completa' });
    expect(loads[1]).toMatchObject({ seconds: 30, note: 'joelhos' });
  });

  it('allows week-over-week comparison — latest vs previous entry are both retrievable in order', () => {
    logExerciseLoad('agachamento', { date: '2026-01-01', reps: 15 });
    logExerciseLoad('agachamento', { date: '2026-01-08', reps: 18 });
    const [latest, previous] = getExerciseLoads('agachamento');
    expect(latest.reps).toBe(18);
    expect(previous.reps).toBe(15);
    expect((latest.reps ?? 0) - (previous.reps ?? 0)).toBe(3); // "semana passada 15, hoje 18"
  });
});

describe('diet: custom food options (Minha Dieta editável)', () => {
  it('adds a custom option scoped to a meal and lists it back', () => {
    addCustomFoodOption({ id: 'cf1', mealId: 'pa', label: 'Barrita proteica', desc: '1 barrita', kcal: 150, protein: 15, carbs: 10, fat: 5 });
    expect(getCustomFoodOptions('pa')).toHaveLength(1);
    expect(getCustomFoodOptions('pa')[0].label).toBe('Barrita proteica');
    expect(getCustomFoodOptions('lm')).toHaveLength(0);
  });

  it('getCustomFoodOptions with no mealId returns every meal\'s custom options', () => {
    addCustomFoodOption({ id: 'cf1', mealId: 'pa', label: 'A', desc: '', kcal: 100, protein: 5, carbs: 5, fat: 5 });
    addCustomFoodOption({ id: 'cf2', mealId: 'lm', label: 'B', desc: '', kcal: 120, protein: 6, carbs: 6, fat: 6 });
    expect(getCustomFoodOptions()).toHaveLength(2);
  });

  it('soft-deletes a custom option by its index in the full (unfiltered) visible list', () => {
    addCustomFoodOption({ id: 'cf1', mealId: 'pa', label: 'A', desc: '', kcal: 100, protein: 5, carbs: 5, fat: 5 });
    deleteCustomFoodOption(0);
    expect(getCustomFoodOptions('pa')).toHaveLength(0);
    const raw = rawGet<{ deleted?: boolean }[]>('vp_diet_custom_options', []);
    expect(raw).toHaveLength(1);
    expect(raw[0].deleted).toBe(true); // tombstoned, not physically removed
  });
});

describe('diet: hidden default meal options', () => {
  it('toggles a built-in option hidden and back to visible', () => {
    expect(toggleHiddenMealOption('pa1')).toBe(true);
    expect(getHiddenMealOptionIds()).toContain('pa1');
    expect(toggleHiddenMealOption('pa1')).toBe(false);
    expect(getHiddenMealOptionIds()).not.toContain('pa1');
  });
});

describe('diet: Diário Livre (free food log)', () => {
  it('adds a free-form entry and lists it back for its date', () => {
    addFoodLogEntry({ date: '2026-01-01', label: 'Bolo de aniversário', kcal: 300, protein: 4, carbs: 40, fat: 12 });
    expect(getFoodLog('2026-01-01')).toHaveLength(1);
    expect(getFoodLog('2026-01-02')).toHaveLength(0);
    expect(getFoodLog()).toHaveLength(1); // no date filter -> everything
  });

  it('adds newest entry first, matching the tombstoned-list convention', () => {
    addFoodLogEntry({ date: '2026-01-01', label: 'Primeiro', kcal: 100, protein: 1, carbs: 1, fat: 1 });
    addFoodLogEntry({ date: '2026-01-01', label: 'Segundo', kcal: 200, protein: 2, carbs: 2, fat: 2 });
    expect(getFoodLog('2026-01-01').map((e) => e.label)).toEqual(['Segundo', 'Primeiro']);
  });

  it('soft-deletes a food log entry instead of physically removing it', () => {
    addFoodLogEntry({ date: '2026-01-01', label: 'Snack', kcal: 100, protein: 1, carbs: 1, fat: 1 });
    deleteFoodLogEntry(0);
    expect(getFoodLog('2026-01-01')).toHaveLength(0);
    const raw = rawGet<{ deleted?: boolean }[]>('vp_food_log', []);
    expect(raw).toHaveLength(1);
    expect(raw[0].deleted).toBe(true);
  });
});

describe('training: custom exercises', () => {
  it('adds a custom exercise and lists it back', () => {
    addCustomExercise({ id: 'cex1', name: 'Elevação unilateral', muscles: ['Panturrilha'], gluteFocus: false, desc: '', tip: '' });
    expect(getCustomExercises()).toHaveLength(1);
    expect(getCustomExercises()[0].name).toBe('Elevação unilateral');
  });

  it('soft-deletes a custom exercise instead of physically removing it', () => {
    addCustomExercise({ id: 'cex1', name: 'A', muscles: [], gluteFocus: false, desc: '', tip: '' });
    deleteCustomExercise(0);
    expect(getCustomExercises()).toHaveLength(0);
    const raw = rawGet<{ deleted?: boolean }[]>('vp_custom_exercises', []);
    expect(raw).toHaveLength(1);
    expect(raw[0].deleted).toBe(true);
  });
});

describe('training: custom workouts (Treinos personalizáveis)', () => {
  it('creates a custom workout with a free-text category, starting with no exercises', () => {
    addCustomWorkout({ id: 'cw1', title: 'Treino de Calistenia A', category: 'Calistenia', focus: 'Corpo inteiro', exercises: [] });
    const workouts = getCustomWorkouts();
    expect(workouts).toHaveLength(1);
    expect(workouts[0]).toMatchObject({ title: 'Treino de Calistenia A', category: 'Calistenia', exercises: [] });
  });

  it('adds an exercise to a custom workout without touching other workouts', () => {
    addCustomWorkout({ id: 'cw1', title: 'A', category: 'Casa', focus: '', exercises: [] });
    addCustomWorkout({ id: 'cw2', title: 'B', category: 'Academia', focus: '', exercises: [] });
    addExerciseToCustomWorkout('cw1', { exerciseId: 'flexao', sets: 4, reps: '15', restSeconds: 60 });
    const [a, b] = getCustomWorkouts().sort((x, y) => x.id.localeCompare(y.id));
    expect(a.exercises).toHaveLength(1);
    expect(a.exercises[0]).toMatchObject({ exerciseId: 'flexao', sets: 4 });
    expect(b.exercises).toHaveLength(0);
  });

  it('editing a workout (add exercise) is sync-safe: old version tombstoned, new one added, same id', () => {
    addCustomWorkout({ id: 'cw1', title: 'A', category: 'Casa', focus: '', exercises: [] });
    addExerciseToCustomWorkout('cw1', { exerciseId: 'flexao', sets: 3, reps: '12', restSeconds: 45 });
    const raw = rawGet<{ id: string; deleted?: boolean }[]>('vp_custom_workouts', []);
    expect(raw).toHaveLength(2); // old (tombstoned) + edited
    expect(raw.filter((w) => w.id === 'cw1' && w.deleted)).toHaveLength(1);
    expect(raw.filter((w) => w.id === 'cw1' && !w.deleted)).toHaveLength(1);
    expect(getCustomWorkouts()).toHaveLength(1); // visible getter still shows exactly one
  });

  it('removes a single exercise from a workout by index, keeping the rest', () => {
    addCustomWorkout({ id: 'cw1', title: 'A', category: 'Casa', focus: '', exercises: [] });
    addExerciseToCustomWorkout('cw1', { exerciseId: 'flexao', sets: 3, reps: '12', restSeconds: 45 });
    addExerciseToCustomWorkout('cw1', { exerciseId: 'plank', sets: 3, reps: '30s', restSeconds: 30 });
    removeExerciseFromCustomWorkout('cw1', 0);
    const workout = getCustomWorkouts().find((w) => w.id === 'cw1')!;
    expect(workout.exercises).toHaveLength(1);
    expect(workout.exercises[0].exerciseId).toBe('plank');
  });

  it('soft-deletes a whole custom workout', () => {
    addCustomWorkout({ id: 'cw1', title: 'A', category: 'Casa', focus: '', exercises: [] });
    deleteCustomWorkout(0);
    expect(getCustomWorkouts()).toHaveLength(0);
  });
});

describe('habilidades: skills', () => {
  it('adds a skill and lists it back', () => {
    addSkill({ id: 'sk1', name: 'Piano' });
    expect(getSkills()).toHaveLength(1);
    expect(getSkills()[0].name).toBe('Piano');
  });

  it('soft-deletes a skill without touching its logged sessions', () => {
    addSkill({ id: 'sk1', name: 'Piano' });
    logSkillSession({ skillId: 'sk1', date: '2026-01-01', minutes: 30 });
    deleteSkill(0);
    expect(getSkills()).toHaveLength(0); // no longer an active skill...
    expect(getSkillSessions('sk1')).toHaveLength(1); // ...but its history is untouched
  });
});

describe('habilidades: skill sessions', () => {
  it('logs a session and filters by skillId', () => {
    logSkillSession({ skillId: 'sk1', date: '2026-01-01', minutes: 30 });
    logSkillSession({ skillId: 'sk2', date: '2026-01-01', minutes: 20 });
    expect(getSkillSessions('sk1')).toHaveLength(1);
    expect(getSkillSessions('sk2')).toHaveLength(1);
    expect(getSkillSessions()).toHaveLength(2); // no filter -> everything
  });

  it('soft-deletes a session instead of physically removing it', () => {
    logSkillSession({ skillId: 'sk1', date: '2026-01-01', minutes: 30 });
    deleteSkillSession(0);
    expect(getSkillSessions('sk1')).toHaveLength(0);
    const raw = rawGet<{ deleted?: boolean }[]>('vp_skill_sessions', []);
    expect(raw).toHaveLength(1);
    expect(raw[0].deleted).toBe(true);
  });
});

describe('habilidades: recompensas', () => {
  it('creates a reward that starts unclaimed', () => {
    addReward({ id: 'rw1', title: 'Ver um filme', targetMinutes: 300 });
    expect(getRewards()).toHaveLength(1);
    expect(getRewards()[0]).toMatchObject({ title: 'Ver um filme', targetMinutes: 300, claimed: false });
  });

  it('claiming a reward is an edit (tombstone old + add claimed), matched by stable id', () => {
    addReward({ id: 'rw1', title: 'Ver um filme', targetMinutes: 300 });
    claimReward('rw1', '2026-01-05');
    const rewards = getRewards();
    expect(rewards).toHaveLength(1); // still exactly one visible reward, not duplicated
    expect(rewards[0]).toMatchObject({ id: 'rw1', claimed: true, claimedAt: '2026-01-05' });

    const raw = rawGet<{ id: string; deleted?: boolean }[]>('vp_rewards', []);
    expect(raw).toHaveLength(2); // old (tombstoned) + claimed version
    expect(raw.filter((r) => r.id === 'rw1' && r.deleted)).toHaveLength(1);
  });

  it('soft-deletes a reward', () => {
    addReward({ id: 'rw1', title: 'X', targetMinutes: 100 });
    deleteReward(0);
    expect(getRewards()).toHaveLength(0);
  });
});

describe('diário livre (distinct from Progresso notes)', () => {
  it('adds an entry newest first', () => {
    addJournalEntry('primeiro dia', '2026-01-01');
    addJournalEntry('segundo dia', '2026-01-02');
    expect(getJournalEntries().map((e) => e.text)).toEqual(['segundo dia', 'primeiro dia']);
  });

  it('soft-deletes instead of physically removing', () => {
    addJournalEntry('nota', '2026-01-01');
    deleteJournalEntry(0);
    expect(getJournalEntries()).toHaveLength(0);
    const raw = rawGet<{ deleted?: boolean }[]>('vp_journal', []);
    expect(raw).toHaveLength(1);
    expect(raw[0].deleted).toBe(true);
  });

  it('never mixes with Progresso\'s vp_notes key', () => {
    addJournalEntry('diário', '2026-01-01');
    addNote('nota de progresso', '2026-01-01');
    expect(getJournalEntries()).toHaveLength(1);
    expect(getNotes()).toHaveLength(1);
    expect(getJournalEntries()[0].text).toBe('diário');
    expect(getNotes()[0].text).toBe('nota de progresso');
  });
});

describe('desafios: Kaipora 75 e outros desafios pessoais', () => {
  it('creates a challenge and lists it back', () => {
    addChallenge({ id: 'ch1', title: 'Kaipora 75', totalDays: 75, startDate: '2026-01-01' });
    expect(getChallenges()).toHaveLength(1);
    expect(getChallenges()[0]).toMatchObject({ title: 'Kaipora 75', totalDays: 75 });
  });

  it('soft-deletes a challenge without touching the day records it was based on', () => {
    addChallenge({ id: 'ch1', title: 'Kaipora 75', totalDays: 75, startDate: '2026-01-01' });
    setWater('2026-01-01', 8);
    deleteChallenge(0);
    expect(getChallenges()).toHaveLength(0);
    expect(getWater('2026-01-01')).toBe(8); // untouched
  });
});

describe('change tracking (meta)', () => {
  it('records a touched timestamp on every write, used by the sync layer', () => {
    const before = Date.now();
    addWeight(75, '2026-01-01');
    const ts = touchedAt('vp_weights');
    expect(ts).toBeDefined();
    expect(ts as number).toBeGreaterThanOrEqual(before);
  });
});
