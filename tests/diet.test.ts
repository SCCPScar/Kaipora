import { describe, it, expect, beforeEach } from 'vitest';
import { MEALS, getMeal, getMealOption, substitutesFor, dailyTotalsForMeals, allMealOptions, visibleMealOptions } from '../src/data/diet';
import { addCustomFoodOption, deleteCustomFoodOption, toggleHiddenMealOption } from '../src/lib/storage';

beforeEach(() => {
  localStorage.clear();
});

describe('diet data', () => {
  it('has six meal slots covering the whole day', () => {
    expect(MEALS).toHaveLength(6);
    expect(MEALS.map((m) => m.id)).toEqual(['pa', 'lm', 'almoco', 'lt', 'jantar', 'ceia']);
  });

  it('gives every meal several substitutable options with unique ids', () => {
    for (const meal of MEALS) {
      expect(meal.options.length).toBeGreaterThanOrEqual(4);
      const ids = meal.options.map((o) => o.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('keeps every option within a realistic band of its meal target (substitution equivalence)', () => {
    for (const meal of MEALS) {
      for (const option of meal.options) {
        expect(option.kcal).toBeGreaterThan(meal.targetKcal * 0.45);
        expect(option.kcal).toBeLessThan(meal.targetKcal * 1.5);
      }
    }
  });

  it('keeps kcal internally coherent with its own protein/carbs/fat (4/4/9 kcal-per-gram)', () => {
    // Catches data-entry mistakes where the listed kcal doesn't match what
    // the listed macros actually add up to — a >15% mismatch would mean the
    // numbers shown to the user contradict each other.
    for (const meal of MEALS) {
      for (const option of meal.options) {
        const computed = option.protein * 4 + option.carbs * 4 + option.fat * 9;
        const diff = Math.abs(computed - option.kcal) / option.kcal;
        expect(diff, `${meal.id}/${option.id}: kcal=${option.kcal} but macros imply ~${computed}`).toBeLessThanOrEqual(0.15);
      }
    }
  });

  it('never includes red meat, matching the existing dietary restriction', () => {
    const redMeatWords = ['vaca', 'bovina', 'porco', 'novilho', 'borrego', 'bife'];
    for (const meal of MEALS) {
      for (const option of meal.options) {
        const text = (option.label + ' ' + option.desc).toLowerCase();
        for (const word of redMeatWords) {
          expect(text).not.toContain(word);
        }
      }
    }
  });

  it('looks up meals and options by id', () => {
    expect(getMeal('almoco')?.name).toBe('Almoço');
    expect(getMealOption('pa', 'pa1')?.label).toContain('Omelete');
    expect(getMealOption('pa', 'does-not-exist')).toBeUndefined();
  });

  it('substitutesFor excludes the option itself', () => {
    const subs = substitutesFor('pa', 'pa1');
    expect(subs.some((o) => o.id === 'pa1')).toBe(false);
    expect(subs.length).toBe((getMeal('pa')?.options.length ?? 0) - 1);
  });

  it('dailyTotalsForMeals sums only the checked options, across every meal slot', () => {
    const pa1 = getMealOption('pa', 'pa1')!;
    const lm2 = getMealOption('lm', 'lm2')!;
    const totals = dailyTotalsForMeals({ pa1: true, lm2: true, pa2: false });
    expect(totals.kcal).toBe(pa1.kcal + lm2.kcal);
    expect(totals.protein).toBe(pa1.protein + lm2.protein);
  });

  it('dailyTotalsForMeals returns all zeros when nothing is checked', () => {
    expect(dailyTotalsForMeals({})).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  });
});

describe('diet: A Minha Dieta (editable overlay on the built-in plan)', () => {
  it('allMealOptions includes a user-added custom option alongside the built-ins', () => {
    addCustomFoodOption({ id: 'cf1', mealId: 'pa', label: 'Barrita proteica', desc: '', kcal: 150, protein: 15, carbs: 10, fat: 5 });
    const options = allMealOptions('pa');
    expect(options.some((o) => o.id === 'cf1')).toBe(true);
    expect(options.length).toBe((getMeal('pa')?.options.length ?? 0) + 1);
  });

  it('visibleMealOptions omits a hidden built-in option but keeps counting it in totals', () => {
    toggleHiddenMealOption('pa1');
    expect(visibleMealOptions('pa').some((o) => o.id === 'pa1')).toBe(false);
    // allMealOptions (used for totals) never drops it just because it's hidden —
    // hiding only affects what's offered for future selection, not history.
    expect(allMealOptions('pa').some((o) => o.id === 'pa1')).toBe(true);
    const pa1 = getMealOption('pa', 'pa1')!;
    expect(dailyTotalsForMeals({ pa1: true }).kcal).toBe(pa1.kcal);
  });

  it('a checked custom option counts towards dailyTotalsForMeals', () => {
    addCustomFoodOption({ id: 'cf1', mealId: 'pa', label: 'Barrita proteica', desc: '', kcal: 150, protein: 15, carbs: 10, fat: 5 });
    const pa1 = getMealOption('pa', 'pa1')!;
    const totals = dailyTotalsForMeals({ pa1: true, cf1: true });
    expect(totals.kcal).toBe(pa1.kcal + 150);
    expect(totals.protein).toBe(pa1.protein + 15);
  });

  it('deleting a custom option removes it from allMealOptions/visibleMealOptions', () => {
    addCustomFoodOption({ id: 'cf1', mealId: 'pa', label: 'Barrita proteica', desc: '', kcal: 150, protein: 15, carbs: 10, fat: 5 });
    expect(allMealOptions('pa').some((o) => o.id === 'cf1')).toBe(true);
    deleteCustomFoodOption(0); // only custom option seeded -> index 0 in the full visible list
    expect(allMealOptions('pa').some((o) => o.id === 'cf1')).toBe(false);
    expect(visibleMealOptions('pa').some((o) => o.id === 'cf1')).toBe(false);
  });
});
