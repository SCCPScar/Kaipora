import type { Tab } from '../nav';
import { todayISO, formatLong, greeting, WEEKDAY_KEYS, addDays, fromISO, toISO } from '../../lib/dates';
import { getTrainingDay } from '../../data/training';
import { MEALS, allMealOptions, combinedDayTotals } from '../../data/diet';
import { getHabits } from '../../data/habits';
import {
  getDay,
  getWater,
  setWater,
  setTrainingDone,
  toggleHabit,
  toggleRoutineItem,
  getFixedCommitments,
  getFlexibleActivities,
  getSettings,
  getMascotComeBackShownDate,
  setMascotComeBackShownDate,
  isMinDay,
  toggleMinDay,
  getSnoozedReminderDate,
  setSnoozedReminderDate,
  getWeeklyIntention,
  setWeeklyIntention,
  getCustomWorkouts
} from '../../lib/storage';
import type { BuiltInModality, Weekday } from '../../lib/types';
import { refreshActive, switchTab } from '../nav';
import { showToast } from '../components/toast';
import { isDayComplete } from '../../lib/dayCompletion';
import { computeDaySchedule } from '../../lib/routineSchedule';
import { escapeHtml } from '../../lib/sanitize';
import { essentialsCompletedFlags } from '../../lib/dayHistory';
import { shouldShowComeBack, shouldShowReminder, consecutiveDifficultDays, shouldUseAdaptiveTone } from '../../lib/mascotState';
import { MASCOT_IMAGES, MASCOT_LINES } from '../../data/mascot';
import { mascotCardHTML } from '../components/mascot';
import { openModal } from '../components/modal';
import { openBreathingModal } from '../components/timer';
import { startOfWeek } from '../../lib/dates';
import { t } from '../../i18n';

let modality: BuiltInModality = 'academia';
/** The date (YYYY-MM-DD) for which the completion celebration has already
 * played — so re-renders triggered by unrelated toggles (a meal checked,
 * water adjusted) don't replay it on every click once the day is done. */
let celebratedDate: string | null = null;

