// Base de dados local de alimentos comuns para o Contador de Calorias —
// valores de referência por 100g, na mesma linha dos macros já usados no
// resto do plano alimentar (src/data/diet.ts): estimativas de composição
// nutricional padrão para alimentos genéricos, não uma tabela nutricional
// certificada nem dados de um produto específico. Fica local e estática de
// propósito para funcionar sem ligação à internet.
export interface FoodDatabaseItem {
  id: string;
  label: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const FOOD_DATABASE: FoodDatabaseItem[] = [
  { id: 'fd_arroz_branco', label: 'Arroz branco cozido', kcal: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { id: 'fd_arroz_integral', label: 'Arroz integral cozido', kcal: 123, protein: 2.7, carbs: 26, fat: 1.0 },
  { id: 'fd_massa', label: 'Massa cozida', kcal: 131, protein: 5.0, carbs: 25, fat: 1.1 },
  { id: 'fd_batata', label: 'Batata cozida', kcal: 87, protein: 1.9, carbs: 20, fat: 0.1 },
  { id: 'fd_batata_doce', label: 'Batata-doce cozida', kcal: 90, protein: 2.0, carbs: 21, fat: 0.1 },
  { id: 'fd_pao_misto', label: 'Pão de mistura', kcal: 265, protein: 9.0, carbs: 49, fat: 3.0 },
  { id: 'fd_pao_integral', label: 'Pão integral', kcal: 247, protein: 10, carbs: 41, fat: 3.4 },
  { id: 'fd_aveia', label: 'Aveia (flocos, crua)', kcal: 375, protein: 13, carbs: 60, fat: 7.0 },
  { id: 'fd_frango_peito', label: 'Peito de frango grelhado', kcal: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: 'fd_peru_fumado', label: 'Peru fumado', kcal: 105, protein: 18, carbs: 2.0, fat: 3.0 },
  { id: 'fd_ovo', label: 'Ovo cozido', kcal: 155, protein: 13, carbs: 1.1, fat: 11 },
  { id: 'fd_atum_agua', label: 'Atum em água (escorrido)', kcal: 116, protein: 26, carbs: 0, fat: 1.0 },
  { id: 'fd_salmao', label: 'Salmão grelhado', kcal: 208, protein: 20, carbs: 0, fat: 13 },
  { id: 'fd_pescada', label: 'Pescada grelhada', kcal: 90, protein: 18, carbs: 0, fat: 1.3 },
  { id: 'fd_camarao', label: 'Camarão cozido', kcal: 99, protein: 24, carbs: 0.2, fat: 0.3 },
  { id: 'fd_tofu', label: 'Tofu', kcal: 76, protein: 8.0, carbs: 1.9, fat: 4.8 },
  { id: 'fd_grao', label: 'Grão-de-bico cozido', kcal: 164, protein: 8.9, carbs: 27, fat: 2.6 },
  { id: 'fd_feijao_preto', label: 'Feijão preto cozido', kcal: 132, protein: 8.9, carbs: 24, fat: 0.5 },
  { id: 'fd_iogurte_grego', label: 'Iogurte grego 0%', kcal: 59, protein: 10, carbs: 3.6, fat: 0.4 },
  { id: 'fd_skyr', label: 'Skyr', kcal: 63, protein: 11, carbs: 4.0, fat: 0.2 },
  { id: 'fd_queijo_fresco', label: 'Queijo fresco magro', kcal: 98, protein: 13, carbs: 3.4, fat: 4.3 },
  { id: 'fd_queijo_light', label: 'Queijo light (fatias)', kcal: 235, protein: 24, carbs: 2.0, fat: 15 },
  { id: 'fd_leite_meio_gordo', label: 'Leite meio-gordo', kcal: 46, protein: 3.4, carbs: 4.9, fat: 1.6 },
  { id: 'fd_leite_sem_lactose', label: 'Leite sem lactose', kcal: 46, protein: 3.4, carbs: 4.8, fat: 1.5 },
  { id: 'fd_banana', label: 'Banana', kcal: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  { id: 'fd_maca', label: 'Maçã', kcal: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  { id: 'fd_morango', label: 'Morango', kcal: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
  { id: 'fd_mirtilo', label: 'Mirtilo', kcal: 57, protein: 0.7, carbs: 14, fat: 0.3 },
  { id: 'fd_laranja', label: 'Laranja', kcal: 47, protein: 0.9, carbs: 12, fat: 0.1 },
  { id: 'fd_abacate', label: 'Abacate', kcal: 160, protein: 2.0, carbs: 9.0, fat: 15 },
  { id: 'fd_azeite', label: 'Azeite', kcal: 884, protein: 0, carbs: 0, fat: 100 },
  { id: 'fd_manteiga_amendoim', label: 'Manteiga de amendoim natural', kcal: 588, protein: 25, carbs: 20, fat: 50 },
  { id: 'fd_amendoas', label: 'Amêndoas', kcal: 579, protein: 21, carbs: 22, fat: 50 },
  { id: 'fd_noz', label: 'Noz', kcal: 654, protein: 15, carbs: 14, fat: 65 },
  { id: 'fd_chocolate_negro', label: 'Chocolate negro 85%', kcal: 598, protein: 7.8, carbs: 27, fat: 48 },
  { id: 'fd_mel', label: 'Mel', kcal: 304, protein: 0.3, carbs: 82, fat: 0 },
  { id: 'fd_brocolos', label: 'Brócolos cozidos', kcal: 35, protein: 2.4, carbs: 7.0, fat: 0.4 },
  { id: 'fd_espinafres', label: 'Espinafres', kcal: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  { id: 'fd_cenoura', label: 'Cenoura', kcal: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  { id: 'fd_tomate', label: 'Tomate', kcal: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  { id: 'fd_pepino', label: 'Pepino', kcal: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
  { id: 'fd_hummus', label: 'Hummus', kcal: 166, protein: 8.0, carbs: 14, fat: 10 },
  { id: 'fd_quinoa', label: 'Quinoa cozida', kcal: 120, protein: 4.4, carbs: 21, fat: 1.9 }
];

/** Simple substring search over label (accent/case-insensitive is overkill for this small local list). */
export function searchFoodDatabase(query: string): FoodDatabaseItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return FOOD_DATABASE.filter((f) => f.label.toLowerCase().includes(q));
}

export function getFoodDatabaseItem(id: string): FoodDatabaseItem | undefined {
  return FOOD_DATABASE.find((f) => f.id === id);
}

/** Scales an item's per-100g macros to a given quantity in grams. */
export function scaleFood(item: FoodDatabaseItem, grams: number) {
  const factor = grams / 100;
  return {
    kcal: Math.round(item.kcal * factor),
    protein: Math.round(item.protein * factor * 10) / 10,
    carbs: Math.round(item.carbs * factor * 10) / 10,
    fat: Math.round(item.fat * factor * 10) / 10
  };
}
