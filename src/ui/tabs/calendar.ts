import type { Tab } from '../nav';
import { getDay, getSettings } from '../../lib/storage';
import { toISO, dayAbbr, monthNames } from '../../lib/dates';
import { MEALS } from '../../data/diet';
import { getWorkoutById } from '../../data/training';
import { EXERCISES } from '../../data/exercises';
import { openModal } from '../components/modal';
import { refreshActive } from '../nav';
import { t } from '../../i18n';

let viewYear = new Date().getFullYear();
let viewMonth = new Date().getMonth();

export const calendarTab: Tab = {
  id: 'calendario',
  label: 'nav.tab.calendario',
  icon: '',
  group: 'Acompanhamento',
  render(root: HTMLElement) {
    const first = new Date(viewYear, viewMonth, 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const todayIso = toISO(new Date());

    const cells: string[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push('<div class="cal-day empty"></div>');
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth, d);
      const iso = toISO(date);
      const rec = getDay(iso);
      const settings = getSettings();
      const glassGoal = Math.max(1, Math.round(settings.waterGoalMl / 250));
      const waterDone = rec.water >= glassGoal;
      const foodDone = MEALS.some((m) => m.options.some((o) => rec.meals[o.id]));
      const trainDone = Boolean(rec.training?.done);
      cells.push(`
        <div class="cal-day ${iso === todayIso ? 'today' : ''}" data-date="${iso}">
          <span>${d}</span>
          <div class="cal-dots">
            ${waterDone ? '<span class="cal-dot dot-water"></span>' : ''}
            ${foodDone ? '<span class="cal-dot dot-food"></span>' : ''}
            ${trainDone ? '<span class="cal-dot dot-train"></span>' : ''}
          </div>
        </div>`);
    }

    root.innerHTML = `
      <div class="ph">
        <h2>${t('calendario.title')}</h2>
        <div class="ph-title">${monthNames()[viewMonth]} ${viewYear}</div>
        <div class="ph-sub">${t('calendario.subtitle')}</div>
      </div>
      <section>
        <div class="cal-head">
          <button class="cal-nav" id="cal-prev" aria-label="${t('common.prevMonth')}">‹</button>
          <span class="pill">${t('calendario.monthYear', { month: monthNames()[viewMonth], year: viewYear })}</span>
          <button class="cal-nav" id="cal-next" aria-label="${t('common.nextMonth')}">›</button>
        </div>
        <div class="cal-grid">
          ${dayAbbr().map((a) => `<div class="cal-dow">${a}</div>`).join('')}
          ${cells.join('')}
        </div>
      </section>
    `;

    root.querySelector('#cal-prev')?.addEventListener('click', () => {
      viewMonth--;
      if (viewMonth < 0) {
        viewMonth = 11;
        viewYear--;
      }
      refreshActive();
    });
    root.querySelector('#cal-next')?.addEventListener('click', () => {
      viewMonth++;
      if (viewMonth > 11) {
        viewMonth = 0;
        viewYear++;
      }
      refreshActive();
    });
    root.querySelector('.cal-grid')?.addEventListener('click', (e) => {
      const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-date]');
      if (!cell) return;
      openDayDetail(cell.dataset.date as string);
    });
  }
};

function openDayDetail(iso: string) {
  const rec = getDay(iso);
  const mealNames = MEALS.flatMap((m) => m.options.filter((o) => rec.meals[o.id]).map((o) => `${m.name}: ${o.label}`));
  const exerciseNames = Object.entries(rec.exercisesDone).flatMap(([workoutId, ids]) => {
    const workout = getWorkoutById(workoutId);
    return ids.map((id) => `${workout?.title ?? workoutId}: ${EXERCISES[id]?.name ?? id}`);
  });

  let close: () => void;
  close = openModal(
    `
    <button class="modal-close" data-close aria-label="${t('common.close')}"></button>
    <h3>${iso}</h3>
    <div style="font-size:13px;color:var(--text-dim);margin-bottom:10px">${t('calendario.detailWater', { count: rec.water })}${rec.training?.done ? t('calendario.detailTraining', { modality: rec.training.modality === 'academia' ? t('common.academia') : t('common.casa') }) : ''}</div>
    ${mealNames.length ? `<p style="font-size:13px"><strong>${t('calendario.mealsTitle')}</strong><br>${mealNames.join('<br>')}</p>` : `<p style="font-size:13px;color:var(--text-faint)">${t('calendario.mealsEmpty')}</p>`}
    ${exerciseNames.length ? `<p style="font-size:13px"><strong>${t('calendario.exercisesTitle')}</strong><br>${exerciseNames.join('<br>')}</p>` : ''}
  `,
    (modal) => {
      modal.querySelector('[data-close]')?.addEventListener('click', () => close());
    }
  );
}
