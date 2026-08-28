import type { Tab } from '../nav';
import { MEALS, dailyTotalsForMeals, allMealOptions } from '../../data/diet';
import { SUPPLEMENTS, DIET_NOTES } from '../../data/types-diet';
import { searchFoodDatabase, scaleFood, type FoodDatabaseItem } from '../../data/foodDatabase';
import { dailyTotals } from '../../lib/calories';
import {
  getDay,
  toggleMeal,
  getSettings,
  getCustomFoodOptions,
  addCustomFoodOption,
  deleteCustomFoodOption,
  getHiddenMealOptionIds,
  toggleHiddenMealOption,
  getFoodLog,
  addFoodLogEntry,
  deleteFoodLogEntry
} from '../../lib/storage';
import { todayISO, toISO, addDays } from '../../lib/dates';
import { refreshActive } from '../nav';
import { showToast } from '../components/toast';

type DietView = 'plano' | 'diario';
let view: DietView = 'plano';
/** meal id currently showing its "add custom food" mini-form, or null. */
let addingCustomToMeal: string | null = null;

function combinedDayTotals(date: string, day: ReturnType<typeof getDay>) {
  const plan = dailyTotalsForMeals(day.meals);
  const log = dailyTotals(getFoodLog(date));
  return {
    kcal: plan.kcal + log.kcal,
    protein: plan.protein + log.protein,
    carbs: plan.carbs + log.carbs,
    fat: plan.fat + log.fat
  };
}

export const dietTab: Tab = {
  id: 'dieta',
  label: 'Alimentação',
  icon: '',
  group: 'Corpo',
  render(root: HTMLElement) {
    const date = todayISO();
    const day = getDay(date);
    const settings = getSettings();

    const totals = combinedDayTotals(date, day);
    const remaining = settings.calorieGoal - totals.kcal;

    root.innerHTML = `
      <div class="ph">
        <h2>Alimentação</h2>
        <div class="ph-title">Plano, diário livre e contador de calorias</div>
        <div class="ph-sub">Sem carne vermelha · Alimentos de supermercado em Portugal · Variedade</div>
      </div>

      <div class="stat-row">
        <div class="stat"><strong>${totals.kcal}</strong><small>consumido</small></div>
        <div class="stat"><strong>${settings.calorieGoal}</strong><small>meta kcal</small></div>
        <div class="stat"><strong style="color:${remaining < 0 ? 'var(--burgundy-glow)' : 'var(--green)'}">${remaining >= 0 ? remaining : `+${Math.abs(remaining)}`}</strong><small>${remaining >= 0 ? 'restante' : 'acima da meta'}</small></div>
      </div>
      <div class="stat-row">
        <div class="stat"><strong>${totals.protein}g</strong><small>proteína / ${settings.proteinGoal}g</small></div>
        <div class="stat"><strong>${totals.carbs}g</strong><small>carboidr. / ${settings.carbGoal}g</small></div>
        <div class="stat"><strong>${totals.fat}g</strong><small>gordura / ${settings.fatGoal}g</small></div>
      </div>

      <div class="modality-switch">
        <button class="modality-btn ${view === 'plano' ? 'active' : ''}" data-view="plano">Meu Plano</button>
        <button class="modality-btn ${view === 'diario' ? 'active' : ''}" data-view="diario">Diário Livre</button>
      </div>

      <div id="diet-content"></div>

      <section>
        <div class="sec-title">Histórico (últimos 7 dias)</div>
        <div id="diet-history"></div>
      </section>
    `;

    if (view === 'plano') renderPlano(root, date, day);
    else renderDiario(root, date);
    renderHistory(root, date);
    wireEvents(root, date);
  }
};

