import { openModal } from './modal';
import type { Exercise } from '../../data/types-training';
import { getExerciseLoads, logExerciseLoad, deleteExerciseLoad } from '../../lib/storage';
import type { ExerciseLogEntry } from '../../lib/storage';
import { todayISO } from '../../lib/dates';
import { drawLineChart } from './chart';
import { showToast } from './toast';
import { EXERCISE_DIAGRAMS } from '../../data/exerciseDiagrams';

export function openExerciseModal(ex: Exercise): void {
  const diagram = EXERCISE_DIAGRAMS[ex.id];
  openModal(
    `
    <button class="modal-close" data-close>✕</button>
    <h3>${ex.name}</h3>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">
      ${ex.muscles.map((m) => `<span class="pill">${m}</span>`).join('')}
      ${ex.gluteFocus ? '<span class="pill" style="color:var(--burgundy-glow)">🔥 Glúteos</span>' : ''}
    </div>
    ${
      diagram
        ? `<div style="border-radius:var(--radius-sm);overflow:hidden;border:1px solid var(--border)">${diagram}</div>
           <div style="font-size:10.5px;color:var(--text-faint);margin:6px 0 14px;text-align:center">Diagrama esquemático simplificado — a descrição abaixo é a referência principal.</div>`
        : ''
    }
    <p style="font-size:14px;line-height:1.6;color:var(--text)">${ex.desc}</p>
    <div class="alert" style="margin:14px 0 0">
      <span>💡</span><span>${ex.tip}</span>
    </div>

    <div class="sec-title" style="margin:18px -20px 0;border-radius:0">📈 Carga e progressão</div>
    <div id="load-compare"></div>
    <canvas id="load-chart" style="width:100%;display:none;margin-top:10px"></canvas>
    <div id="load-empty" class="empty" style="display:none">Regista pelo menos 2 vezes com carga para veres o gráfico de evolução 🌱</div>
    <div style="padding:12px 0 0;font-size:10.5px;color:var(--text-faint)">Preenche só o que fizer sentido: carga para exercícios de academia, repetições/duração/variação para calistenia.</div>
    <div class="form-row" style="padding:8px 0 0">
      <input class="finp" id="load-kg" type="number" step="0.5" min="0" placeholder="Carga (kg)" />
      <input class="finp" id="load-reps" type="number" step="1" min="0" placeholder="Reps" style="max-width:80px" />
    </div>
    <div class="form-row" style="padding-top:0">
      <input class="finp" id="load-seconds" type="number" step="5" min="0" placeholder="Duração (s)" style="max-width:110px" />
      <input class="finp" id="load-note" type="text" placeholder="Variação (ex: joelhos, elástico vermelho)" />
    </div>
    <div class="form-row" style="padding-top:0">
      <button class="btn block" id="load-save">+ Registar esta sessão</button>
    </div>
    <div id="load-log"></div>
  `,
    (modal) => {
      modal.querySelector('[data-close]')?.addEventListener('click', () => {
        modal.closest('.modal-backdrop')?.remove();
      });

      renderLoads(modal, ex.id);

      modal.querySelector('#load-save')?.addEventListener('click', () => {
        const kgInput = modal.querySelector('#load-kg') as HTMLInputElement;
        const repsInput = modal.querySelector('#load-reps') as HTMLInputElement;
        const secondsInput = modal.querySelector('#load-seconds') as HTMLInputElement;
        const noteInput = modal.querySelector('#load-note') as HTMLInputElement;
        const weightKg = kgInput.value ? parseFloat(kgInput.value) : undefined;
        const reps = repsInput.value ? parseInt(repsInput.value, 10) : undefined;
        const seconds = secondsInput.value ? parseInt(secondsInput.value, 10) : undefined;
        const note = noteInput.value.trim() || undefined;
        if (weightKg === undefined && reps === undefined && seconds === undefined && !note) return;
        logExerciseLoad(ex.id, { date: todayISO(), weightKg, reps, seconds, note });
        kgInput.value = '';
        repsInput.value = '';
        secondsInput.value = '';
        noteInput.value = '';
        showToast('Sessão registada 💪');
        renderLoads(modal, ex.id);
      });

      modal.querySelector('#load-log')?.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-del-load]');
        if (!btn) return;
        deleteExerciseLoad(ex.id, Number(btn.dataset.delLoad));
        renderLoads(modal, ex.id);
      });
    }
  );
}

