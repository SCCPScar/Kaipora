import type { Tab } from '../nav';
import { MEALS, allMealOptions, combinedDayTotals } from '../../data/diet';
import { SUPPLEMENTS, DIET_NOTES } from '../../data/types-diet';
import { searchFoodDatabase, scaleFood, type FoodDatabaseItem } from '../../data/foodDatabase';
import { searchOpenFoodFacts, type OpenFoodFactsItem } from '../../lib/openFoodFacts';
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
import { escapeHtml } from '../../lib/sanitize';
import { t } from '../../i18n';

type DietView = 'plano' | 'diario';
let view: DietView = 'plano';
/** meal id currently showing its "add custom food" mini-form, or null. */
let addingCustomToMeal: string | null = null;

/** Results of the last resolved Open Food Facts search, so the "+" click
 * handler (synchronous) can look an item up by id without re-fetching —
 * see renderOpenFoodFactsResults. */
let offResultsCache: OpenFoodFactsItem[] = [];
/** Bumped on every new search so a slow, now-stale response can't overwrite
 * the results of a newer one that already resolved (out-of-order network
 * replies). */
let offSearchToken = 0;
let offSearchDebounce: ReturnType<typeof setTimeout> | undefined;

export const dietTab: Tab = {
  id: 'dieta',
  label: 'common.nutrition',
  icon: '',
  group: 'Corpo',
  render(root: HTMLElement) {
    const date = todayISO();
    const day = getDay(date);
    const settings = getSettings();

    const totals = combinedDayTotals(date, day.meals);
    const remaining = settings.calorieGoal - totals.kcal;

    root.innerHTML = `
      <div class="ph">
        <h2>${t('common.nutrition')}</h2>
        <div class="ph-title">${t('dieta.subtitle')}</div>
        <div class="ph-sub">${t('dieta.description')}</div>
      </div>

      <div class="stat-row">
        <div class="stat"><strong>${totals.kcal}</strong><small>${t('dieta.stat.consumed')}</small></div>
        <div class="stat"><strong>${settings.calorieGoal}</strong><small>${t('dieta.stat.goal')}</small></div>
        <div class="stat"><strong>${remaining >= 0 ? remaining : `+${Math.abs(remaining)}`}</strong><small>${remaining >= 0 ? t('dieta.stat.remaining') : t('dieta.stat.over')}</small></div>
      </div>
      <div class="macro-line" style="padding:0 14px 12px">${t('common.abbr.protein')} ${totals.protein}g / ${settings.proteinGoal}g &middot; ${t('common.abbr.carbs')} ${totals.carbs}g / ${settings.carbGoal}g &middot; ${t('common.abbr.fat')} ${totals.fat}g / ${settings.fatGoal}g</div>

      <div class="modality-switch">
        <button class="modality-btn ${view === 'plano' ? 'active' : ''}" data-view="plano">${t('dieta.view.plan')}</button>
        <button class="modality-btn ${view === 'diario' ? 'active' : ''}" data-view="diario">${t('dieta.view.diary')}</button>
      </div>

      <div id="diet-content"></div>

      <section>
        <div class="sec-title">${t('dieta.history.title')}</div>
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
    `<div class="alert"><span>${t('dieta.plan.alert')}</span></div>` +
    MEALS.map((meal) => {
      const options = allMealOptions(meal.id);
      const totalKcal = options.reduce((s, o) => (day.meals[o.id] ? s + o.kcal : s), 0);
      const totalP = options.reduce((s, o) => (day.meals[o.id] ? s + o.protein : s), 0);
      const isAdding = addingCustomToMeal === meal.id;
      return `
      <section>
        <div class="sec-title"><span>${meal.name} · ${meal.time}</span><span class="macro-line">~${meal.targetKcal} kcal</span></div>
        ${options
          .map((o) => {
            const isCustom = allCustom.some((c) => c.id === o.id);
            const isHidden = hidden.has(o.id);
            return `
          <div class="row ${day.meals[o.id] ? 'done' : ''} ${isHidden ? 'muted-row' : ''}" data-option="${o.id}">
            <div class="chk"></div>
            <div class="rtxt">
              <strong>${escapeHtml(o.label)}</strong>
              <small>${escapeHtml(o.desc)}</small>
              <small>${t('common.abbr.protein')}: ${o.protein}g · ${t('common.abbr.carbs')}: ${o.carbs}g · ${t('common.abbr.fat')}: ${o.fat}g</small>
            </div>
            <span class="kcal">${o.kcal} kcal</span>
            ${isCustom ? `<button class="log-del" data-del-custom="${allCustom.indexOf(allCustom.find((c) => c.id === o.id)!)}" aria-label="${t('common.remove')}">✕</button>` : `<button class="log-del" data-hide-option="${o.id}" style="font-size:11px">${isHidden ? t('dieta.plan.show') : t('dieta.plan.hide')}</button>`}
          </div>`;
          })
          .join('')}
        <div class="sub-row">
          <span class="macro-line">${totalKcal} kcal &middot; ${t('common.abbr.protein')} ${totalP}g</span>
        </div>
        ${
          isAdding
            ? `
        <div class="form-row" style="flex-wrap:wrap">
          <input class="finp custom-label" type="text" placeholder="${t('dieta.plan.customName')}" style="flex:2;min-width:140px" />
          <input class="finp custom-desc" type="text" placeholder="${t('dieta.plan.customDesc')}" style="flex:2;min-width:140px" />
        </div>
        <div class="form-row" style="padding-top:0;flex-wrap:wrap">
          <input class="finp custom-kcal" type="number" min="0" placeholder="${t('dieta.plan.kcal')}" style="flex:1;min-width:70px" />
          <input class="finp custom-protein" type="number" min="0" placeholder="${t('dieta.plan.proteinG')}" style="flex:1;min-width:70px" />
          <input class="finp custom-carbs" type="number" min="0" placeholder="${t('dieta.plan.carbsG')}" style="flex:1;min-width:70px" />
          <input class="finp custom-fat" type="number" min="0" placeholder="${t('dieta.plan.fatG')}" style="flex:1;min-width:70px" />
        </div>
        <div class="form-row" style="padding-top:0">
          <button class="btn block" data-save-custom="${meal.id}">${t('dieta.plan.saveCustom')}</button>
        </div>`
            : `<div class="form-row" style="padding-top:0"><button class="btn block" data-toggle-add-custom="${meal.id}">${t('dieta.plan.addCustom', { meal: meal.name })}</button></div>`
        }
      </section>`;
    }).join('') +
    `
      <section>
        <div class="sec-title">${t('dieta.plan.supplements')}</div>
        ${SUPPLEMENTS.map((s) => `<div class="row" style="cursor:default"><div class="rtxt"><strong>${s.name}</strong><small>${s.note}</small></div></div>`).join('')}
      </section>

      <section>
        <div class="sec-title">${t('dieta.plan.notes')}</div>
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
    <div class="alert"><span>${t('dieta.diary.alert')}</span></div>

    <section>
      <div class="sec-title">${t('dieta.diary.counterTitle')}</div>
      <div class="form-row">
        <input class="finp" id="food-search" type="text" placeholder="${t('dieta.diary.searchPlaceholder')}" style="flex:1" />
      </div>
      <div id="food-search-results"></div>
      <div id="off-search-results"></div>
    </section>

    <section>
      <div class="sec-title">${t('dieta.diary.manualTitle')}</div>
      <div class="form-row">
        <input class="finp" id="manual-label" type="text" placeholder="${t('dieta.diary.manualName')}" style="flex:2" />
      </div>
      <div class="form-row" style="padding-top:0;flex-wrap:wrap">
        <input class="finp" id="manual-kcal" type="number" min="0" placeholder="${t('dieta.plan.kcal')}" style="flex:1;min-width:70px" />
        <input class="finp" id="manual-protein" type="number" min="0" placeholder="${t('dieta.plan.proteinG')}" style="flex:1;min-width:70px" />
        <input class="finp" id="manual-carbs" type="number" min="0" placeholder="${t('dieta.plan.carbsG')}" style="flex:1;min-width:70px" />
        <input class="finp" id="manual-fat" type="number" min="0" placeholder="${t('dieta.plan.fatG')}" style="flex:1;min-width:70px" />
      </div>
      <div class="form-row" style="padding-top:0">
        <button class="btn block" id="manual-add">${t('dieta.diary.manualAdd')}</button>
      </div>
    </section>

    <section>
      <div class="sec-title">${t('dieta.diary.todayTitle')}</div>
      <div id="food-log-list"></div>
    </section>
  `;

  renderFoodResults(root, '');
  void renderOpenFoodFactsResults(root, '');

  const listEl = root.querySelector('#food-log-list') as HTMLElement;
  listEl.innerHTML = todays.length
    ? todays
        .map(
          (entry) => `
      <div class="log-item">
        <div class="log-txt"><strong>${escapeHtml(entry.label)}</strong><div class="log-date">${entry.kcal} kcal · ${t('common.abbr.protein')}:${entry.protein}g ${t('common.abbr.carbs')}:${entry.carbs}g ${t('common.abbr.fat')}:${entry.fat}g${entry.grams ? ` · ${entry.grams}g` : ''}</div></div>
        <button class="log-del" data-del-log="${allLog.indexOf(entry)}" aria-label="${t('common.remove')}">✕</button>
      </div>`
        )
        .join('')
    : `<div class="empty">${t('dieta.diary.empty')}</div>`;
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
        <div class="rtxt"><strong>${item.label}</strong><small>${item.kcal} kcal / 100g · ${t('common.abbr.protein')}:${item.protein}g ${t('common.abbr.carbs')}:${item.carbs}g ${t('common.abbr.fat')}:${item.fat}g</small></div>
        <input class="finp food-grams" type="number" min="1" value="100" style="width:64px;flex:none;padding:8px 6px" />
        <button class="btn" data-add-food="${item.id}" style="flex:none;padding:8px 12px">+</button>
      </div>`
        )
        .join('')
    : `<div class="empty">${t('dieta.diary.noResults')}</div>`;
}

