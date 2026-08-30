import type { Tab } from '../nav';
import { todayISO, formatLong, greeting, WEEKDAY_KEYS } from '../../lib/dates';
import { getTrainingDay } from '../../data/training';
import { MEALS, allMealOptions, combinedDayTotals } from '../../data/diet';
import { HABITS } from '../../data/habits';
import {
  getDay,
  getWater,
  setWater,
  setTrainingDone,
  toggleHabit,
  toggleRoutineItem,
  getFixedCommitments,
  getFlexibleActivities,
  getSettings
} from '../../lib/storage';
import type { BuiltInModality, Weekday } from '../../lib/types';
import { refreshActive, switchTab } from '../nav';
import { showToast } from '../components/toast';
import { isDayComplete } from '../../lib/dayCompletion';
import { computeDaySchedule } from '../../lib/routineSchedule';

let modality: BuiltInModality = 'academia';
/** The date (YYYY-MM-DD) for which the completion celebration has already
 * played — so re-renders triggered by unrelated toggles (a meal checked,
 * water adjusted) don't replay it on every click once the day is done. */
let celebratedDate: string | null = null;

function computeProgress(date: string): { done: number; total: number } {
  const day = getDay(date);
  const settings = getSettings();
  const glassGoal = Math.max(1, Math.round(settings.waterGoalMl / 250));
  let done = 0;
  let total = 0;

  total += MEALS.length;
  done += MEALS.filter((m) => m.options.some((o) => day.meals[o.id])).length;

  total += 1;
  if (day.water >= glassGoal) done += 1;

  total += 1;
  if (day.training?.done) done += 1;

  total += HABITS.length;
  done += HABITS.filter((h) => day.habits[h.id]).length;

  return { done, total };
}

