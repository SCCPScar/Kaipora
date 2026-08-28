import type { Tab } from '../nav';
import { TRAINING_WEEK, getGluteWorkouts } from '../../data/training';
import { EXERCISES, getExerciseById } from '../../data/exercises';
import type { Workout, TrainingDay, CustomWorkout, WorkoutExercise } from '../../data/types-training';
import type { BuiltInModality } from '../../lib/types';
import {
  getDay,
  toggleExercise,
  setTrainingDone,
  getCustomExercises,
  addCustomExercise,
  deleteCustomExercise,
  getCustomWorkouts,
  addCustomWorkout,
  deleteCustomWorkout,
  addExerciseToCustomWorkout,
  removeExerciseFromCustomWorkout
} from '../../lib/storage';
import { todayISO } from '../../lib/dates';
import { refreshActive } from '../nav';
import { openTimerModal } from '../components/timer';
import { openExerciseModal } from '../components/exerciseModal';
import { showToast } from '../components/toast';
import { infoIcon, timerIcon } from '../components/icons';

const expanded = new Set<string>();
const modalityByDay: Record<string, BuiltInModality> = {};
let addingCustomWorkout = false;
let addingCustomExercise = false;
/** custom workout id currently showing its "add exercise" mini-form, or null. */
let addingExerciseToWorkout: string | null = null;

function dayModality(weekday: string): BuiltInModality {
  return modalityByDay[weekday] ?? 'academia';
}

const PILL_COLORS: Record<string, string> = {
  seg: 'var(--primary)',
  ter: 'var(--secondary)',
  qua: 'var(--accent)',
  qui: 'var(--gold)',
  sex: 'var(--primary)',
  sab: 'var(--secondary)',
  dom: 'var(--text-faint)'
};

export const trainingTab: Tab = {
  id: 'treino',
  label: 'Treino',
  icon: '',
  group: 'Corpo',
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
          <div class="ph-sub">Toca no dia para abrir · relógio = descanso · info = como fazer</div>
        </div>
        <div class="alert"><span>Cada dia tem sempre as duas versões — escolhe Academia ou Casa consoante o que fizeres.</span></div>
        <div id="week-days"></div>

        <section>
          <div class="sec-title"><span>Programa Intensivo de Glúteos</span></div>
          <div style="padding:12px 16px;font-size:12.5px;color:var(--text-dim);line-height:1.6">
            Trabalho dedicado a glúteo máximo e médio, distribuído ao longo da semana para evitar volume excessivo.
            Aparece nos dias de pernas (Qua, Qui, Sáb) — aqui tens a lista completa dos treinos que fazem parte do programa.
          </div>
          <div id="glute-list"></div>
        </section>

        <section>
          <div class="sec-title"><span>Os Meus Exercícios</span></div>
          <div style="padding:0 16px 8px;font-size:12.5px;color:var(--text-dim);line-height:1.6">
            Exercícios que a biblioteca não tem — ex. algo que o teu personal trainer te ensinou. Ficam disponíveis para qualquer treino teu.
          </div>
          <div id="custom-exercise-list"></div>
          <div id="custom-exercise-form"></div>
        </section>

        <section>
          <div class="sec-title"><span>Os Meus Treinos</span></div>
          <div style="padding:0 16px 8px;font-size:12.5px;color:var(--text-dim);line-height:1.6">
            Cria os teus próprios treinos — academia, casa, calistenia, personal trainer ou o que fizer sentido — sem mexer no plano acima.
          </div>
          <div id="custom-workout-list"></div>
          <div id="custom-workout-form"></div>
        </section>
      </div>
    `;

    renderWeek(root, date);
    renderGluteList(root);
    renderCustomExercises(root);
    renderCustomWorkouts(root, date);
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
          <div class="day-nm">${day.label}${isTodayDone ? '' : ''}</div>
          <div class="day-focus">${workout.focus}</div>
        </div>
        <div class="icon-btn">${isOpen ? '−' : '+'}</div>
      </div>
      <div class="day-body">
        <div class="modality-switch">
          <button class="modality-btn ${modality === 'academia' ? 'active' : ''}" data-set-modality="${day.weekday}:academia">Academia</button>
          <button class="modality-btn ${modality === 'casa' ? 'active' : ''}" data-set-modality="${day.weekday}:casa">Casa</button>
        </div>
        ${exerciseListHTML(workout, date)}
        <div class="sub-row" style="justify-content:flex-end">
          <button class="btn sm ${isTodayDone ? 'ghost' : ''}" data-complete="${day.weekday}:${workout.id}:${modality}">
            ${isTodayDone ? 'Treino concluído hoje' : 'Marcar como treino de hoje'}
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
          ${ex.gluteFocus ? '<span class="gluteo-tag">Glúteos</span>' : ''}
        </div>
        <div class="ex-actions">
          <button class="icon-btn" data-info="${we.exerciseId}" title="Como executar">${infoIcon()}</button>
          <button class="icon-btn" data-timer="${we.restSeconds}" title="Temporizador">${timerIcon()}</button>
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
      <span class="pill">${w.location === 'academia' ? 'Academia' : 'Casa'}</span>
    </div>`
    )
    .join('');
}

