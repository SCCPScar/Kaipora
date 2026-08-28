// Plano alimentar do Kaipora.
// Reformulado com foco em alimentos comuns em supermercados portugueses (Leiria),
// sem carne vermelha e com gramagens indicadas em cada opção (contexto pós-bariátrico).
// Cada opção dentro de uma refeição é uma substituição equivalente às restantes —
// todas ficam dentro de uma banda calórica semelhante ao alvo da refeição.
import type { Meal, FoodOption } from './types-diet';
import { dailyTotals } from '../lib/calories';
import { getHiddenMealOptionIds, getCustomFoodOptions } from '../lib/storage';

export const MEALS: Meal[] = [
  {
    id: "pa",
    name: "Pequeno-Almoço",
    time: "07h",
    targetKcal: 270,
    targetProtein: 22,
    options: [
      {
        id: "pa1",
        label: "Omelete de espinafres",
        desc: "1 ovo + 2 claras + espinafres (40g) + queijo light (25g) + pão integral (30g)",
        kcal: 243,
        protein: 24,
        carbs: 18,
        fat: 8
      },
      {
        id: "pa2",
        label: "Aveia com mirtilos",
        desc: "Aveia (40g) + leite s/lactose (200ml) + mirtilos (80g) + mel (5g)",
        kcal: 285,
        protein: 13,
        carbs: 44,
        fat: 6
      },
      {
        id: "pa3",
        label: "Ovos mexidos e abacate",
        desc: "2 ovos mexidos + torrada integral (25g) + abacate (30g) + café s/açúcar",
        kcal: 290,
        protein: 17,
        carbs: 20,
        fat: 15
      },
      {
        id: "pa4",
        label: "Panquecas de aveia e banana",
        desc: "Aveia (40g) + 1 ovo + banana (60g) amassada, grelhadas sem óleo",
        kcal: 270,
        protein: 14,
        carbs: 38,
        fat: 6
      },
      {
        id: "pa5",
        label: "Iogurte grego com granola",
        desc: "Iogurte grego 0% (200g) + granola s/açúcar (25g) + morangos (80g)",
        kcal: 275,
        protein: 22,
        carbs: 32,
        fat: 4
      },
      {
        id: "pa6",
        label: "Torrada com queijo fresco e peru",
        desc: "Pão de mistura (40g) + queijo fresco magro (40g) + peru fumado (30g) + tomate",
        kcal: 260,
        protein: 20,
        carbs: 28,
        fat: 7
      },
    ]
  },
  {
    id: "lm",
    name: "Lanche da Manhã",
    time: "10h",
    targetKcal: 170,
    targetProtein: 13,
    options: [
      {
        id: "lm1",
        label: "Iogurte com frutos vermelhos",
        desc: "Iogurte grego 0% (150g) + mirtilos ou morangos (80g) + granola s/açúcar (15g)",
        kcal: 177,
        protein: 15,
        carbs: 20,
        fat: 3
      },
      {
        id: "lm2",
        label: "Fruta com amêndoas",
        desc: "1 maçã ou pêra (150g) + amêndoas (15g, ~10 unidades)",
        kcal: 175,
        protein: 4,
        carbs: 26,
        fat: 8
      },
      {
        id: "lm3",
        label: "Cottage com fruta",
        desc: "Queijo cottage (100g) + 1 kiwi + 1 tangerina",
        kcal: 150,
        protein: 12,
        carbs: 17,
        fat: 4
      },
      {
        id: "lm4",
        label: "Banana com manteiga de amendoim",
        desc: "1 banana pequena (100g) + manteiga de amendoim natural (10g)",
        kcal: 155,
        protein: 3,
        carbs: 25,
        fat: 6
      },
      {
        id: "lm5",
        label: "Papaia com ovo cozido",
        desc: "Papaia (120g) + 1 ovo cozido",
        kcal: 155,
        protein: 7,
        carbs: 15,
        fat: 5
      },
      {
        id: "lm6",
        label: "Skyr com chocolate negro",
        desc: "Skyr ou requeijão magro (150g) + chocolate negro 85% (10g)",
        kcal: 165,
        protein: 19,
        carbs: 10,
        fat: 5
      },
    ]
  },
  {
    id: "almoco",
    name: "Almoço",
    time: "13h",
    targetKcal: 490,
    targetProtein: 42,
    options: [
      {
        id: "al1",
        label: "Pescada grelhada com batata-doce",
        desc: "Pescada ou dourada grelhada (150g) + batata-doce assada (150g) + brócolos (100g) + azeite (5ml)",
        kcal: 345,
        protein: 33,
        carbs: 37,
        fat: 7
      },
      {
        id: "al2",
        label: "Frango grelhado com arroz integral",
        desc: "Peito de frango grelhado (130g) + arroz integral (100g) + feijão verde (100g) + azeite (5ml)",
        kcal: 495,
        protein: 40,
        carbs: 38,
        fat: 15
      },
      {
        id: "al3",
        label: "Salada de grão com atum",
        desc: "Grão de bico cozido (150g) + atum em água (80g) + tomate, pepino, cebola + azeite (10ml)",
        kcal: 470,
        protein: 32,
        carbs: 37,
        fat: 17
      },
      {
        id: "al4",
        label: "Massa integral com frango e legumes",
        desc: "Massa integral cozida (100g) + peito de frango (100g) + courgette e cenoura salteadas (100g) + azeite (5ml)",
        kcal: 500,
        protein: 33,
        carbs: 44,
        fat: 14
      },
      {
        id: "al5",
        label: "Salmão com legumes e quinoa",
        desc: "Salmão grelhado (100g) + quinoa cozida (100g) + brócolos e cenoura (100g)",
        kcal: 470,
        protein: 28,
        carbs: 35,
        fat: 20
      },
      {
        id: "al6",
        label: "Tofu grelhado com arroz (opção vegetariana)",
        desc: "Tofu grelhado (150g) + arroz integral (100g) + legumes salteados (120g) + azeite (10ml)",
        kcal: 475,
        protein: 24,
        carbs: 45,
        fat: 18
      },
    ]
  },
  {
    id: "lt",
    name: "Lanche da Tarde",
    time: "16h",
    targetKcal: 200,
    targetProtein: 15,
    options: [
      {
        id: "lt1",
        label: "Queijo fresco com fruta",
        desc: "Queijo fresco magro (50g) + uvas ou meloa (100g)",
        kcal: 190,
        protein: 11,
        carbs: 20,
        fat: 7
      },
      {
        id: "lt2",
        label: "Sandes de peru",
        desc: "Pão integral (30g) + peru fumado (40g) + queijo light (15g) + alface e tomate",
        kcal: 175,
        protein: 17,
        carbs: 18,
        fat: 4
      },
      {
        id: "lt3",
        label: "Iogurte proteico com chocolate",
        desc: "Iogurte grego 0% (150g) + chocolate negro 85% (10g)",
        kcal: 155,
        protein: 17,
        carbs: 10,
        fat: 6
      },
      {
        id: "lt4",
        label: "Fruta com frutos secos",
        desc: "1 pera ou maçã (150g) + nozes ou amêndoas (15g)",
        kcal: 215,
        protein: 3,
        carbs: 25,
        fat: 10
      },
      {
        id: "lt5",
        label: "Bolachas de arroz com hummus",
        desc: "Bolachas de arroz (2 un.) + hummus (40g) + cenoura em palitos (60g)",
        kcal: 195,
        protein: 7,
        carbs: 26,
        fat: 7
      },
      {
        id: "lt6",
        label: "Ovo cozido com fruta",
        desc: "1 ovo cozido + 1 laranja ou tangerina (150g)",
        kcal: 145,
        protein: 9,
        carbs: 17,
        fat: 5
      },
    ]
  },
  {
    id: "jantar",
    name: "Jantar",
    time: "19h",
    targetKcal: 340,
    targetProtein: 30,
    options: [
      {
        id: "ja1",
        label: "Peixe branco com legumes",
        desc: "Pescada ou robalo grelhado (130g) + legumes salteados (150g) + azeite (5ml)",
        kcal: 320,
        protein: 26,
        carbs: 12,
        fat: 17
      },
      {
        id: "ja2",
        label: "Frango com puré de batata-doce",
        desc: "Peito de frango grelhado (120g) + puré de batata-doce (120g) + espinafres salteados (80g)",
        kcal: 345,
        protein: 32,
        carbs: 28,
        fat: 9
      },
      {
        id: "ja3",
        label: "Sopa de legumes com ovo",
        desc: "Sopa de legumes variados (350ml) + 1 ovo cozido ou escalfado + pão integral (20g)",
        kcal: 330,
        protein: 17,
        carbs: 32,
        fat: 12
      },
      {
        id: "ja4",
        label: "Omelete de legumes",
        desc: "2 ovos + 1 clara + courgette, cogumelos e cebola (120g) + salada verde",
        kcal: 300,
        protein: 20,
        carbs: 10,
        fat: 18
      },
      {
        id: "ja5",
        label: "Camarão salteado com legumes",
        desc: "Camarão salteado (150g) + legumes variados (150g) + azeite (8ml)",
        kcal: 310,
        protein: 28,
        carbs: 12,
        fat: 15
      },
      {
        id: "ja6",
        label: "Grão-de-bico estufado com legumes",
        desc: "Grão de bico estufado (150g) + tomate, courgette e pimento (150g)",
        kcal: 340,
        protein: 15,
        carbs: 45,
        fat: 10
      },
    ]
  },
  {
    id: "ceia",
    name: "Ceia",
    time: "21h",
    targetKcal: 145,
    targetProtein: 13,
    options: [
      {
        id: "ce1",
        label: "Leite morno com canela",
        desc: "Leite meio-gordo ou s/lactose (200ml) + canela",
        kcal: 150,
        protein: 7,
        carbs: 10,
        fat: 7
      },
      {
        id: "ce2",
        label: "Skyr com morangos",
        desc: "Skyr ou requeijão magro (100g) + morangos (60g)",
        kcal: 90,
        protein: 12,
        carbs: 9,
        fat: 1
      },
      {
        id: "ce3",
        label: "Punhado de frutos secos",
        desc: "Amêndoas ou nozes (15g)",
        kcal: 95,
        protein: 3,
        carbs: 3,
        fat: 8
      },
      {
        id: "ce4",
        label: "Chá de camomila com bolacha de arroz",
        desc: "Chá de ervas + bolacha de arroz (1 un.) + queijo fresco (20g)",
        kcal: 120,
        protein: 6,
        carbs: 13,
        fat: 4
      },
      {
        id: "ce5",
        label: "Iogurte grego simples",
        desc: "Iogurte grego 0% (125g)",
        kcal: 70,
        protein: 11,
        carbs: 4,
        fat: 0
      },
      {
        id: "ce6",
        label: "Quadrado de chocolate negro com fruta",
        desc: "Chocolate negro 85% (10g) + 1 tangerina",
        kcal: 110,
        protein: 2,
        carbs: 15,
        fat: 5
      },
    ]
  },
];

