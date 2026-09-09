import type { Tab } from '../nav';
import { weekdayName } from '../../lib/dates';
import { getMedications, addMedication, deleteMedication } from '../../lib/storage';
import type { Weekday } from '../../lib/types';
import { refreshActive } from '../nav';
import { showToast } from '../components/toast';
import { escapeHtml } from '../../lib/sanitize';
import { t } from '../../i18n';

const WEEKDAYS: Weekday[] = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];

/** Short (3-letter) weekday label — same convention as rotina.ts. */
function weekdayShort(w: Weekday): string {
  return weekdayName(w).slice(0, 3);
}

function timeRowHTML(removable: boolean): string {
  return `
    <div class="form-row" style="padding:0;align-items:center" data-med-time-row>
      <input class="finp med-time" type="time" />
      ${removable ? `<button type="button" class="log-del" data-med-time-remove aria-label="${t('common.remove')}">✕</button>` : ''}
    </div>`;
}

export const medicamentosTab: Tab = {
  id: 'medicamentos',
  label: 'nav.tab.medicamentos',
  icon: '',
  group: 'Corpo',
  render(root: HTMLElement) {
    const medications = getMedications();

    root.innerHTML = `
      <div class="ph">
        <h2>${t('medicamentos.title')}</h2>
        <div class="ph-title">${t('medicamentos.subtitle')}</div>
        <div class="ph-sub">${t('medicamentos.description')}</div>
      </div>

      <section>
        <div class="sec-title">${t('medicamentos.list.title')}</div>
        <div id="med-list"></div>
      </section>

      <section>
        <div class="sec-title">${t('medicamentos.add.title')}</div>
        <div class="form-row">
          <input class="finp" id="med-name" type="text" placeholder="${t('medicamentos.add.namePlaceholder')}" style="flex:1" />
        </div>
        <div id="med-times" style="display:flex;flex-direction:column;gap:6px;padding:0 14px">
          ${timeRowHTML(false)}
        </div>
        <div class="form-row" style="padding-top:8px">
          <button class="btn ghost" id="med-add-time" type="button">${t('medicamentos.add.addTime')}</button>
        </div>
        <div class="form-row" style="padding-top:0;flex-wrap:wrap">
          ${WEEKDAYS.map((d) => `<label class="pill" style="cursor:pointer"><input type="checkbox" class="med-day" value="${d}" style="margin-right:4px" />${weekdayShort(d)}</label>`).join('')}
        </div>
        <div class="form-row" style="padding-top:0">
          <input class="finp" id="med-purpose" type="text" placeholder="${t('medicamentos.add.purposePlaceholder')}" style="flex:1" />
        </div>
        <div class="form-row" style="padding-top:0">
          <button class="btn block" id="med-add">${t('medicamentos.add.button')}</button>
        </div>
      </section>
    `;

    renderList(root, medications);
    wireEvents(root);
  }
};

function renderList(root: HTMLElement, medications: ReturnType<typeof getMedications>) {
  const el = root.querySelector('#med-list') as HTMLElement;
  if (!medications.length) {
    el.innerHTML = `<div class="empty">${t('medicamentos.list.empty')}</div>`;
    return;
  }
  el.innerHTML = medications
    .map((m, i) => {
      const timesLabel = escapeHtml(m.times.join(', '));
      const daysLabel = m.days.map((d) => weekdayShort(d)).join(', ');
      const purposeLine = m.purpose ? ` · ${escapeHtml(m.purpose)}` : '';
      return `
    <div class="log-item">
      <div class="log-txt"><strong>${escapeHtml(m.name)}</strong><div class="log-date">${timesLabel} · ${daysLabel}${purposeLine}</div></div>
      <button class="log-del" data-del-med="${i}" aria-label="${t('common.remove')}">✕</button>
    </div>`;
    })
    .join('');
}

function wireEvents(root: HTMLElement) {
  root.querySelector('#med-add-time')?.addEventListener('click', () => {
    const container = root.querySelector('#med-times') as HTMLElement;
    container.insertAdjacentHTML('beforeend', timeRowHTML(true));
  });

  root.querySelector('#med-times')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-med-time-remove]');
    if (!btn) return;
    btn.closest('[data-med-time-row]')?.remove();
  });

  root.querySelector('#med-add')?.addEventListener('click', () => {
    const name = (root.querySelector('#med-name') as HTMLInputElement).value.trim();
    const times = [...root.querySelectorAll<HTMLInputElement>('.med-time')]
      .map((i) => i.value)
      .filter((v) => v)
      .sort();
    const days = [...root.querySelectorAll<HTMLInputElement>('.med-day:checked')].map((i) => i.value as Weekday);
    const purpose = (root.querySelector('#med-purpose') as HTMLInputElement).value.trim();

    if (!name || !times.length || !days.length) {
      showToast(t('medicamentos.toast.fill'));
      return;
    }

    addMedication({
      id: `med_${Date.now()}`,
      name,
      times,
      days,
      ...(purpose ? { purpose } : {})
    });
    showToast(t('medicamentos.toast.added'));
    refreshActive();
  });

  root.querySelector('#med-list')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-del-med]');
    if (!btn) return;
    if (!confirm(t('medicamentos.confirmRemove'))) return;
    deleteMedication(Number(btn.dataset.delMed));
    refreshActive();
  });
}