function renderPlano(root: HTMLElement, date: string, day: ReturnType<typeof getDay>) {
  const el = root.querySelector('#diet-content') as HTMLElement;
  const hidden = new Set(getHiddenMealOptionIds());
  const allCustom = getCustomFoodOptions();

  el.innerHTML =
    `<div class="alert"><span>Não bebas durante as refeições (30 min antes e depois). As opções de cada refeição são substituições equivalentes — oculta as que não usas e adiciona as tuas próprias.</span></div>` +
    MEALS.map((meal) => {
      const options = allMealOptions(meal.id);
      const totalKcal = options.reduce((s, o) => (day.meals[o.id] ? s + o.kcal : s), 0);
      const totalP = options.reduce((s, o) => (day.meals[o.id] ? s + o.protein : s), 0);
      const isAdding = addingCustomToMeal === meal.id;
      return `
      <section>
        <div class="sec-title"><span>${meal.name} · ${meal.time}</span><span class="badge-k">~${meal.targetKcal} kcal</span></div>
        ${options
          .map((o) => {
            const isCustom = allCustom.some((c) => c.id === o.id);
            const isHidden = hidden.has(o.id);
            return `
          <div class="row ${day.meals[o.id] ? 'done' : ''} ${isHidden ? 'muted-row' : ''}" data-option="${o.id}">
            <div class="chk"></div>
            <div class="rtxt">
              <strong>${o.label}</strong>
              <small>${o.desc}</small>
              <small>P: ${o.protein}g · HC: ${o.carbs}g · G: ${o.fat}g</small>
            </div>
            <span class="kcal">${o.kcal} kcal</span>
            ${isCustom ? `<button class="log-del" data-del-custom="${allCustom.indexOf(allCustom.find((c) => c.id === o.id)!)}">✕</button>` : `<button class="log-del" data-hide-option="${o.id}" style="font-size:11px">${isHidden ? 'Mostrar' : 'Ocultar'}</button>`}
          </div>`;
          })
          .join('')}
        <div class="sub-row">
          <span class="badge-p">${totalP}g prot</span>
          <span class="badge-k">${totalKcal} kcal</span>
        </div>
        ${
          isAdding
            ? `
        <div class="form-row" style="flex-wrap:wrap">
          <input class="finp custom-label" type="text" placeholder="Nome do alimento" style="flex:2;min-width:140px" />
          <input class="finp custom-desc" type="text" placeholder="Composição (opcional)" style="flex:2;min-width:140px" />
        </div>
        <div class="form-row" style="padding-top:0;flex-wrap:wrap">
          <input class="finp custom-kcal" type="number" min="0" placeholder="kcal" style="flex:1;min-width:70px" />
          <input class="finp custom-protein" type="number" min="0" placeholder="prot g" style="flex:1;min-width:70px" />
          <input class="finp custom-carbs" type="number" min="0" placeholder="HC g" style="flex:1;min-width:70px" />
          <input class="finp custom-fat" type="number" min="0" placeholder="gord g" style="flex:1;min-width:70px" />
        </div>
        <div class="form-row" style="padding-top:0">
          <button class="btn block" data-save-custom="${meal.id}">Guardar alimento</button>
        </div>`
            : `<div class="form-row" style="padding-top:0"><button class="btn block" data-toggle-add-custom="${meal.id}">+ Adicionar alimento a ${meal.name}</button></div>`
        }
      </section>`;
    }).join('') +
    `
      <section>
        <div class="sec-title">Suplementos</div>
        ${SUPPLEMENTS.map((s) => `<div class="row" style="cursor:default"><div class="rtxt"><strong>${s.name}</strong><small>${s.note}</small></div></div>`).join('')}
      </section>

      <section>
        <div class="sec-title">Notas sobre o plano</div>
        <div style="padding:12px 16px;font-size:12.5px;color:var(--text-dim);line-height:1.7">
          ${DIET_NOTES.map((n) => `• ${n}`).join('<br>')}
        </div>
      </section>`;
}