export function getMeal(id: string): Meal | undefined {
  return MEALS.find((m) => m.id === id);
}

export function getMealOption(mealId: string, optionId: string) {
  return getMeal(mealId)?.options.find((o) => o.id === optionId);
}

/** Other options in the same meal slot — all designed to be roughly nutritionally equivalent. */
export function substitutesFor(mealId: string, optionId: string) {
  return (getMeal(mealId)?.options ?? []).filter((o) => o.id !== optionId);
}

/** Built-in options for a meal plus any user-added custom options — everything
 * that counts towards totals, regardless of whether it's currently hidden. */
export function allMealOptions(mealId: string): FoodOption[] {
  const meal = getMeal(mealId);
  if (!meal) return [];
  return [...meal.options, ...getCustomFoodOptions(mealId)];
}

/** Same as allMealOptions, minus whatever the user has hidden from "A Minha
 * Dieta" — this is what day-to-day checklists (Hoje) should render. */
export function visibleMealOptions(mealId: string): FoodOption[] {
  const hidden = new Set(getHiddenMealOptionIds());
  return allMealOptions(mealId).filter((o) => !hidden.has(o.id));
}

/** Sums kcal/protein/carbs/fat across every meal option (built-in or custom) checked for a given day record. */
export function dailyTotalsForMeals(checkedOptionIds: Record<string, boolean>) {
  const checked = MEALS.flatMap((meal) => allMealOptions(meal.id).filter((o) => checkedOptionIds[o.id]));
  return dailyTotals(checked);
}
