import type { Tab } from '../nav';
import {
  getWeights,
  addWeight,
  deleteWeight,
  getMeasurements,
  addMeasurement,
  updateMeasurement,
  deleteMeasurement,
  getSettings
} from '../../lib/storage';
import { todayISO } from '../../lib/dates';
import { drawLineChart } from '../components/chart';
import { refreshActive } from '../nav';
import { showToast } from '../components/toast';
import { escapeHtml } from '../../lib/sanitize';
import { t } from '../../i18n';

let editingMeasurementIndex: number | null = null;

export const progressTab: Tab = {
  id: 'progresso',
  label: 'nav.tab.progresso',
  icon: '',
  group: 'Corpo',
  render(root: HTMLElement) {
    const weights = getWeights();
    const measurements = getMeasurements();
    const settings = getSettings();

    root.innerHTML = `
      <div class="ph">
        <h2>${t('progresso.title')}</h2>
        <div class="ph-title">${t('progresso.subtitle')}${settings.userName ? `, ${escapeHtml(settings.userName)}` : ''}</div>
        <div class="ph-sub">${t('progresso.description')}</div>
      </div>

      <div class="alert"><span>${t('progresso.alert')}</span></div>

      <div class="chart-sec">
        <h4>${t('progresso.chart.title')}</h4>
        <canvas id="wchart" style="width:100%"></canvas>
        <div id="chart-empty" class="empty" style="display:none">${t('progresso.chart.empty')}</div>
      </div>
      <div class="form-row">
        <input class="finp" id="wi" type="number" step="0.1" min="30" max="250" placeholder="${t('progresso.weight.placeholder')}" />
        <button class="fsave" id="wsave">${t('progresso.weight.save')}</button>
      </div>
      <section>
        <div class="sec-title">${t('progresso.weight.logTitle')}</div>
        <div id="wlog"></div>
      </section>

      <section>
        <div class="sec-title">
          <span>${t('progresso.measurements.title')}</span>
          ${editingMeasurementIndex !== null ? `<span class="pill">${t('progresso.measurements.editingPill')}</span>` : ''}
        </div>
        <div class="meds-grid">
          <div><label>${t('progresso.measurements.waist')}</label><input class="finp" id="mc" type="number" placeholder="${t('progresso.measurements.waistPlaceholder')}" /></div>
          <div><label>${t('progresso.measurements.hip')}</label><input class="finp" id="mq" type="number" placeholder="${t('progresso.measurements.hipPlaceholder')}" /></div>
          <div><label>${t('progresso.measurements.thigh')}</label><input class="finp" id="mco" type="number" placeholder="${t('progresso.measurements.thighPlaceholder')}" /></div>
          <div><label>${t('progresso.measurements.arm')}</label><input class="finp" id="mb" type="number" placeholder="${t('progresso.measurements.armPlaceholder')}" /></div>
        </div>
        <div class="form-row">
          <input class="finp" id="mextra-name" type="text" placeholder="${t('progresso.measurements.extraNamePlaceholder')}" style="max-width:160px" />
          <input class="finp" id="mextra-val" type="number" placeholder="${t('progresso.measurements.extraValPlaceholder')}" style="max-width:90px" />
        </div>
        <div class="form-row" style="padding-top:0">
          <button class="btn block" id="msave">${editingMeasurementIndex !== null ? t('progresso.measurements.saveChanges') : t('progresso.measurements.save')}</button>
          ${editingMeasurementIndex !== null ? `<button class="btn ghost" id="mcancel">${t('progresso.measurements.cancel')}</button>` : ''}
        </div>
        <div style="padding:0 16px 4px;font-size:11px;color:var(--text-faint)">${t('progresso.measurements.tapToEdit')}</div>
        <div id="mlog"></div>
      </section>
    `;

    renderChart(root, weights, settings.goalWeightKg);
    renderWeightLog(root, weights);
    renderMeasurements(root, measurements);
    prefillMeasurementForm(root, measurements);
    wireEvents(root);
  }
};

function renderChart(root: HTMLElement, weights: ReturnType<typeof getWeights>, goal: number) {
  const canvas = root.querySelector('#wchart') as HTMLCanvasElement;
  const empty = root.querySelector('#chart-empty') as HTMLElement;
  if (weights.length < 2) {
    canvas.style.display = 'none';
    empty.style.display = 'block';
    return;
  }
  canvas.style.display = 'block';
  empty.style.display = 'none';
  const points = [...weights].reverse().map((w) => ({ date: w.date, value: w.kg }));
  drawLineChart(canvas, points, goal);
}

function renderWeightLog(root: HTMLElement, weights: ReturnType<typeof getWeights>) {
  const el = root.querySelector('#wlog') as HTMLElement;
  if (!weights.length) {
    el.innerHTML = `<div class="empty">${t('progresso.weight.empty')}</div>`;
    return;
  }
  el.innerHTML = weights
    .map((w, i) => {
      const prev = weights[i + 1];
      const diff = prev ? +(w.kg - prev.kg).toFixed(1) : null;
      const diffHTML =
        diff !== null
          ? `<span style="color:${diff > 0 ? 'var(--primary)' : 'var(--green)'};font-weight:600;margin-left:6px">${diff > 0 ? '+' : ''}${diff}kg</span>`
          : '';
      return `
      <div class="log-item">
        <div class="log-txt"><strong>${w.kg} kg</strong>${diffHTML}<div class="log-date">${w.date}</div></div>
        <button class="log-del" data-del-weight="${i}" aria-label="${t('common.remove')}">✕</button>
      </div>`;
    })
    .join('');
}