function renderDiario(root: HTMLElement, date: string) {
  const el = root.querySelector('#diet-content') as HTMLElement;
  const allLog = getFoodLog();
  const todays = allLog.filter((e) => e.date === date);

  el.innerHTML = `
    <div class="alert"><span>Regista aqui o que comeste fora do plano — pesquisa um alimento (valores por 100g) ou adiciona manualmente.</span></div>

    <section>
      <div class="sec-title">Contador de Calorias</div>
      <div class="form-row">
        <input class="finp" id="food-search" type="text" placeholder="Pesquisar alimento (ex: frango, arroz, iogurte)" style="flex:1" />
      </div>
      <div id="food-search-results"></div>
    </section>

    <section>
      <div class="sec-title">Adicionar manualmente</div>
      <div class="form-row">
        <input class="finp" id="manual-label" type="text" placeholder="Nome" style="flex:2" />
      </div>
      <div class="form-row" style="padding-top:0;flex-wrap:wrap">
        <input class="finp" id="manual-kcal" type="number" min="0" placeholder="kcal" style="flex:1;min-width:70px" />
        <input class="finp" id="manual-protein" type="number" min="0" placeholder="prot g" style="flex:1;min-width:70px" />
        <input class="finp" id="manual-carbs" type="number" min="0" placeholder="HC g" style="flex:1;min-width:70px" />
        <input class="finp" id="manual-fat" type="number" min="0" placeholder="gord g" style="flex:1;min-width:70px" />
      </div>
      <div class="form-row" style="padding-top:0">
        <button class="btn block" id="manual-add">+ Adicionar ao diário</button>
      </div>
    </section>

    <section>
      <div class="sec-title">Hoje no diário livre</div>
      <div id="food-log-list"></div>
    </section>
  `;

  renderFoodResults(root, '');

  const listEl = root.querySelector('#food-log-list') as HTMLElement;
  listEl.innerHTML = todays.length
    ? todays
        .map(
          (entry) => `
      <div class="log-item">
        <div class="log-txt"><strong>${entry.label}</strong><div class="log-date">${entry.kcal} kcal · P:${entry.protein}g HC:${entry.carbs}g G:${entry.fat}g${entry.grams ? ` · ${entry.grams}g` : ''}</div></div>
        <button class="log-del" data-del-log="${allLog.indexOf(entry)}">✕</button>
      </div>`
        )
        .join('')
    : '<div class="empty">Sem entradas livres hoje</div>';
}

function renderFoodResults(root: HTMLElement, query: string) {
  const el = root.querySelector('#food-search-results') as HTMLElement;
  if (!el) return;
  const results = searchFoodDatabase(query);
  if (!query.trim()) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = results.length
    ? results
        .map(
          (item) => `
      <div class="row" style="cursor:default" data-food-row="${item.id}">
        <div class="rtxt"><strong>${item.label}</strong><small>${item.kcal} kcal / 100g · P:${item.protein}g HC:${item.carbs}g G:${item.fat}g</small></div>
        <input class="finp food-grams" type="number" min="1" value="100" style="width:64px;flex:none;padding:8px 6px" />
        <button class="btn" data-add-food="${item.id}" style="flex:none;padding:8px 12px">+</button>
      </div>`
        )
        .join('')
    : '<div class="empty">Nenhum alimento encontrado</div>';
}

function renderHistory(root: HTMLElement, date: string) {
  const el = root.querySelector('#diet-history') as HTMLElement;
  const today = new Date(date);
  const rows: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(today, -i);
    const iso = toISO(d);
    const rec = getDay(iso);
    const kcal = combinedDayTotals(iso, rec).kcal;
    const anyMarked = MEALS.some((m) => m.options.some((o) => rec.meals[o.id])) || getFoodLog(iso).length > 0;
    rows.push(`
      <div class="log-item">
        <div class="log-txt"><strong>${iso}</strong><div class="log-date">${anyMarked ? `${kcal} kcal registadas` : 'Sem registo'}</div></div>
      </div>`);
  }
  el.innerHTML = rows.join('');
}

