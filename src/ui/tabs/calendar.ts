import type { Tab } from '../nav';
import { getDay, getSettings } from '../../lib/storage';
import { toISO, DAY_ABBR, MONTH_NAMES } from '../../lib/dates';
import { MEALS } from '../../data/diet';
import { getWorkoutById } from '../../data/training';
import { EXERCISES } from '../../data/exercises';
import { openModal } from '../components/modal';
import { refreshActive } from '../nav';

let viewYear = new Date().getFullYear();
let viewMonth = new Date().getMonth();

export const calendarTab: Tab = {
  id: 'calendario',
  label: 'Calendário',
  icon: '📅',
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
        <h2>Calendário</h2>
        <div class="ph-title">${MONTH_NAMES[viewMonth]} ${viewYear}</div>
        <div class="ph-sub">💧 água · 🥗 alimentação · 💪 treino</div>
      </div>
      <section>
        <div class="cal-head">
          <button class="cal-nav" id="cal-prev">‹</button>
          <span class="pill">${MONTH_NAMES[viewMonth]} de ${viewYear}</span>
          <button class="cal-nav" id="cal-next">›</button>
        </div>
        <div class="cal-grid">
          ${DAY_ABBR.map((a) => `<div class="cal-dow">${a}</div>`).join('')}
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

  openModal(
    `
    <button class="modal-close" data-close>✕</button>
    <h3>${iso}</h3>
    <div style="font-size:13px;color:var(--text-dim);margin-bottom:10px">💧 Água: ${rec.water} copo(s)${rec.training?.done ? ` · 💪 Treino: ${rec.training.modality === 'academia' ? 'Academia' : 'Casa'}` : ''}</div>
    ${mealNames.length ? `<p style="font-size:13px"><strong>Refeições:</strong><br>${mealNames.join('<br>')}</p>` : '<p style="font-size:13px;color:var(--text-faint)">Sem refeições registadas.</p>'}
    ${exerciseNames.length ? `<p style="font-size:13px"><strong>Exercícios:</strong><br>${exerciseNames.join('<br>')}</p>` : ''}
  `,
    (modal) => {
      modal.querySelector('[data-close]')?.addEventListener('click', () => {
        modal.closest('.modal-backdrop')?.remove();
      });
    }
  );
}