export const todayTab: Tab = {
  id: 'hoje',
  label: 'nav.tab.hoje',
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

    const glassGoal = Math.max(1, Math.round(settings.waterGoalMl / 250));
    const mlEach = Math.round(settings.waterGoalMl / glassGoal);

    const waterDone = day.water >= glassGoal;
    const trainingDone = Boolean(day.training?.done);
    const minDay = isMinDay(date);
    const essentialsDone = isDayComplete({
      waterGlasses: day.water,
      waterGoalGlasses: glassGoal,
      trainingDone,
      minDay
    });
    const justCelebrated = essentialsDone && celebratedDate !== date;
    if (essentialsDone) celebratedDate = date;

    const yesterday = toISO(addDays(fromISO(date), -1));
    const yesterdayFlags = essentialsCompletedFlags(yesterday, yesterday);
    const yesterdayDone = yesterdayFlags.length ? yesterdayFlags[0] : null;
    const showComeBack = shouldShowComeBack(yesterdayDone, getMascotComeBackShownDate() === date);
    if (showComeBack) setMascotComeBackShownDate(date);

    const recentFlags = essentialsCompletedFlags(toISO(addDays(fromISO(date), -5)), yesterday).reverse();
    const difficultStreak = consecutiveDifficultDays(recentFlags);
    const useAdaptiveTone = shouldUseAdaptiveTone(difficultStreak);

    const snoozedToday = getSnoozedReminderDate() === date;
    let reminderText: string | null = null;
    if (!essentialsDone && !snoozedToday) {
      const hour = now.getHours();
      if (shouldShowReminder(hour, trainingDone)) {
        reminderText = MASCOT_LINES.reminderTraining();
      } else if (shouldShowReminder(hour, waterDone)) {
        const remainingMl = Math.max(0, settings.waterGoalMl - day.water * mlEach);
        reminderText = MASCOT_LINES.reminderWater(remainingMl);
      }
    }

    const weekKey = toISO(startOfWeek(fromISO(date)));
    const weeklyIntention = getWeeklyIntention(weekKey);

    const exercisesDone = (day.exercisesDone[workout.id] ?? []).length;
    const mealsLogged = MEALS.filter((m) => allMealOptions(m.id).some((o) => day.meals[o.id])).length;
    const foodTotals = combinedDayTotals(date, day.meals);
    const customWorkouts = settings.useDefaultPlan ? [] : getCustomWorkouts();

    root.innerHTML = `
      <div class="ph">
        <h2>${greeting(now)}${settings.userName ? `, ${escapeHtml(settings.userName)}` : ''}</h2>
        <div class="ph-title">${t('today.title')}</div>
        <div class="ph-sub">${formatLong(now)}</div>
      </div>

      <div class="form-row" style="padding-top:0">
        <button class="btn ghost" id="breathe-open" type="button">${t('today.breatheButton')}</button>
      </div>

      ${showComeBack ? mascotCardHTML(useAdaptiveTone ? MASCOT_LINES.comeBackSoft() : MASCOT_LINES.comeBack(), MASCOT_IMAGES.comeBack) : ''}
      ${reminderText ? mascotCardHTML(reminderText, MASCOT_IMAGES.reminder, { dismissible: true }) : ''}
      ${essentialsDone ? completionBannerHTML(justCelebrated) : ''}

      <div class="priority-heading">${t('today.priority.essential')}</div>

      <div class="row" style="cursor:default">
        <div class="rtxt"><strong>${t('today.minDay.title')}</strong><small>${t('today.minDay.desc')}</small></div>
        <span class="switch"><input type="checkbox" id="min-day-toggle" ${minDay ? 'checked' : ''}/><span class="slider"></span></span>
      </div>

      <div class="wcard">
        <div class="wcard-top">
          <div class="wcard-lbl">${t('today.water.title')}</div>
          <div class="wcard-ml" id="wml">${t('today.water.progress', { current: day.water * mlEach, goal: settings.waterGoalMl })}</div>
        </div>
        <div class="glasses" id="glasses"></div>
        <div class="wbar"><div class="wbar-fill" style="width:${Math.min(100, (day.water / glassGoal) * 100)}%"></div></div>
        <div class="wbtns">
          <button class="wbtn" id="water-minus">${t('today.water.minus')}</button>
          <button class="wbtn" id="water-plus">${t('today.water.plus')}</button>
        </div>
      </div>

      <section id="training-card">
        ${
          settings.useDefaultPlan
            ? `
        <div class="sec-title">
          <span>${t('today.training.title')}</span>
          <span class="pill">${workout.focus}</span>
        </div>
        <div class="modality-switch">
          <button class="modality-btn ${modality === 'academia' ? 'active' : ''}" data-modality="academia">${t('common.academia')}</button>
          <button class="modality-btn ${modality === 'casa' ? 'active' : ''}" data-modality="casa">${t('common.casa')}</button>
        </div>
        <div class="row" id="training-open-row">
          <div class="rtxt"><strong>${workout.title}</strong><small>${t('today.training.exercisesDone', { done: exercisesDone, total: workout.exercises.length })}</small></div>
          <span class="badge-k">${t('today.training.open')}</span>
        </div>
        <div class="sub-row" style="justify-content:space-between">
          <label style="display:flex;align-items:center;gap:8px;margin:0;text-transform:none;font-size:12.5px;color:var(--text-dim)">
            <span class="switch"><input type="checkbox" id="training-done" ${day.training?.done ? 'checked' : ''}/><span class="slider"></span></span>
            ${t('today.training.markDone')}
          </label>
        </div>`
            : blankTrainingCardHTML(day, customWorkouts)
        }
      </section>

      <div class="priority-heading">${t('today.priority.important')}</div>

      <section>
        <div class="sec-title">${t('today.intention.title')}</div>
        <div class="row" id="intention-open-row">
          <div class="rtxt"><strong>${weeklyIntention ? escapeHtml(weeklyIntention) : t('today.intention.notSet')}</strong><small>${weeklyIntention ? t('today.intention.tapToEdit') : t('today.intention.tapToSet')}</small></div>
          <span class="badge-k">${weeklyIntention ? t('today.intention.editBadge') : t('today.intention.setBadge')}</span>
        </div>
      </section>

      <section>
        <div class="sec-title">${t('today.routine.title')}</div>
        <div id="routine-list"></div>
      </section>

      <div class="priority-heading">${t('today.priority.optional')}</div>

      <section id="meals-card">
        <div class="sec-title"><span>${t('common.nutrition')}</span><span class="macro-line">${foodTotals.kcal} kcal</span></div>
        <div class="row" id="meals-open-row">
          <div class="rtxt"><strong>${settings.useDefaultPlan ? t('today.meals.logged', { done: mealsLogged, total: MEALS.length }) : t('today.meals.loggedBlank')}</strong><small>${t('today.meals.tapOpen')}</small></div>
          <span class="macro-line">${t('today.meals.proteinAmount', { g: foodTotals.protein })}</span>
        </div>
      </section>

      <section>
        <div class="sec-title">${t('today.habits.title')}</div>
        <div id="habits-list"></div>
      </section>
    `;

    renderGlasses(root, day.water, glassGoal);
    renderRoutine(root, date, day, weekdayKey, settings.wakeTime, settings.sleepTime);
    renderHabits(root, date, day);
    wireEvents(root, date, glassGoal, workout, weekKey, weeklyIntention);
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
  const mascotSrc = `${import.meta.env.BASE_URL}${MASCOT_IMAGES.celebrate}`;
  return `
    <div class="day-complete-banner ${animate ? 'animate' : ''}">
      ${sparks}
      <img src="${mascotSrc}" alt="${t('mascot.name')}" width="40" style="height:auto;flex-shrink:0;filter:drop-shadow(0 2px 4px rgba(0,0,0,.25))" />
      <div>
        <strong>${t('today.completion.title')}</strong>
        <div style="font-weight:600;font-size:12px;opacity:.9;margin-top:2px">${t('today.completion.subtitle')}</div>
      </div>
    </div>`;
}