function wireEvents(root: HTMLElement, date: string) {
  root.querySelector('.modality-switch')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-view]');
    if (!btn) return;
    view = btn.dataset.view as DietView;
    refreshActive();
  });

  root.querySelector('#diet-content')?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    const hideBtn = target.closest<HTMLElement>('[data-hide-option]');
    if (hideBtn) {
      toggleHiddenMealOption(hideBtn.dataset.hideOption as string);
      refreshActive();
      return;
    }

    const delCustomBtn = target.closest<HTMLElement>('[data-del-custom]');
    if (delCustomBtn) {
      if (!confirm('Remover este alimento personalizado?')) return;
      deleteCustomFoodOption(Number(delCustomBtn.dataset.delCustom));
      refreshActive();
      return;
    }

    const toggleAddBtn = target.closest<HTMLElement>('[data-toggle-add-custom]');
    if (toggleAddBtn) {
      const mealId = toggleAddBtn.dataset.toggleAddCustom as string;
      addingCustomToMeal = addingCustomToMeal === mealId ? null : mealId;
      refreshActive();
      return;
    }

    const saveCustomBtn = target.closest<HTMLElement>('[data-save-custom]');
    if (saveCustomBtn) {
      const mealId = saveCustomBtn.dataset.saveCustom as string;
      const section = saveCustomBtn.closest('section') as HTMLElement;
      const label = (section.querySelector('.custom-label') as HTMLInputElement).value.trim();
      const desc = (section.querySelector('.custom-desc') as HTMLInputElement).value.trim();
      const kcal = Number((section.querySelector('.custom-kcal') as HTMLInputElement).value) || 0;
      const protein = Number((section.querySelector('.custom-protein') as HTMLInputElement).value) || 0;
      const carbs = Number((section.querySelector('.custom-carbs') as HTMLInputElement).value) || 0;
      const fat = Number((section.querySelector('.custom-fat') as HTMLInputElement).value) || 0;
      if (!label || !kcal) {
        showToast('Preenche pelo menos o nome e as kcal');
        return;
      }
      addCustomFoodOption({ id: `cf_${Date.now()}`, mealId, label, desc, kcal, protein, carbs, fat });
      addingCustomToMeal = null;
      showToast('Alimento adicionado à Minha Dieta');
      refreshActive();
      return;
    }

    const row = target.closest<HTMLElement>('[data-option]');
    if (row) {
      toggleMeal(date, row.dataset.option as string);
      refreshActive();
    }
  });

  const searchInput = root.querySelector('#food-search') as HTMLInputElement | null;
  searchInput?.addEventListener('input', () => renderFoodResults(root, searchInput.value));

  root.querySelector('#food-search-results')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-add-food]');
    if (!btn) return;
    const row = btn.closest<HTMLElement>('[data-food-row]');
    const item = searchFoodDatabase((root.querySelector('#food-search') as HTMLInputElement).value).find(
      (f: FoodDatabaseItem) => f.id === btn.dataset.addFood
    );
    if (!row || !item) return;
    const grams = Number((row.querySelector('.food-grams') as HTMLInputElement).value) || 100;
    const scaled = scaleFood(item, grams);
    addFoodLogEntry({ date, label: item.label, grams, ...scaled });
    showToast(`${item.label} adicionado ao diário`);
    refreshActive();
  });

  root.querySelector('#manual-add')?.addEventListener('click', () => {
    const label = (root.querySelector('#manual-label') as HTMLInputElement).value.trim();
    const kcal = Number((root.querySelector('#manual-kcal') as HTMLInputElement).value) || 0;
    const protein = Number((root.querySelector('#manual-protein') as HTMLInputElement).value) || 0;
    const carbs = Number((root.querySelector('#manual-carbs') as HTMLInputElement).value) || 0;
    const fat = Number((root.querySelector('#manual-fat') as HTMLInputElement).value) || 0;
    if (!label || !kcal) {
      showToast('Preenche pelo menos o nome e as kcal');
      return;
    }
    addFoodLogEntry({ date, label, kcal, protein, carbs, fat });
    showToast('Adicionado ao diário');
    refreshActive();
  });

  root.querySelector('#food-log-list')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-del-log]');
    if (!btn) return;
    if (!confirm('Remover esta entrada?')) return;
    deleteFoodLogEntry(Number(btn.dataset.delLog));
    refreshActive();
  });
}
