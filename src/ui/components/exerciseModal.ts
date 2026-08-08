import { openModal } from './modal';
import type { Exercise } from '../../data/types-training';
import { getExerciseLoads, logExerciseLoad, deleteExerciseLoad } from '../../lib/storage';
import { todayISO } from '../../lib/dates';
import { drawLineChart } from './chart';
import { showToast } from './toast';

export function openExerciseModal(ex: Exercise): void {
  openModal(
    `
    <button class="modal-close" data-close>✕</button>
    <h3>${ex.name}</h3>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">
      ${ex.muscles.map((m) => `<span class="pill">${m}</span>`).join('')}
      ${ex.gluteFocus ? '<span class="pill" style="color:var(--burgundy-glow)">🔥 Glúteos</span>' : ''}
    </div>
    <p style="font-size:14px;line-height:1.6;color:var(--text)">${ex.desc}</p>
    <div class="alert" style="margin:14px 0 0">
      <span>💡</span><span>${ex.tip}</span>
    </div>

    <div class="sec-title" style="margin:18px -20px 0;border-radius:0">📈 Carga e progressão</div>
    <canvas id="load-chart" style="width:100%;display:none;margin-top:10px"></canvas>
    <div id="load-empty" class="empty" style="display:none">Regista pelo menos 2 cargas para veres a evolução 🌱</div>
    <div class="form-row" style="padding:12px 0 0">
      <input class="finp" id="load-kg" type="number" step="0.5" min="0" placeholder="Carga (kg)" />
      <input class="finp" id="load-reps" type="number" step="1" min="0" placeholder="Reps" style="max-width:90px" />
      <button class="fsave" id="load-save">+ Registar</button>
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
        const weightKg = kgInput.value ? parseFloat(kgInput.value) : undefined;
        const reps = repsInput.value ? parseInt(repsInput.value, 10) : undefined;
        if (weightKg === undefined && reps === undefined) return;
        logExerciseLoad(ex.id, { date: todayISO(), weightKg, reps });
        kgInput.value = '';
        repsInput.value = '';
        showToast('Carga registada 💪');
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

  const log = modal.querySelector('#load-log') as HTMLElement;
  if (!loads.length) {
    log.innerHTML = '';
    return;
  }
  log.innerHTML = loads
    .slice(0, 8)
    .map((l, i) => {
      const parts = [l.weightKg !== undefined ? `${l.weightKg} kg` : null, l.reps !== undefined ? `${l.reps} reps` : null]
        .filter(Boolean)
        .join(' · ');
      return `
      <div class="log-item">
        <div class="log-txt"><strong>${parts}</strong><div class="log-date">${l.date}</div></div>
        <button class="log-del" data-del-load="${i}">✕</button>
      </div>`;
    })
    .join('');
}