/**
 * Live, best-effort augment of the local search with branded/packaged
 * products from Open Food Facts — for products the curated local database
 * doesn't have (a specific supermarket brand, say). Debounced by the
 * caller; silently shows no results when there's no connection instead of
 * erroring, since this must never get in the way of the always-available
 * local search and manual entry above it.
 */
async function renderOpenFoodFactsResults(root: HTMLElement, query: string): Promise<void> {
  const el = root.querySelector('#off-search-results') as HTMLElement | null;
  if (!el) return;
  if (!query.trim()) {
    el.innerHTML = '';
    offResultsCache = [];
    return;
  }

  const token = ++offSearchToken;
  el.innerHTML = `<div class="sec-title" style="margin-top:6px">${t('dieta.diary.offTitle')}</div><div class="empty">${t('dieta.diary.offSearching')}</div>`;
  const results = await searchOpenFoodFacts(query);
  if (token !== offSearchToken) return; // a newer search already superseded this one

  offResultsCache = results;
  el.innerHTML =
    `<div class="sec-title" style="margin-top:6px">${t('dieta.diary.offTitle')}</div>` +
    (results.length
      ? results
          .map(
            (item) => `
      <div class="row" style="cursor:default" data-off-row="${item.id}">
        <div class="rtxt"><strong>${escapeHtml(item.label)}</strong><small>${item.kcal} kcal / 100g · ${t('common.abbr.protein')}:${item.protein}g ${t('common.abbr.carbs')}:${item.carbs}g ${t('common.abbr.fat')}:${item.fat}g</small></div>
        <input class="finp off-grams" type="number" min="1" value="100" style="width:64px;flex:none;padding:8px 6px" />
        <button class="btn" data-add-off="${item.id}" style="flex:none;padding:8px 12px">+</button>
      </div>`
          )
          .join('')
      : `<div class="empty">${t('dieta.diary.offNoResults')}</div>`);
}

