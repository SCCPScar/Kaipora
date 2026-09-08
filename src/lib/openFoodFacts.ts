/**
 * Live search against Open Food Facts, for branded/packaged products the
 * local food database (src/data/foodDatabase.ts) can't realistically cover
 * — a specific yogurt or cereal brand from the supermarket, say. This is a
 * pure network add-on: Kaipora stays offline-first, so any failure here
 * (no connection, the API being down, a slow response) resolves to an
 * empty list instead of throwing — the Diário Livre's local search and
 * manual entry always keep working regardless.
 */
export interface OpenFoodFactsItem {
  id: string;
  label: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

const SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';
const TIMEOUT_MS = 6000;

interface RawProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  nutriments?: Record<string, unknown>;
}

function toNumber(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
}

function mapProduct(p: RawProduct): OpenFoodFactsItem | null {
  const n = p.nutriments ?? {};
  const kcal = toNumber(n['energy-kcal_100g']) ?? toNumber(n['energy-kcal']);
  if (kcal === undefined || !p.product_name) return null;
  return {
    id: `off_${p.code ?? p.product_name}`,
    label: p.brands ? `${p.product_name} (${p.brands})` : p.product_name,
    kcal: Math.round(kcal),
    protein: Math.round((toNumber(n.proteins_100g) ?? 0) * 10) / 10,
    carbs: Math.round((toNumber(n.carbohydrates_100g) ?? 0) * 10) / 10,
    fat: Math.round((toNumber(n.fat_100g) ?? 0) * 10) / 10
  };
}

export async function searchOpenFoodFacts(query: string): Promise<OpenFoodFactsItem[]> {
  const q = query.trim();
  if (!q) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const url = `${SEARCH_URL}?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=8`;
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return [];
    const data = (await res.json()) as { products?: RawProduct[] };
    const products = Array.isArray(data.products) ? data.products : [];
    const mapped: OpenFoodFactsItem[] = [];
    for (const p of products) {
      const item = mapProduct(p);
      if (item) mapped.push(item);
    }
    return mapped;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
