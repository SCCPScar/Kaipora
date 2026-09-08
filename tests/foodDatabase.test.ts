import { describe, it, expect } from 'vitest';
import { FOOD_DATABASE, searchFoodDatabase, getFoodDatabaseItem, scaleFood } from '../src/data/foodDatabase';

describe('food database (Contador de Calorias)', () => {
  it('has a non-trivial set of common foods with unique ids', () => {
    expect(FOOD_DATABASE.length).toBeGreaterThan(20);
    const ids = FOOD_DATABASE.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('embeds the TACO table (500+ whole foods) offline, on top of the curated list', () => {
    expect(FOOD_DATABASE.length).toBeGreaterThan(500);
    const taco = getFoodDatabaseItem('taco_1');
    expect(taco?.label).toContain('Arroz');
    expect(taco?.kcal).toBeGreaterThan(0);
  });

  it('caps search results so a broad TACO-heavy query does not flood the list', () => {
    const results = searchFoodDatabase('a'); // matches virtually everything
    expect(results.length).toBeLessThanOrEqual(20);
  });

  it('covers real-world takeaway/fast-food and traditional Portuguese dishes, not just the curated meal plan', () => {
    // The user explicitly asked for these so Diário Livre can log what she
    // actually ate, independent of the "sem carne vermelha" meal plan.
    for (const id of ['fd_frango_frito', 'fd_nuggets', 'fd_feijoada']) {
      expect(getFoodDatabaseItem(id), `missing expected item ${id}`).toBeDefined();
    }
  });

  it('never includes red meat, matching the app-wide dietary restriction', () => {
    // Whole-word matches only: a substring check would also flag "Leite,
    // de vaca" (cow's milk) or "Alfavaca" (an herb) as red meat, which
    // they obviously aren't — see the TACO import filter in
    // src/data/foodDatabase.ts for the full exclusion list this mirrors.
    const redMeatWords = ['bovina', 'bovino', 'porco', 'novilho', 'borrego', 'bife', 'cordeiro', 'vitela', 'vaca atolada'];
    for (const item of FOOD_DATABASE) {
      const text = item.label.toLowerCase();
      for (const word of redMeatWords) {
        expect(text).not.toMatch(new RegExp(`\\b${word}\\b`, 'i'));
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

  it('searches accent-insensitively, so a phone keyboard without accents still finds matches', () => {
    expect(searchFoodDatabase('feijao').some((f) => f.id === 'fd_feijao_preto')).toBe(true);
    expect(searchFoodDatabase('ananas').some((f) => f.id === 'fd_ananas')).toBe(true);
    expect(searchFoodDatabase('pao').some((f) => f.id === 'fd_pao_forma')).toBe(true);
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