export const todayTab: Tab = {
  id: 'hoje',
  label: 'Hoje',
  icon: '',
  group: 'Início',
  render(root: HTMLElement) {
    const date = todayISO();
    const settings = getSettings();
    const day = getDay(date);
    const now = new Date();
    const weekdayKey = WEEKDAY_KEYS[now.getDay()] as ReturnType<typeof getTrainingDay>['weekday'];
    const trainingDay = getTrainingDay(weekdayKey);
    const workout = trainingDay[modality];

    const { done, total } = computeProgress(date);
    const pct = total ? Math.round((done / total) * 100) : 0;
    const RING_C = 2 * Math.PI * 32;
    const offset = RING_C - (pct / 100) * RING_C;

    const glassGoal = Math.max(1, Math.round(settings.waterGoalMl / 250));
    const mlEach = Math.round(settings.waterGoalMl / glassGoal);

    const essentialsDone = isDayComplete({
      waterGlasses: day.water,
      waterGoalGlasses: glassGoal,
      trainingDone: Boolean(day.training?.done)
    });
    const justCelebrated = essentialsDone && celebratedDate !== date;
    if (essentialsDone) celebratedDate = date;

    const exercisesDone = (day.exercisesDone[workout.id] ?? []).length;
    const mealsLogged = MEALS.filter((m) => allMealOptions(m.id).some((o) => day.meals[o.id])).length;
    const foodTotals = combinedDayTotals(date, day.meals);

    root.innerHTML = `
      <div class="ph">
        <h2>${greeting(now)}, Scarllett</h2>
        <div class="ph-title">Hoje</div>
        <div class="ph-sub">${formatLong(now)}</div>
      </div>

      <div class="hero">
        <div class="hero-row">
          <div class="ring-wrap">
            <svg width="72" height="72" viewBox="0 0 72 72">
              <defs><linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" style="stop-color:var(--primary)"/><stop offset="1" style="stop-color:var(--secondary)"/>
              </linearGradient></defs>
              <circle class="ring-bg" cx="36" cy="36" r="32"/>
              <circle class="ring-fg" cx="36" cy="36" r="32" stroke-dasharray="${RING_C}" stroke-dashoffset="${offset}"/>
            </svg>
            <div class="ring-pct">${pct}%</div>
          </div>
          <div class="hero-txt">
            <strong>Progresso do dia</strong>
            <span>${done} de ${total} itens concluídos</span>
            <span>Foco: recomposição corporal, não só a balança</span>
          </div>
        </div>
      </div>

      ${essentialsDone ? completionBannerHTML(justCelebrated) : ''}

      <div class="priority-heading">Essencial</div>

      <div class="wcard">
        <div class="wcard-top">
          <div class="wcard-lbl">Água de hoje</div>
          <div class="wcard-ml" id="wml">${day.water * mlEach} / ${settings.waterGoalMl} ml</div>
        </div>
        <div class="glasses" id="glasses"></div>
        <div class="wbar"><div class="wbar-fill" style="width:${Math.min(100, (day.water / glassGoal) * 100)}%"></div></div>
        <div class="wbtns">
          <button class="wbtn" id="water-minus">− Copo</button>
          <button class="wbtn" id="water-plus">+ Copo</button>
        </div>
      </div>

      <section id="training-card">
        <div class="sec-title">
          <span>Treino de hoje</span>
          <span class="pill">${workout.focus}</span>
        </div>
        <div class="modality-switch">
          <button class="modality-btn ${modality === 'academia' ? 'active' : ''}" data-modality="academia">Academia</button>
          <button class="modality-btn ${modality === 'casa' ? 'active' : ''}" data-modality="casa">Casa</button>
        </div>
        <div class="row" id="training-open-row">
          <div class="rtxt"><strong>${workout.title}</strong><small>${exercisesDone} de ${workout.exercises.length} exercícios feitos</small></div>
          <span class="badge-k">Abrir</span>
        </div>
        <div class="sub-row" style="justify-content:space-between">
          <label style="display:flex;align-items:center;gap:8px;margin:0;text-transform:none;font-size:12.5px;color:var(--text-dim)">
            <span class="switch"><input type="checkbox" id="training-done" ${day.training?.done ? 'checked' : ''}/><span class="slider"></span></span>
            Marcar treino de hoje como concluído
          </label>
        </div>
      </section>

      <div class="priority-heading">Importante</div>

      <section>
        <div class="sec-title">Rotina de hoje</div>
        <div id="routine-list"></div>
      </section>

      <div class="priority-heading">Opcional</div>

      <section id="meals-card">
        <div class="sec-title"><span>Alimentação</span><span class="badge-k">${foodTotals.kcal} kcal</span></div>
        <div class="row" id="meals-open-row">
          <div class="rtxt"><strong>${mealsLogged} de ${MEALS.length} refeições registadas</strong><small>Toca para abrir o plano completo</small></div>
          <span class="badge-p">${foodTotals.protein}g prot</span>
        </div>
      </section>

      <section>
        <div class="sec-title">Hábitos de hoje</div>
        <div id="habits-list"></div>
      </section>
    `;

    renderGlasses(root, day.water, glassGoal);
    renderRoutine(root, date, day, weekdayKey, settings.wakeTime, settings.sleepTime);
    renderHabits(root, date, day);
    wireEvents(root, date, glassGoal, workout);
  }
};

/** 6 small dots bursting outward briefly on the first render after the
 * essentials flip to done — sober, short, respects prefers-reduced-motion
 * (globally disabled via the app-wide media query in style.css). */
function completionBannerHTML(animate: boolean): string {
  const sparks = animate
    ? Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const dx = Math.round(Math.cos(angle) * 46);
        const dy = Math.round(Math.sin(angle) * 46);
        return `<span class="spark" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${i * 30}ms"></span>`;
      }).join('')
    : '';
  return `
    <div class="day-complete-banner ${animate ? 'animate' : ''}">
      ${sparks}
      <div>
        <strong>Essenciais de hoje concluídos.</strong>
        <div style="font-weight:600;font-size:12px;opacity:.9;margin-top:2px">O resto do dia é bónus. Consistência é mais importante que perfeição.</div>
      </div>
    </div>`;
}