function renderCustomExercises(root: HTMLElement) {
  const listEl = root.querySelector('#custom-exercise-list') as HTMLElement;
  const custom = getCustomExercises();
  listEl.innerHTML = custom.length
    ? custom
        .map(
          (ex, i) => `
      <div class="log-item">
        <div class="log-txt">
          <strong>${ex.name}</strong>
          <div class="log-date">${[ex.muscles.join(', '), ex.desc].filter(Boolean).join(' · ') || 'Sem detalhes adicionais'}</div>
        </div>
        <button class="log-del" data-del-exercise="${i}">✕</button>
      </div>`
        )
        .join('')
    : '<div class="empty">Ainda sem exercícios personalizados</div>';

  const formEl = root.querySelector('#custom-exercise-form') as HTMLElement;
  formEl.innerHTML = addingCustomExercise
    ? `
    <div class="form-row">
      <input class="finp" id="cex-name" type="text" placeholder="Nome do exercício" style="flex:2" />
      <input class="finp" id="cex-muscles" type="text" placeholder="Músculos (ex: Glúteos, Core)" style="flex:2" />
    </div>
    <div class="form-row" style="padding-top:0">
      <input class="finp" id="cex-desc" type="text" placeholder="Como executar (opcional)" style="flex:1" />
    </div>
    <div class="form-row" style="padding-top:0">
      <input class="finp" id="cex-tip" type="text" placeholder="Dica (opcional)" style="flex:1" />
    </div>
    <div class="form-row" style="padding-top:0">
      <button class="btn block" id="cex-save">Guardar exercício</button>
    </div>`
    : `<div class="form-row" style="padding-top:0"><button class="btn block" id="cex-toggle">+ Novo exercício</button></div>`;
}

function exerciseOptionsHTML(): string {
  const builtIn = Object.values(EXERCISES).sort((a, b) => a.name.localeCompare(b.name));
  const custom = getCustomExercises();
  return `
    <optgroup label="Biblioteca">
      ${builtIn.map((ex) => `<option value="${ex.id}">${ex.name}</option>`).join('')}
    </optgroup>
    ${
      custom.length
        ? `<optgroup label="Meus exercícios">${custom.map((ex) => `<option value="${ex.id}">${ex.name}</option>`).join('')}</optgroup>`
        : ''
    }
  `;
}

function customWorkoutExerciseListHTML(workout: CustomWorkout, date: string): string {
  const doneList = getDay(date).exercisesDone[workout.id] ?? [];
  return workout.exercises
    .map((we, idx) => {
      const ex = getExerciseById(we.exerciseId);
      if (!ex) return '';
      const isDone = doneList.includes(we.exerciseId);
      return `
      <div class="ex-row ${isDone ? 'done' : ''}" data-exercise="${we.exerciseId}">
        <div class="ex-main" data-select="${workout.id}:${we.exerciseId}">
          <strong>${ex.name}</strong>
          <small>${we.sets}x ${we.reps} · descanso ${we.restSeconds}s${we.note ? ' · ' + we.note : ''}</small>
          ${ex.gluteFocus ? '<span class="gluteo-tag">Glúteos</span>' : ''}
        </div>
        <div class="ex-actions">
          <button class="icon-btn" data-info="${we.exerciseId}" title="Como executar">${infoIcon()}</button>
          <button class="icon-btn" data-timer="${we.restSeconds}" title="Temporizador">${timerIcon()}</button>
          <button class="log-del" data-remove-exercise="${workout.id}:${idx}">✕</button>
        </div>
      </div>`;
    })
    .join('');
}