/** Training card content when Settings.useDefaultPlan is false — instead of
 * the fixed weekly plan, lists the user's own custom workouts (see
 * src/ui/tabs/training.ts) as pickable "did this today" rows, same
 * check-row pattern as habits/routine. Empty state points to the Training
 * tab to create the first one. */
function blankTrainingCardHTML(day: ReturnType<typeof getDay>, customWorkouts: ReturnType<typeof getCustomWorkouts>): string {
  if (!customWorkouts.length) {
    return `
      <div class="sec-title"><span>${t('today.training.title')}</span></div>
      <div class="empty">${t('today.training.blankEmpty')}</div>
      <div class="form-row" style="padding-top:0">
        <button class="btn ghost" id="training-blank-cta" type="button">${t('today.training.blankCta')}</button>
      </div>`;
  }
  return `
    <div class="sec-title"><span>${t('today.training.title')}</span></div>
    ${customWorkouts
      .map((cw) => {
        const isDone = day.training?.workoutId === cw.id && day.training?.done;
        return `
      <div class="row ${isDone ? 'done' : ''}" data-custom-workout="${cw.id}" data-custom-category="${escapeHtml(cw.category)}">
        <div class="chk"></div>
        <div class="rtxt"><strong>${escapeHtml(cw.title)}</strong><small>${escapeHtml(cw.focus)}</small></div>
      </div>`;
      })
      .join('')}`;
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
    el.innerHTML = `<div class="empty">${t('today.routine.empty')}</div>`;
    return;
  }

  el.innerHTML = blocks
    .map((b) => {
      if (b.kind === 'unscheduled') {
        return `
        <div class="row" style="cursor:default">
          <div class="rtxt"><strong>${escapeHtml(b.label)}</strong><small>${t('today.routine.noSpace', { min: b.durationMin })}</small></div>
        </div>`;
      }
      const h = (m: number) => `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;
      const isDone = day.routineDone.includes(b.id);
      return `
      <div class="row ${isDone ? 'done' : ''}" data-routine="${b.id}">
        <div class="chk"></div>
        <div class="rtxt"><strong>${escapeHtml(b.label)}</strong><small>${h(b.startMin)} – ${h(b.endMin)}</small></div>
      </div>`;
    })
    .join('');
}

function renderHabits(root: HTMLElement, date: string, day: ReturnType<typeof getDay>) {
  const el = root.querySelector('#habits-list') as HTMLElement;
  el.innerHTML = getHabits().map(
    (h) => `
    <div class="row ${day.habits[h.id] ? 'done' : ''}" data-habit="${h.id}">
      <div class="chk"></div>
      <div class="rtxt"><strong>${h.label}</strong></div>
    </div>`
  ).join('');
}

function wireEvents(
  root: HTMLElement,
  date: string,
  glassGoal: number,
  workout: ReturnType<typeof getTrainingDay>['academia'],
  weekKey: string,
  weeklyIntention: string
) {
  root.querySelector('#breathe-open')?.addEventListener('click', () => openBreathingModal());

  root.querySelector('#min-day-toggle')?.addEventListener('change', () => {
    toggleMinDay(date);
    refreshActive();
  });

  root.querySelector('[data-mascot-dismiss]')?.addEventListener('click', () => {
    setSnoozedReminderDate(date);
    refreshActive();
  });

  root.querySelector('#intention-open-row')?.addEventListener('click', () => {
    openIntentionModal(weeklyIntention, (text) => {
      setWeeklyIntention(weekKey, text);
      refreshActive();
    });
  });

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
  root.querySelector('#training-blank-cta')?.addEventListener('click', () => switchTab('treino'));
  root.querySelector('#meals-open-row')?.addEventListener('click', () => switchTab('dieta'));

  root.querySelector('#training-done')?.addEventListener('change', (e) => {
    const checked = (e.target as HTMLInputElement).checked;
    setTrainingDone(date, modality, workout.id, checked);
    if (checked) showToast(t('today.training.toast'));
    refreshActive();
  });

  root.querySelector('#training-card')?.addEventListener('click', (e) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>('[data-custom-workout]');
    if (!row) return;
    const workoutId = row.dataset.customWorkout as string;
    const category = row.dataset.customCategory as string;
    const alreadyDone = row.classList.contains('done');
    setTrainingDone(date, category, workoutId, !alreadyDone);
    if (!alreadyDone) showToast(t('today.training.toast'));
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
}

function openIntentionModal(current: string, onSave: (text: string) => void): void {
  const close = openModal(
    `
    <button class="modal-close" data-close aria-label="${t('common.close')}"></button>
    <h3>${t('today.intention.title')}</h3>
    <div class="form-row">
      <textarea class="finp" id="intention-text" rows="3" placeholder="${t('today.intention.placeholder')}" style="flex:1;resize:vertical;font-family:inherit">${escapeHtml(current)}</textarea>
    </div>
    <div class="form-row" style="padding-top:0">
      <button class="btn block" id="intention-save">${t('today.intention.save')}</button>
    </div>
  `,
    (modal) => {
      modal.querySelector('#intention-save')?.addEventListener('click', () => {
        const text = (modal.querySelector('#intention-text') as HTMLTextAreaElement).value.trim();
        onSave(text);
        close();
      });
      modal.querySelector('[data-close]')?.addEventListener('click', () => close());
    }
  );
}
