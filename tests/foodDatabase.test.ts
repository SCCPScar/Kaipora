import { describe, it, expect } from 'vitest';
import { FOOD_DATABASE, searchFoodDatabase, getFoodDatabaseItem, scaleFood } from '../src/data/foodDatabase';

describe('food database (Contador de Calorias)', () => {
  it('has a non-trivial set of common foods with unique ids', () => {
    expect(FOOD_DATABASE.length).toBeGreaterThan(20);
    const ids = FOOD_DATABASE.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('never includes red meat, matching the app-wide dietary restriction', () => {
    const redMeatWords = ['vaca', 'bovina', 'porco', 'novilho', 'borrego', 'bife'];
    for (const item of FOOD_DATABASE) {
      const text = item.label.toLowerCase();
      for (const word of redMeatWords) {
        expect(text).not.toContain(word);
      }
    }
  });

  it('searches case-insensitively by substring', () => {
    expect(searchFoodDatabase('FRANGO').some((f) => f.id === 'fd_frango_peito')).toBe(true);
    expect(searchFoodDatabase('frang').length).toBeGreaterThan(0);
  });

  it('returns nothing for an empty query rather than the whole database', () => {
    expect(searchFoodDatabase('')).toEqual([]);
    expect(searchFoodDatabase('   ')).toEqual([]);
  });

  it('looks up a single item by id', () => {
    expect(getFoodDatabaseItem('fd_banana')?.label).toBe('Banana');
    expect(getFoodDatabaseItem('does-not-exist')).toBeUndefined();
  });

  it('scaleFood scales per-100g macros linearly to the requested grams', () => {
    const banana = getFoodDatabaseItem('fd_banana')!;
    const scaled = scaleFood(banana, 200);
    expect(scaled.kcal).toBe(banana.kcal * 2);
    expect(scaled.protein).toBeCloseTo(banana.protein * 2, 1);
  });

  it('scaleFood handles a small portion without dropping to zero incorrectly', () => {
    const oil = getFoodDatabaseItem('fd_azeite')!; // 884 kcal/100g
    const scaled = scaleFood(oil, 5); // a teaspoon-ish amount
    expect(scaled.kcal).toBe(Math.round(884 * 0.05));
  });
});
