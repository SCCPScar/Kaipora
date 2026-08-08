import type { Tab } from '../nav';
import { TRAINING_WEEK, getGluteWorkouts } from '../../data/training';
import { EXERCISES } from '../../data/exercises';
import type { Workout, TrainingDay } from '../../data/types-training';
import type { Modality } from '../../lib/types';
import { getDay, toggleExercise, setTrainingDone } from '../../lib/storage';
import { todayISO } from '../../lib/dates';
import { refreshActive } from '../nav';
import { openTimerModal } from '../components/timer';
import { openExerciseModal } from '../components/exerciseModal';
import { showToast } from '../components/toast';

const expanded = new Set<string>();
const modalityByDay: Record<string, Modality> = {};

function dayModality(weekday: string): Modality {
  return modalityByDay[weekday] ?? 'academia';
}

const PILL_COLORS: Record<string, string> = {
  seg: '#8b5cf6', ter: '#22d3ee', qua: '#d1275a', qui: '#e0a52c', sex: '#8b5cf6', sab: '#22d3ee', dom: '#6f6690'
};

export const trainingTab: Tab = {
  id: 'treino',
  label: 'Treino',
  icon: '💪',
  render(root: HTMLElement) {
    const date = todayISO();
    // Wrapped in a freshly-created child (rather than delegating straight on
    // `root`) because `root` itself is a persistent container reused across
    // renders — only its children are replaced each time. A listener
    // attached directly to `root` would never get cleaned up and would
    // stack on every re-render (every toggle/expand/complete action calls
    // refreshActive()), firing a single tap N times after N renders.
    root.innerHTML = `
      <div id="treino-content">
        <div class="ph">
          <h2>Treino</h2>
          <div class="ph-title">Academia + Casa</div>
          <div class="ph-sub">Toca no dia para abrir · ⏱ = descanso · ℹ️ = como fazer</div>
        </div>
        <div class="alert"><span>🌾</span><span>Cada dia tem sempre as duas versões — escolhe Academia ou Casa consoante o que fizeres.</span></div>
        <div id="week-days"></div>

        <section>
          <div class="sec-title"><span>🔥 Programa Intensivo de Glúteos</span></div>
          <div style="padding:12px 16px;font-size:12.5px;color:var(--text-dim);line-height:1.6">
            Trabalho dedicado a glúteo máximo e médio, distribuído ao longo da semana para evitar volume excessivo.
            Aparece nos dias de pernas (Qua, Qui, Sáb) — aqui tens a lista completa dos treinos que fazem parte do programa.
          </div>
          <div id="glute-list"></div>
        </section>
      </div>
    `;

    renderWeek(root, date);
    renderGluteList(root);
    wireEvents(root.querySelector('#treino-content') as HTMLElement, date);
  }
};

function renderWeek(root: HTMLElement, date: string) {
  const el = root.querySelector('#week-days') as HTMLElement;
  el.innerHTML = TRAINING_WEEK.map((day) => dayCardHTML(day, date)).join('');
}

function dayCardHTML(day: TrainingDay, date: string): string {
  const isOpen = expanded.has(day.weekday);
  const modality = dayModality(day.weekday);
  const workout = day[modality];
  const marker = getDay(date).training;
  const isTodayDone = marker?.workoutId === workout.id && marker.done;
  return `
    <div class="day-card ${isOpen ? 'open' : ''}" data-day="${day.weekday}">
      <div class="day-head" data-toggle="${day.weekday}">
        <div class="day-pill" style="background:${PILL_COLORS[day.weekday]}">${day.weekday.toUpperCase()}</div>
        <div class="day-info">
          <div class="day-nm">${day.label}${isTodayDone ? ' ✅' : ''}</div>
          <div class="day-focus">${workout.focus}</div>
        </div>
        <div class="icon-btn">${isOpen ? '−' : '+'}</div>
      </div>
      <div class="day-body">
        <div class="modality-switch">
          <button class="modality-btn ${modality === 'academia' ? 'active' : ''}" data-set-modality="${day.weekday}:academia">🏋️ Academia</button>
          <button class="modality-btn ${modality === 'casa' ? 'active' : ''}" data-set-modality="${day.weekday}:casa">🏠 Casa</button>
        </div>
        ${exerciseListHTML(workout, date)}
        <div class="sub-row" style="justify-content:flex-end">
          <button class="btn sm ${isTodayDone ? 'ghost' : ''}" data-complete="${day.weekday}:${workout.id}:${modality}">
            ${isTodayDone ? '✓ Treino concluído hoje' : 'Marcar como treino de hoje'}
          </button>
        </div>
      </div>
    </div>
  `;
}

