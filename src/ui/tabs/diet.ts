import type { Tab } from '../nav';
import { MEALS, dailyTotalsForMeals } from '../../data/diet';
import { SUPPLEMENTS, DIET_NOTES } from '../../data/types-diet';
import { getDay, toggleMeal, getSettings } from '../../lib/storage';
import { todayISO, toISO, addDays } from '../../lib/dates';
import { refreshActive } from '../nav';

export const dietTab: Tab = {
  id: 'dieta',
  label: 'Alimentação',
  icon: '',
  group: 'Corpo',
  render(root: HTMLElement) {
    const date = todayISO();
    const day = getDay(date);
    const settings = getSettings();

    const totals = dailyTotalsForMeals(day.meals);

    const remaining = settings.calorieGoal - totals.kcal;

    root.innerHTML = `
      <div class="ph">
        <h2>Dieta</h2>
        <div class="ph-title">Plano alimentar</div>
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

      <div class="alert"><span>Não bebas durante as refeições (30 min antes e depois). Marca o que realmente comeste — as opções de cada refeição são substituições equivalentes entre si.</span></div>

      <div id="meals-full"></div>

      <section>
        <div class="sec-title">Suplementos</div>
        ${SUPPLEMENTS.map(
          (s) => `<div class="row" style="cursor:default"><div class="rtxt"><strong>${s.name}</strong><small>${s.note}</small></div></div>`
        ).join('')}
      </section>

      <section>
        <div class="sec-title">Notas sobre o plano</div>
        <div style="padding:12px 16px;font-size:12.5px;color:var(--text-dim);line-height:1.7">
          ${DIET_NOTES.map((n) => `• ${n}`).join('<br>')}
        </div>
      </section>

      <section>
        <div class="sec-title">Histórico alimentar (últimos 7 dias)</div>
        <div id="diet-history"></div>
      </section>
    `;

    renderMeals(root, date, day);
    renderHistory(root, date);

    root.querySelector('#meals-full')?.addEventListener('click', (e) => {
      const row = (e.target as HTMLElement).closest<HTMLElement>('[data-option]');
      if (!row) return;
      toggleMeal(date, row.dataset.option as string);
      refreshActive();
    });
  }
};

function renderMeals(root: HTMLElement, date: string, day: ReturnType<typeof getDay>) {
  const el = root.querySelector('#meals-full') as HTMLElement;
  el.innerHTML = MEALS.map((meal) => {
    const totalKcal = meal.options.reduce((s, o) => (day.meals[o.id] ? s + o.kcal : s), 0);
    const totalP = meal.options.reduce((s, o) => (day.meals[o.id] ? s + o.protein : s), 0);
    return `
    <section>
      <div class="sec-title"><span>${meal.name} · ${meal.time}</span><span class="badge-k">~${meal.targetKcal} kcal</span></div>
      ${meal.options
        .map(
          (o) => `
        <div class="row ${day.meals[o.id] ? 'done' : ''}" data-option="${o.id}">
          <div class="chk"></div>
          <div class="rtxt">
            <strong>${o.label}</strong>
            <small>${o.desc}</small>
            <small>P: ${o.protein}g · HC: ${o.carbs}g · G: ${o.fat}g</small>
          </div>
          <span class="kcal">${o.kcal} kcal</span>
        </div>`
        )
        .join('')}
      <div class="sub-row">
        <span class="badge-p">${totalP}g prot</span>
        <span class="badge-k">${totalKcal} kcal</span>
      </div>
    </section>`;
  }).join('');
}

function renderHistory(root: HTMLElement, date: string) {
  const el = root.querySelector('#diet-history') as HTMLElement;
  const today = new Date(date);
  const rows: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDays(today, -i);
    const iso = toISO(d);
    const rec = getDay(iso);
    const kcal = dailyTotalsForMeals(rec.meals).kcal;
    const anyMarked = MEALS.some((m) => m.options.some((o) => rec.meals[o.id]));
    rows.push(`
      <div class="log-item">
        <div class="log-txt"><strong>${iso}</strong><div class="log-date">${anyMarked ? `${kcal} kcal registadas` : 'Sem registo'}</div></div>
      </div>`);
  }
  el.innerHTML = rows.join('');
}
