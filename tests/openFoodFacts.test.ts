import { describe, it, expect, vi, afterEach } from 'vitest';
import { searchOpenFoodFacts } from '../src/lib/openFoodFacts';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('searchOpenFoodFacts', () => {
  it('returns an empty list for an empty query without calling fetch', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    expect(await searchOpenFoodFacts('   ')).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('maps a successful response into scaled-per-100g items', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          products: [
            {
              code: '123',
              product_name: 'Iogurte Grego',
              brands: 'MarcaX',
              nutriments: { 'energy-kcal_100g': 59.4, proteins_100g: 10.2, carbohydrates_100g: 3.6, fat_100g: 0.4 }
            }
          ]
        })
      })
    );
    const results = await searchOpenFoodFacts('iogurte');
    expect(results).toEqual([{ id: 'off_123', label: 'Iogurte Grego (MarcaX)', kcal: 59, protein: 10.2, carbs: 3.6, fat: 0.4 }]);
  });

  it('skips products with no name or no kcal value', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          products: [
            { code: '1', nutriments: { 'energy-kcal_100g': 100 } }, // no product_name
            { code: '2', product_name: 'Sem calorias', nutriments: {} } // no kcal
          ]
        })
      })
    );
    expect(await searchOpenFoodFacts('x')).toEqual([]);
  });

  it('never breaks the app when there is no connection — resolves to [] instead of throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    );
    await expect(searchOpenFoodFacts('frango')).resolves.toEqual([]);
  });

  it('treats a non-ok HTTP response as no results, not an error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }));
    expect(await searchOpenFoodFacts('x')).toEqual([]);
  });

  it('falls back to a product without a brand using the plain product name', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          products: [{ code: '9', product_name: 'Arroz', nutriments: { 'energy-kcal_100g': 130 } }]
        })
      })
    );
    const results = await searchOpenFoodFacts('arroz');
    expect(results[0].label).toBe('Arroz');
  });
});
