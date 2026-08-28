import type { Tombstonable } from '../lib/types';

export interface FoodOption {
  id: string;
  label: string;
  desc: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  id: string;
  name: string;
  time: string;
  targetKcal: number;
  targetProtein: number;
  options: FoodOption[];
}

/** A user-added food option for a meal slot in "A Minha Dieta" — same shape
 * as the built-in FoodOption, plus which meal it belongs to. The built-in
 * plan itself is never edited or deleted; this is an additive overlay. */
export interface CustomFoodOption extends Tombstonable {
  id: string;
  mealId: string;
  label: string;
  desc: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

/** A free-form entry in the Diário Alimentar — food eaten outside the fixed
 * meal plan, either picked from the local food database (Contador de
 * Calorias) or typed in manually. */
export interface FoodLogEntry extends Tombstonable {
  date: string; // YYYY-MM-DD
  label: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  grams?: number;
}

export const SUPPLEMENTS = [
  { name: 'Vitamina B12', note: 'Essencial pós-bariátrica' },
  { name: 'Multivitamínico', note: 'Diário, conforme indicação médica' },
  { name: 'Vitamina D', note: 'Diário ou conforme indicação médica' },
  { name: 'Cálcio', note: 'Diário, especialmente pós-bariátrica' },
  { name: 'Proteína em pó (whey ou vegetal)', note: 'Opcional, para atingir a meta de proteína' }
];

export const DIET_NOTES = [
  'Sem carne vermelha — todas as opções usam peixe, aves, ovos, laticínios ou leguminosas como fonte de proteína.',
  'Não bebas durante as refeições (cerca de 30 min antes e depois) — recomendação comum pós-bariátrica.',
  'Mastiga devagar e para quando sentires saciedade — a app regista o que comeste, não obriga a terminar o prato.',
  'Todas as opções de uma refeição são substituições equivalentes entre si — escolhe a que tiveres disponível.',
  'Os valores de kcal e macros são estimativas de referência para acompanhamento pessoal — não são dados de uma tabela nutricional certificada nem substituem indicação médica/nutricional.',
  'O Diário Livre e o Contador de Calorias usam a mesma lógica de estimativas de referência (por 100g) — úteis para teres uma noção geral, não para precisão clínica.'
];
