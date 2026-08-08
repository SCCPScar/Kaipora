import { openModal } from './modal';
import type { Exercise } from '../../data/types-training';

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
  `,
    (modal) => {
      modal.querySelector('[data-close]')?.addEventListener('click', () => {
        modal.closest('.modal-backdrop')?.remove();
      });
    }
  );
}