function renderGlasses(root: HTMLElement, water: number, goal: number) {
  const el = root.querySelector('#glasses') as HTMLElement;
  let html = '';
  for (let i = 0; i < goal; i++) {
    html += `<div class="glass ${i < water ? 'full' : ''}" data-glass="${i}"></div>`;
  }
  el.innerHTML = html;
}

function renderRoutine(root: HTMLElement, date: string, day: ReturnType<typeof getDay>, weekday: Weekday, wake: string, sleep: string) {
  const el = root.querySelector('#routine-list') as HTMLElement;
  const fixed = getFixedCommitments().filter((f) => f.days.includes(weekday));
  const flexible = getFlexibleActivities().filter((f) => f.days.includes(weekday));
  const blocks = computeDaySchedule(fixed, flexible, wake, sleep);

  if (!blocks.length) {
    el.innerHTML = '<div class="empty">Sem rotina configurada para hoje. Define-a na aba Rotina</div>';
    return;
  }

  el.innerHTML = blocks
    .map((b) => {
      if (b.kind === 'unscheduled') {
        return `
        <div class="row" style="cursor:default">
          <div class="rtxt"><strong>${b.label}</strong><small>Sem espaço hoje (${b.durationMin} min), considera adiar</small></div>
        </div>`;
      }
      const h = (m: number) => `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;
      const isDone = day.routineDone.includes(b.id);
      return `
      <div class="row ${isDone ? 'done' : ''}" data-routine="${b.id}">
        <div class="chk"></div>
        <div class="rtxt"><strong>${b.label}</strong><small>${h(b.startMin)} – ${h(b.endMin)}</small></div>
      </div>`;
    })
    .join('');
}

function renderHabits(root: HTMLElement, date: string, day: ReturnType<typeof getDay>) {
  const el = root.querySelector('#habits-list') as HTMLElement;
  el.innerHTML = HABITS.map(
    (h) => `
    <div class="row ${day.habits[h.id] ? 'done' : ''}" data-habit="${h.id}">
      <div class="chk"></div>
      <div class="rtxt"><strong>${h.label}</strong></div>
    </div>`
  ).join('');
}

function wireEvents(root: HTMLElement, date: string, glassGoal: number, workout: ReturnType<typeof getTrainingDay>['academia']) {
  root.querySelector('#water-plus')?.addEventListener('click', () => {
    const cur = getWater(date);
    if (cur < glassGoal + 4) setWater(date, cur + 1);
    refreshActive();
  });
  root.querySelector('#water-minus')?.addEventListener('click', () => {
    const cur = getWater(date);
    if (cur > 0) setWater(date, cur - 1);
    refreshActive();
  });
  root.querySelector('#glasses')?.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-glass]');
    if (!target) return;
    const idx = Number(target.dataset.glass);
    const cur = getWater(date);
    setWater(date, idx < cur ? idx : idx + 1);
    refreshActive();
  });

  root.querySelectorAll('.modality-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      modality = (btn as HTMLElement).dataset.modality as BuiltInModality;
      refreshActive();
    });
  });

  root.querySelector('#training-open-row')?.addEventListener('click', () => switchTab('treino'));
  root.querySelector('#meals-open-row')?.addEventListener('click', () => switchTab('dieta'));

  root.querySelector('#training-done')?.addEventListener('change', (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    setTrainingDone(date, modality, workout.id, checked);
    if (checked) showToast('Treino de hoje registado!');
    refreshActive();
  });

  root.querySelector('#habits-list')?.addEventListener('click', (e) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>('[data-habit]');
    if (!row) return;
    toggleHabit(date, row.dataset.habit as string);
    refreshActive();
  });

  root.querySelector('#routine-list')?.addEventListener('click', (e) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>('[data-routine]');
    if (!row) return;
    toggleRoutineItem(date, row.dataset.routine as string);
    refreshActive();
  });

  // shortcut: tapping the hero opens Progresso for quick weight entry
  root.querySelector('.hero')?.addEventListener('click', () => switchTab('progresso'));
}