function summarize(l: ExerciseLogEntry): string {
  return (
    [
      l.weightKg !== undefined ? `${l.weightKg} kg` : null,
      l.reps !== undefined ? `${l.reps} reps` : null,
      l.seconds !== undefined ? `${l.seconds}s` : null,
      l.note ?? null
    ]
      .filter(Boolean)
      .join(' · ') || '(sem detalhes)'
  );
}

function renderLoads(modal: HTMLElement, exerciseId: string): void {
  const loads = getExerciseLoads(exerciseId);
  const canvas = modal.querySelector('#load-chart') as HTMLCanvasElement;
  const empty = modal.querySelector('#load-empty') as HTMLElement;
  const withWeight = loads.filter((l) => l.weightKg !== undefined);

  if (withWeight.length >= 2) {
    canvas.style.display = 'block';
    empty.style.display = 'none';
    const points = [...withWeight].reverse().map((l) => ({ date: l.date, value: l.weightKg as number }));
    drawLineChart(canvas, points);
  } else {
    canvas.style.display = 'none';
    empty.style.display = loads.length > 0 ? 'block' : 'none';
  }

  // "Na semana passada fiz X, hoje fiz Y" — an explicit last-vs-latest
  // comparison, not just a flat list the user has to parse by eye.
  const compare = modal.querySelector('#load-compare') as HTMLElement;
  if (loads.length >= 2) {
    const [latest, previous] = loads;
    let delta = '';
    if (latest.weightKg !== undefined && previous.weightKg !== undefined) {
      const diff = +(latest.weightKg - previous.weightKg).toFixed(1);
      if (diff !== 0) delta = ` <span style="color:${diff > 0 ? 'var(--green)' : 'var(--burgundy-glow)'};font-weight:800">${diff > 0 ? '+' : ''}${diff}kg</span>`;
    } else if (latest.reps !== undefined && previous.reps !== undefined) {
      const diff = latest.reps - previous.reps;
      if (diff !== 0) delta = ` <span style="color:${diff > 0 ? 'var(--green)' : 'var(--burgundy-glow)'};font-weight:800">${diff > 0 ? '+' : ''}${diff} reps</span>`;
    } else if (latest.seconds !== undefined && previous.seconds !== undefined) {
      const diff = latest.seconds - previous.seconds;
      if (diff !== 0) delta = ` <span style="color:${diff > 0 ? 'var(--green)' : 'var(--burgundy-glow)'};font-weight:800">${diff > 0 ? '+' : ''}${diff}s</span>`;
    }
    compare.innerHTML = `
      <div class="alert" style="margin:10px 0">
        <span>📊</span>
        <span>Última vez (${previous.date}): <strong>${summarize(previous)}</strong> → Agora (${latest.date}): <strong>${summarize(latest)}</strong>${delta}</span>
      </div>`;
  } else {
    compare.innerHTML = '';
  }

  const log = modal.querySelector('#load-log') as HTMLElement;
  if (!loads.length) {
    log.innerHTML = '';
    return;
  }
  log.innerHTML = loads
    .slice(0, 8)
    .map(
      (l, i) => `
      <div class="log-item">
        <div class="log-txt"><strong>${summarize(l)}</strong><div class="log-date">${l.date}</div></div>
        <button class="log-del" data-del-load="${i}">✕</button>
      </div>`
    )
    .join('');
}