function exerciseListHTML(workout: Workout, date: string): string {
  const doneList = getDay(date).exercisesDone[workout.id] ?? [];
  return workout.exercises
    .map((we) => {
      const ex = EXERCISES[we.exerciseId];
      if (!ex) return '';
      const isDone = doneList.includes(we.exerciseId);
      return `
      <div class="ex-row ${isDone ? 'done' : ''}" data-exercise="${we.exerciseId}">
        <div class="ex-main" data-select="${workout.id}:${we.exerciseId}">
          <strong>${ex.name}</strong>
          <small>${we.sets}x ${we.reps} · descanso ${we.restSeconds}s${we.note ? ' · ' + we.note : ''}</small>
          ${ex.gluteFocus ? '<span class="gluteo-tag">🔥 Glúteos</span>' : ''}
        </div>
        <div class="ex-actions">
          <button class="icon-btn" data-info="${we.exerciseId}" title="Como executar">ℹ️</button>
          <button class="icon-btn" data-timer="${we.restSeconds}" title="Temporizador">⏱</button>
        </div>
      </div>`;
    })
    .join('');
}

function renderGluteList(root: HTMLElement) {
  const el = root.querySelector('#glute-list') as HTMLElement;
  const workouts = getGluteWorkouts();
  el.innerHTML = workouts
    .map(
      (w) => `
    <div class="row" style="cursor:default">
      <div class="rtxt">
        <strong>${w.title}</strong>
        <small>${w.exercises.map((e) => EXERCISES[e.exerciseId]?.name).filter(Boolean).join(' · ')}</small>
      </div>
      <span class="pill">${w.location === 'academia' ? '🏋️' : '🏠'}</span>
    </div>`
    )
    .join('');
}

function wireEvents(root: HTMLElement, date: string) {
  root.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    const toggle = target.closest<HTMLElement>('[data-toggle]');
    if (toggle) {
      const key = toggle.dataset.toggle as string;
      if (expanded.has(key)) expanded.delete(key);
      else expanded.add(key);
      refreshActive();
      return;
    }

    const modBtn = target.closest<HTMLElement>('[data-set-modality]');
    if (modBtn) {
      const [weekday, modality] = (modBtn.dataset.setModality as string).split(':');
      modalityByDay[weekday] = modality as Modality;
      expanded.add(weekday);
      refreshActive();
      return;
    }

    const infoBtn = target.closest<HTMLElement>('[data-info]');
    if (infoBtn) {
      const ex = EXERCISES[infoBtn.dataset.info as string];
      if (ex) openExerciseModal(ex);
      return;
    }

    const timerBtn = target.closest<HTMLElement>('[data-timer]');
    if (timerBtn) {
      openTimerModal(Number(timerBtn.dataset.timer));
      return;
    }

    const selectArea = target.closest<HTMLElement>('[data-select]');
    if (selectArea) {
      const [workoutId, exerciseId] = (selectArea.dataset.select as string).split(':');
      toggleExercise(date, workoutId, exerciseId);
      refreshActive();
      return;
    }

    const completeBtn = target.closest<HTMLElement>('[data-complete]');
    if (completeBtn) {
      const [, workoutId, modality] = (completeBtn.dataset.complete as string).split(':');
      const marker = getDay(date).training;
      const alreadyDone = marker?.workoutId === workoutId && marker.done;
      setTrainingDone(date, modality as Modality, workoutId, !alreadyDone);
      if (!alreadyDone) showToast('Treino de hoje registado! 💪');
      refreshActive();
    }
  });
}
