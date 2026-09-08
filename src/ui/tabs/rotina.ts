import type { Tab } from '../nav';
import { WEEKDAY_KEYS } from '../../lib/dates';
import {
  getFixedCommitments,
  addFixedCommitment,
  deleteFixedCommitment,
  getFlexibleActivities,
  addFlexibleActivity,
  deleteFlexibleActivity,
  getSettings,
  saveSettings
} from '../../lib/storage';
import type { Weekday } from '../../lib/types';
import { computeDaySchedule } from '../../lib/routineSchedule';
import type { ScheduleBlock } from '../../data/types-routine';
import { refreshActive } from '../nav';
import { showToast } from '../components/toast';
import { escapeHtml } from '../../lib/sanitize';

const WEEKDAYS: Weekday[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
const WEEKDAY_LABELS: Record<Weekday, string> = {
  seg: 'Segunda',
  ter: 'Terça',
  qua: 'Quarta',
  qui: 'Quinta',
  sex: 'Sexta',
  sab: 'Sábado',
  dom: 'Domingo'
};

function todayWeekday(): Weekday {
  const key = WEEKDAY_KEYS[new Date().getDay()];
  return (key === 'dom' ? 'dom' : (key as Weekday)) as Weekday;
}

let selectedDay: Weekday = todayWeekday();
type CommitmentType = 'fixed' | 'flexible';
let commitmentType: CommitmentType = 'fixed';

function minToHHMM(min: number): string {
  const h = Math.floor(min / 60)
    .toString()
    .padStart(2, '0');
  const m = (min % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

function timeToMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export const rotinaTab: Tab = {
  id: 'rotina',
  label: 'Rotina',
  icon: '',
  group: 'Início',
  render(root: HTMLElement) {
    const settings = getSettings();
    const fixed = getFixedCommitments();
    const flexible = getFlexibleActivities();

    root.innerHTML = `
      <div class="ph">
        <h2>Rotina</h2>
        <div class="ph-title">A tua semana</div>
        <div class="ph-sub">Compromissos fixos e atividades flexíveis, organizados por ti</div>
      </div>

      <section>
        <div class="sec-title">Janela do dia</div>
        <div class="meds-grid">
          <div><label>Acordar</label><input class="finp" id="wake-time" type="time" value="${settings.wakeTime}" /></div>
          <div><label>Dormir</label><input class="finp" id="sleep-time" type="time" value="${settings.sleepTime}" /></div>
        </div>
      </section>

      <div class="modality-switch" id="day-picker" style="flex-wrap:wrap;gap:6px">
        ${WEEKDAYS.map((d) => `<button class="modality-btn ${d === selectedDay ? 'active' : ''}" data-day="${d}" style="flex:0 0 auto;padding:8px 12px">${WEEKDAY_LABELS[d].slice(0, 3)}</button>`).join('')}
      </div>

      <section>
        <div class="sec-title">Agenda de ${WEEKDAY_LABELS[selectedDay]}</div>
        <div id="agenda-list"></div>
      </section>

      <section>
        <div class="sec-title">Compromissos fixos</div>
        <div id="fixed-list"></div>
      </section>

      <section>
        <div class="sec-title">Atividades flexíveis</div>
        <div id="flexible-list"></div>
      </section>

      <section>
        <div class="sec-title">Adicionar à rotina</div>
        <div class="modality-switch">
          <button class="modality-btn ${commitmentType === 'fixed' ? 'active' : ''}" data-commitment-type="fixed">Fixo</button>
          <button class="modality-btn ${commitmentType === 'flexible' ? 'active' : ''}" data-commitment-type="flexible">Flexível</button>
        </div>
        <div class="form-row">
          <input class="finp" id="cm-label" type="text" placeholder="${commitmentType === 'fixed' ? 'Ex: Trabalho' : 'Ex: Programação'}" style="flex:1" />
        </div>
        ${
          commitmentType === 'fixed'
            ? `<div class="meds-grid" style="padding-top:0">
                <div><label>Início</label><input class="finp" id="cm-start" type="time" /></div>
                <div><label>Fim</label><input class="finp" id="cm-end" type="time" /></div>
              </div>`
            : `<div class="form-row" style="padding-top:0">
                <input class="finp" id="cm-duration" type="number" min="5" step="5" placeholder="Duração em minutos" style="flex:1" />
              </div>`
        }
        <div class="form-row" style="padding-top:0;flex-wrap:wrap">
          ${WEEKDAYS.map((d) => `<label class="pill" style="cursor:pointer"><input type="checkbox" class="cm-day" value="${d}" style="margin-right:4px" />${WEEKDAY_LABELS[d].slice(0, 3)}</label>`).join('')}
        </div>
        <div class="form-row" style="padding-top:0">
          <button class="btn block" id="cm-add">+ Adicionar ${commitmentType === 'fixed' ? 'compromisso' : 'atividade'}</button>
        </div>
      </section>

      <div class="alert"><span>Se não houver espaço para tudo, uma atividade flexível fica "sem espaço hoje" em vez de sobrepor um compromisso fixo, considera adiá-la.</span></div>
    `;

    renderAgenda(root, fixed, flexible, settings.wakeTime, settings.sleepTime);
    renderFixedList(root, fixed);
    renderFlexibleList(root, flexible);
    wireEvents(root);
  }
};

function renderAgenda(root: HTMLElement, fixed: ReturnType<typeof getFixedCommitments>, flexible: ReturnType<typeof getFlexibleActivities>, wake: string, sleep: string) {
  const el = root.querySelector('#agenda-list') as HTMLElement;
  const dayFixed = fixed.filter((f) => f.days.includes(selectedDay));
  const dayFlexible = flexible.filter((f) => f.days.includes(selectedDay));
  const blocks = computeDaySchedule(dayFixed, dayFlexible, wake, sleep);

  if (!blocks.length) {
    el.innerHTML = '<div class="empty">Sem compromissos nem atividades para este dia</div>';
    return;
  }

  el.innerHTML = blocks.map((b) => blockHTML(b)).join('');
}

function blockHTML(b: ScheduleBlock): string {
  if (b.kind === 'unscheduled') {
    return `
    <div class="row" style="cursor:default">
      <div class="rtxt"><strong>${escapeHtml(b.label)}</strong><small>Sem espaço hoje (${b.durationMin} min), considera adiar</small></div>
      <span class="badge-k">Adiar?</span>
    </div>`;
  }
  const time = `${minToHHMM(b.startMin)} – ${minToHHMM(b.endMin)}`;
  const tag = b.kind === 'fixed' ? 'Fixo' : 'Flexível';
  return `
    <div class="row" style="cursor:default">
      <div class="rtxt"><strong>${escapeHtml(b.label)}</strong><small>${time}</small></div>
      <span class="pill">${tag}</span>
    </div>`;
}

function renderFixedList(root: HTMLElement, fixed: ReturnType<typeof getFixedCommitments>) {
  const el = root.querySelector('#fixed-list') as HTMLElement;
  if (!fixed.length) {
    el.innerHTML = '<div class="empty">Ainda sem compromissos fixos</div>';
    return;
  }
  el.innerHTML = fixed
    .map(
      (f, i) => `
    <div class="log-item">
      <div class="log-txt"><strong>${escapeHtml(f.label)}</strong><div class="log-date">${minToHHMM(f.startMin)}–${minToHHMM(f.endMin)} · ${f.days.map((d) => WEEKDAY_LABELS[d].slice(0, 3)).join(', ')}</div></div>
      <button class="log-del" data-del-fixed="${i}" aria-label="Remover">✕</button>
    </div>`
    )
    .join('');
}

function renderFlexibleList(root: HTMLElement, flexible: ReturnType<typeof getFlexibleActivities>) {
  const el = root.querySelector('#flexible-list') as HTMLElement;
  if (!flexible.length) {
    el.innerHTML = '<div class="empty">Ainda sem atividades flexíveis</div>';
    return;
  }
  el.innerHTML = flexible
    .map(
      (f, i) => `
    <div class="log-item">
      <div class="log-txt"><strong>${escapeHtml(f.label)}</strong><div class="log-date">${f.durationMin} min · ${f.days.map((d) => WEEKDAY_LABELS[d].slice(0, 3)).join(', ')}</div></div>
      <button class="log-del" data-del-flexible="${i}" aria-label="Remover">✕</button>
    </div>`
    )
    .join('');
}

function wireEvents(root: HTMLElement) {
  root.querySelector('#day-picker')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-day]');
    if (!btn) return;
    selectedDay = btn.dataset.day as Weekday;
    refreshActive();
  });

  root.querySelector('#wake-time')?.addEventListener('change', (e) => {
    saveSettings({ wakeTime: (e.target as HTMLInputElement).value });
    refreshActive();
  });
  root.querySelector('#sleep-time')?.addEventListener('change', (e) => {
    saveSettings({ sleepTime: (e.target as HTMLInputElement).value });
    refreshActive();
  });

  root.querySelectorAll<HTMLButtonElement>('[data-commitment-type]').forEach((btn) => {
    btn.addEventListener('click', () => {
      commitmentType = btn.dataset.commitmentType as CommitmentType;
      refreshActive();
    });
  });

  root.querySelector('#cm-add')?.addEventListener('click', () => {
    const label = (root.querySelector('#cm-label') as HTMLInputElement).value.trim();
    const days = [...root.querySelectorAll<HTMLInputElement>('.cm-day:checked')].map((i) => i.value as Weekday);

    if (commitmentType === 'fixed') {
      const start = (root.querySelector('#cm-start') as HTMLInputElement).value;
      const end = (root.querySelector('#cm-end') as HTMLInputElement).value;
      if (!label || !start || !end || !days.length) {
        showToast('Preenche o nome, horário e pelo menos um dia');
        return;
      }
      addFixedCommitment({ id: `fx_${Date.now()}`, label, days, startMin: timeToMin(start), endMin: timeToMin(end) });
      showToast('Compromisso adicionado');
    } else {
      const duration = Number((root.querySelector('#cm-duration') as HTMLInputElement).value);
      if (!label || !duration || !days.length) {
        showToast('Preenche o nome, duração e pelo menos um dia');
        return;
      }
      addFlexibleActivity({ id: `fl_${Date.now()}`, label, days, durationMin: duration });
      showToast('Atividade adicionada');
    }
    refreshActive();
  });

  root.querySelector('#fixed-list')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-del-fixed]');
    if (!btn) return;
    if (!confirm('Remover este compromisso?')) return;
    deleteFixedCommitment(Number(btn.dataset.delFixed));
    refreshActive();
  });

  root.querySelector('#flexible-list')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-del-flexible]');
    if (!btn) return;
    if (!confirm('Remover esta atividade?')) return;
    deleteFlexibleActivity(Number(btn.dataset.delFlexible));
    refreshActive();
  });
}