function renderHistory(root: HTMLElement, date: string) {
  const el = root.querySelector('#diet-history') as HTMLElement;
  const today = new Date(date);
  const rows: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(today, -i);
    const iso = toISO(d);
    const rec = getDay(iso);
    const kcal = combinedDayTotals(iso, rec.meals).kcal;
    const anyMarked = MEALS.some((m) => m.options.some((o) => rec.meals[o.id])) || getFoodLog(iso).length > 0;
    rows.push(`
      <div class="log-item">
        <div class="log-txt"><strong>${iso}</strong><div class="log-date">${anyMarked ? t('dieta.history.kcalRegistered', { kcal }) : t('dieta.history.noRecord')}</div></div>
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
      if (!confirm(t('dieta.plan.confirmRemoveCustom'))) return;
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
        showToast(t('dieta.plan.toastFillNameKcal'));
        return;
      }
      addCustomFoodOption({ id: `cf_${Date.now()}`, mealId, label, desc, kcal, protein, carbs, fat });
      addingCustomToMeal = null;
      showToast(t('dieta.plan.toastAdded'));
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
  searchInput?.addEventListener('input', () => {
    renderFoodResults(root, searchInput.value);
    if (offSearchDebounce) clearTimeout(offSearchDebounce);
    offSearchDebounce = setTimeout(() => void renderOpenFoodFactsResults(root, searchInput.value), 500);
  });

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
    showToast(t('dieta.diary.toastFoodAdded', { label: item.label }));
    refreshActive();
  });

  root.querySelector('#off-search-results')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-add-off]');
    if (!btn) return;
    const row = btn.closest<HTMLElement>('[data-off-row]');
    const item = offResultsCache.find((f) => f.id === btn.dataset.addOff);
    if (!row || !item) return;
    const grams = Number((row.querySelector('.off-grams') as HTMLInputElement).value) || 100;
    const scaled = scaleFood(item, grams);
    addFoodLogEntry({ date, label: item.label, grams, ...scaled });
    showToast(t('dieta.diary.toastFoodAdded', { label: item.label }));
    refreshActive();
  });

  root.querySelector('#manual-add')?.addEventListener('click', () => {
    const label = (root.querySelector('#manual-label') as HTMLInputElement).value.trim();
    const kcal = Number((root.querySelector('#manual-kcal') as HTMLInputElement).value) || 0;
    const protein = Number((root.querySelector('#manual-protein') as HTMLInputElement).value) || 0;
    const carbs = Number((root.querySelector('#manual-carbs') as HTMLInputElement).value) || 0;
    const fat = Number((root.querySelector('#manual-fat') as HTMLInputElement).value) || 0;
    if (!label || !kcal) {
      showToast(t('dieta.diary.toastFillNameKcal'));
      return;
    }
    addFoodLogEntry({ date, label, kcal, protein, carbs, fat });
    showToast(t('dieta.diary.toastAdded'));
    refreshActive();
  });

  root.querySelector('#food-log-list')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-del-log]');
    if (!btn) return;
    if (!confirm(t('dieta.diary.confirmRemoveEntry'))) return;
    deleteFoodLogEntry(Number(btn.dataset.delLog));
    refreshActive();
  });
}
