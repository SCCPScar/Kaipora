import { describe, it, expect } from 'vitest';
import { MEALS, getMeal, getMealOption, substitutesFor } from '../src/data/diet';

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
});