function renderCustomWorkouts(root: HTMLElement, date: string) {
  const listEl = root.querySelector('#custom-workout-list') as HTMLElement;
  const workouts = getCustomWorkouts();
  const marker = getDay(date).training;

  listEl.innerHTML = workouts.length
    ? workouts
        .map((w, i) => {
          const isTodayDone = marker?.workoutId === w.id && marker.done;
          const isAddingExercise = addingExerciseToWorkout === w.id;
          return `
      <div class="day-card open">
        <div class="day-head" style="cursor:default">
          <div class="day-pill" style="background:var(--accent)">${w.category.slice(0, 3).toUpperCase()}</div>
          <div class="day-info">
            <div class="day-nm">${w.title}</div>
            <div class="day-focus">${w.focus || w.category}</div>
          </div>
          <button class="log-del" data-del-workout="${i}">✕</button>
        </div>
        <div class="day-body">
          ${customWorkoutExerciseListHTML(w, date) || '<div class="empty">Ainda sem exercícios neste treino</div>'}
          ${
            isAddingExercise
              ? `
          <div class="form-row" style="flex-wrap:wrap">
            <select class="finp" id="new-ex-select-${w.id}" style="flex:2;min-width:160px">${exerciseOptionsHTML()}</select>
          </div>
          <div class="form-row" style="padding-top:0;flex-wrap:wrap">
            <input class="finp" id="new-ex-sets-${w.id}" type="number" min="1" placeholder="séries" value="3" style="flex:1;min-width:70px" />
            <input class="finp" id="new-ex-reps-${w.id}" type="text" placeholder="reps (ex: 12)" value="12" style="flex:1;min-width:70px" />
            <input class="finp" id="new-ex-rest-${w.id}" type="number" min="0" placeholder="descanso s" value="60" style="flex:1;min-width:80px" />
          </div>
          <div class="form-row" style="padding-top:0">
            <button class="btn block" data-save-exercise="${w.id}">Adicionar ao treino</button>
          </div>`
              : `<div class="form-row" style="padding-top:0"><button class="btn block" data-toggle-add-exercise="${w.id}">+ Adicionar exercício</button></div>`
          }
          <div class="sub-row" style="justify-content:flex-end">
            <button class="btn sm ${isTodayDone ? 'ghost' : ''}" data-complete-custom="${w.id}" data-category="${w.category}">
              ${isTodayDone ? 'Treino concluído hoje' : 'Marcar como treino de hoje'}
            </button>
          </div>
        </div>
      </div>`;
        })
        .join('')
    : '<div class="empty">Ainda sem treinos personalizados</div>';

  const formEl = root.querySelector('#custom-workout-form') as HTMLElement;
  formEl.innerHTML = addingCustomWorkout
    ? `
    <div class="form-row">
      <input class="finp" id="cw-title" type="text" placeholder="Nome do treino" style="flex:2" />
      <input class="finp" id="cw-category" type="text" list="cw-category-suggestions" placeholder="Categoria (ex: Calistenia)" style="flex:1;min-width:140px" />
      <datalist id="cw-category-suggestions">
        <option value="Academia"></option>
        <option value="Casa"></option>
        <option value="Calistenia"></option>
        <option value="Personal Trainer"></option>
      </datalist>
    </div>
    <div class="form-row" style="padding-top:0">
      <input class="finp" id="cw-focus" type="text" placeholder="Foco (ex: Peito e Costas)" style="flex:1" />
    </div>
    <div class="form-row" style="padding-top:0">
      <button class="btn block" id="cw-save">Guardar treino</button>
    </div>`
    : `<div class="form-row" style="padding-top:0"><button class="btn block" id="cw-toggle">+ Criar treino</button></div>`;
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
      modalityByDay[weekday] = modality as BuiltInModality;
      expanded.add(weekday);
      refreshActive();
      return;
    }

    const infoBtn = target.closest<HTMLElement>('[data-info]');
    if (infoBtn) {
      const ex = getExerciseById(infoBtn.dataset.info as string);
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
      setTrainingDone(date, modality, workoutId, !alreadyDone);
      if (!alreadyDone) showToast('Treino de hoje registado!');
      refreshActive();
      return;
    }

    const completeCustomBtn = target.closest<HTMLElement>('[data-complete-custom]');
    if (completeCustomBtn) {
      const workoutId = completeCustomBtn.dataset.completeCustom as string;
      const category = completeCustomBtn.dataset.category as string;
      const marker = getDay(date).training;
      const alreadyDone = marker?.workoutId === workoutId && marker.done;
      setTrainingDone(date, category, workoutId, !alreadyDone);
      if (!alreadyDone) showToast('Treino de hoje registado!');
      refreshActive();
      return;
    }

    const delExerciseBtn = target.closest<HTMLElement>('[data-del-exercise]');
    if (delExerciseBtn) {
      if (!confirm('Remover este exercício personalizado?')) return;
      deleteCustomExercise(Number(delExerciseBtn.dataset.delExercise));
      refreshActive();
      return;
    }

    const cexToggle = target.closest<HTMLElement>('#cex-toggle');
    if (cexToggle) {
      addingCustomExercise = true;
      refreshActive();
      return;
    }

    const cexSave = target.closest<HTMLElement>('#cex-save');
    if (cexSave) {
      const name = (root.querySelector('#cex-name') as HTMLInputElement).value.trim();
      const musclesRaw = (root.querySelector('#cex-muscles') as HTMLInputElement).value.trim();
      const desc = (root.querySelector('#cex-desc') as HTMLInputElement).value.trim();
      const tip = (root.querySelector('#cex-tip') as HTMLInputElement).value.trim();
      if (!name) {
        showToast('Preenche pelo menos o nome');
        return;
      }
      const muscles = musclesRaw
        ? musclesRaw.split(',').map((m) => m.trim()).filter(Boolean)
        : [];
      addCustomExercise({ id: `cex_${Date.now()}`, name, muscles, gluteFocus: false, desc, tip });
      addingCustomExercise = false;
      showToast('Exercício adicionado');
      refreshActive();
      return;
    }

    const delWorkoutBtn = target.closest<HTMLElement>('[data-del-workout]');
    if (delWorkoutBtn) {
      if (!confirm('Remover este treino?')) return;
      deleteCustomWorkout(Number(delWorkoutBtn.dataset.delWorkout));
      refreshActive();
      return;
    }

    const cwToggle = target.closest<HTMLElement>('#cw-toggle');
    if (cwToggle) {
      addingCustomWorkout = true;
      refreshActive();
      return;
    }

    const cwSave = target.closest<HTMLElement>('#cw-save');
    if (cwSave) {
      const title = (root.querySelector('#cw-title') as HTMLInputElement).value.trim();
      const category = (root.querySelector('#cw-category') as HTMLInputElement).value.trim();
      const focus = (root.querySelector('#cw-focus') as HTMLInputElement).value.trim();
      if (!title || !category) {
        showToast('Preenche pelo menos o nome e a categoria');
        return;
      }
      addCustomWorkout({ id: `cw_${Date.now()}`, title, category, focus, exercises: [] });
      addingCustomWorkout = false;
      showToast('Treino criado — adiciona exercícios abaixo');
      refreshActive();
      return;
    }

    const toggleAddExBtn = target.closest<HTMLElement>('[data-toggle-add-exercise]');
    if (toggleAddExBtn) {
      const workoutId = toggleAddExBtn.dataset.toggleAddExercise as string;
      addingExerciseToWorkout = addingExerciseToWorkout === workoutId ? null : workoutId;
      refreshActive();
      return;
    }

    const saveExBtn = target.closest<HTMLElement>('[data-save-exercise]');
    if (saveExBtn) {
      const workoutId = saveExBtn.dataset.saveExercise as string;
      const select = root.querySelector(`#new-ex-select-${workoutId}`) as HTMLSelectElement;
      const setsInput = root.querySelector(`#new-ex-sets-${workoutId}`) as HTMLInputElement;
      const repsInput = root.querySelector(`#new-ex-reps-${workoutId}`) as HTMLInputElement;
      const restInput = root.querySelector(`#new-ex-rest-${workoutId}`) as HTMLInputElement;
      const exerciseId = select.value;
      const sets = Number(setsInput.value) || 1;
      const reps = repsInput.value.trim() || '12';
      const restSeconds = Number(restInput.value) || 0;
      if (!exerciseId) {
        showToast('Escolhe um exercício');
        return;
      }
      const entry: WorkoutExercise = { exerciseId, sets, reps, restSeconds };
      addExerciseToCustomWorkout(workoutId, entry);
      addingExerciseToWorkout = null;
      showToast('Exercício adicionado ao treino');
      refreshActive();
      return;
    }

    const removeExBtn = target.closest<HTMLElement>('[data-remove-exercise]');
    if (removeExBtn) {
      const [workoutId, idx] = (removeExBtn.dataset.removeExercise as string).split(':');
      if (!confirm('Remover este exercício do treino?')) return;
      removeExerciseFromCustomWorkout(workoutId, Number(idx));
      refreshActive();
    }
  });
}