function renderMeasurements(root: HTMLElement, list: ReturnType<typeof getMeasurements>) {
  const el = root.querySelector('#mlog') as HTMLElement;
  if (!list.length) {
    el.innerHTML = `<div class="empty">${t('progresso.measurements.empty')}</div>`;
    return;
  }
  el.innerHTML = list
    .map((m, i) => {
      const extras = Object.entries(m.extra ?? {})
        .map(([name, val]) => `${escapeHtml(name)} ${val}cm`)
        .join(' · ');
      const isEditing = i === editingMeasurementIndex;
      return `
    <div class="log-item" data-edit-measurement="${i}" style="cursor:pointer;${isEditing ? 'background:rgba(139,92,246,.12)' : ''}">
      <div class="log-txt">
        <strong>${m.date}${isEditing ? ` · ${t('progresso.measurements.editingSuffix')}` : ''}</strong>
        <div class="log-date">${t('progresso.measurements.waist')} ${m.waist ?? '-'}cm · ${t('progresso.measurements.hip')} ${m.hip ?? '-'}cm · ${t('progresso.measurements.thigh')} ${m.thigh ?? '-'}cm · ${t('progresso.measurements.arm')} ${m.arm ?? '-'}cm${extras ? ` · ${extras}` : ''}</div>
      </div>
      <button class="log-del" data-del-measurement="${i}" aria-label="${t('common.remove')}">✕</button>
    </div>`;
    })
    .join('');
}

function prefillMeasurementForm(root: HTMLElement, measurements: ReturnType<typeof getMeasurements>) {
  if (editingMeasurementIndex === null) return;
  const m = measurements[editingMeasurementIndex];
  if (!m) {
    editingMeasurementIndex = null;
    return;
  }
  (root.querySelector('#mc') as HTMLInputElement).value = m.waist?.toString() ?? '';
  (root.querySelector('#mq') as HTMLInputElement).value = m.hip?.toString() ?? '';
  (root.querySelector('#mco') as HTMLInputElement).value = m.thigh?.toString() ?? '';
  (root.querySelector('#mb') as HTMLInputElement).value = m.arm?.toString() ?? '';
  const [extraName, extraVal] = Object.entries(m.extra ?? {})[0] ?? [];
  if (extraName) {
    (root.querySelector('#mextra-name') as HTMLInputElement).value = extraName;
    (root.querySelector('#mextra-val') as HTMLInputElement).value = String(extraVal);
  }
}

function wireEvents(root: HTMLElement) {
  root.querySelector('#wsave')?.addEventListener('click', () => {
    const input = root.querySelector('#wi') as HTMLInputElement;
    const v = parseFloat(input.value);
    if (!v || Number.isNaN(v)) return;
    addWeight(v, todayISO());
    showToast(t('progresso.weight.toastSaved'));
    refreshActive();
  });

  root.querySelector('#msave')?.addEventListener('click', () => {
    const c = (root.querySelector('#mc') as HTMLInputElement).value;
    const q = (root.querySelector('#mq') as HTMLInputElement).value;
    const co = (root.querySelector('#mco') as HTMLInputElement).value;
    const b = (root.querySelector('#mb') as HTMLInputElement).value;
    const extraName = (root.querySelector('#mextra-name') as HTMLInputElement).value.trim();
    const extraVal = (root.querySelector('#mextra-val') as HTMLInputElement).value;
    if (!c && !q && !co && !b && !(extraName && extraVal)) return;
    // Editing keeps the original entry's date — only the values change.
    const originalDate = editingMeasurementIndex !== null ? getMeasurements()[editingMeasurementIndex]?.date : undefined;
    const values = {
      date: originalDate ?? todayISO(),
      waist: c ? parseFloat(c) : undefined,
      hip: q ? parseFloat(q) : undefined,
      thigh: co ? parseFloat(co) : undefined,
      arm: b ? parseFloat(b) : undefined,
      extra: extraName && extraVal ? { [extraName]: parseFloat(extraVal) } : undefined
    };
    if (editingMeasurementIndex !== null) {
      updateMeasurement(editingMeasurementIndex, values);
      editingMeasurementIndex = null;
      showToast(t('progresso.measurements.toastUpdated'));
    } else {
      addMeasurement(values);
      showToast(t('progresso.measurements.toastSaved'));
    }
    refreshActive();
  });

  root.querySelector('#mcancel')?.addEventListener('click', () => {
    editingMeasurementIndex = null;
    refreshActive();
  });

  root.querySelector('#wlog')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-del-weight]');
    if (!btn) return;
    if (!confirm(t('progresso.weight.confirmRemove'))) return;
    deleteWeight(Number(btn.dataset.delWeight));
    refreshActive();
  });

  root.querySelector('#mlog')?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const delBtn = target.closest<HTMLElement>('[data-del-measurement]');
    if (delBtn) {
      if (!confirm(t('progresso.measurements.confirmRemove'))) return;
      deleteMeasurement(Number(delBtn.dataset.delMeasurement));
      if (editingMeasurementIndex === Number(delBtn.dataset.delMeasurement)) editingMeasurementIndex = null;
      refreshActive();
      return;
    }
    const row = target.closest<HTMLElement>('[data-edit-measurement]');
    if (row) {
      editingMeasurementIndex = Number(row.dataset.editMeasurement);
      refreshActive();
    }
  });
}
