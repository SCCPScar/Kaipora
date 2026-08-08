import type { Tab } from '../nav';
import {
  getWeights,
  addWeight,
  deleteWeight,
  getMeasurements,
  addMeasurement,
  deleteMeasurement,
  getNotes,
  addNote,
  deleteNote,
  getSettings
} from '../../lib/storage';
import { todayISO } from '../../lib/dates';
import { drawLineChart } from '../components/chart';
import { refreshActive } from '../nav';
import { showToast } from '../components/toast';

export const progressTab: Tab = {
  id: 'progresso',
  label: 'Progresso',
  icon: '📈',
  render(root: HTMLElement) {
    const weights = getWeights();
    const measurements = getMeasurements();
    const notes = getNotes();
    const settings = getSettings();

    root.innerHTML = `
      <div class="ph">
        <h2>Progresso</h2>
        <div class="ph-title">O teu historial, Scarllett</div>
        <div class="ph-sub">Recomposição corporal — mais do que a balança 🌱</div>
      </div>

      <div class="alert"><span>📊</span><span>O sucesso combina peso, medidas, treino e consistência — nunca só o número na balança.</span></div>

      <div class="chart-sec">
        <h4>📉 Evolução do peso</h4>
        <canvas id="wchart" style="width:100%"></canvas>
        <div id="chart-empty" class="empty" style="display:none">Regista pelo menos 2 pesagens para veres o gráfico 🌱</div>
      </div>
      <div class="form-row">
        <input class="finp" id="wi" type="number" step="0.1" min="30" max="250" placeholder="Peso em kg (ex: 74.8)" />
        <button class="fsave" id="wsave">+ Guardar</button>
      </div>
      <section>
        <div class="sec-title">Registos de peso</div>
        <div id="wlog"></div>
      </section>

      <section>
        <div class="sec-title">📏 Medidas (cm)</div>
        <div class="meds-grid">
          <div><label>Cintura</label><input class="finp" id="mc" type="number" placeholder="Ex: 82" /></div>
          <div><label>Quadril / Glúteos</label><input class="finp" id="mq" type="number" placeholder="Ex: 104" /></div>
          <div><label>Coxa</label><input class="finp" id="mco" type="number" placeholder="Ex: 56" /></div>
          <div><label>Braço</label><input class="finp" id="mb" type="number" placeholder="Ex: 28" /></div>
        </div>
        <div class="form-row">
          <input class="finp" id="mextra-name" type="text" placeholder="Outra medida (ex: peito)" style="max-width:160px" />
          <input class="finp" id="mextra-val" type="number" placeholder="cm" style="max-width:90px" />
        </div>
        <div class="form-row" style="padding-top:0">
          <button class="btn block" id="msave">+ Guardar medidas</button>
        </div>
        <div id="mlog"></div>
      </section>

      <section>
        <div class="sec-title">📝 Diário</div>
        <div class="form-row">
          <input class="finp" id="ni" type="text" placeholder="Como foi hoje, Scarllett?" />
          <button class="fsave" id="nsave">Guardar</button>
        </div>
        <div id="nlog"></div>
      </section>
    `;

    renderChart(root, weights, settings.goalWeightKg);
    renderWeightLog(root, weights);
    renderMeasurements(root, measurements);
    renderNotes(root, notes);
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
    el.innerHTML = '<div class="empty">Ainda sem registos de peso 🌱</div>';
    return;
  }
  el.innerHTML = weights
    .map((w, i) => {
      const prev = weights[i + 1];
      const diff = prev ? +(w.kg - prev.kg).toFixed(1) : null;
      const diffHTML =
        diff !== null
          ? `<span style="color:${diff > 0 ? 'var(--burgundy-glow)' : 'var(--green)'};font-weight:800;margin-left:6px">${diff > 0 ? '+' : ''}${diff}kg</span>`
          : '';
      return `
      <div class="log-item">
        <div class="log-txt"><strong>${w.kg} kg</strong>${diffHTML}<div class="log-date">${w.date}</div></div>
        <button class="log-del" data-del-weight="${i}">✕</button>
      </div>`;
    })
    .join('');
}

function renderMeasurements(root: HTMLElement, list: ReturnType<typeof getMeasurements>) {
  const el = root.querySelector('#mlog') as HTMLElement;
  if (!list.length) {
    el.innerHTML = '<div class="empty">Regista as medidas mensalmente 🌱</div>';
    return;
  }
  el.innerHTML = list
    .map((m, i) => {
      const extras = Object.entries(m.extra ?? {})
        .map(([name, val]) => `${name} ${val}cm`)
        .join(' · ');
      return `
    <div class="log-item">
      <div class="log-txt">
        <strong>${m.date}</strong>
        <div class="log-date">Cintura ${m.waist ?? '-'}cm · Quadril ${m.hip ?? '-'}cm · Coxa ${m.thigh ?? '-'}cm · Braço ${m.arm ?? '-'}cm${extras ? ` · ${extras}` : ''}</div>
      </div>
      <button class="log-del" data-del-measurement="${i}">✕</button>
    </div>`;
    })
    .join('');
}

function renderNotes(root: HTMLElement, list: ReturnType<typeof getNotes>) {
  const el = root.querySelector('#nlog') as HTMLElement;
  if (!list.length) {
    el.innerHTML = '<div class="empty">Ainda sem notas 🌱</div>';
    return;
  }
  el.innerHTML = list
    .map(
      (n, i) => `
    <div class="log-item">
      <div class="log-txt"><strong>${n.text}</strong><div class="log-date">${n.date}</div></div>
      <button class="log-del" data-del-note="${i}">✕</button>
    </div>`
    )
    .join('');
}

function wireEvents(root: HTMLElement) {
  root.querySelector('#wsave')?.addEventListener('click', () => {
    const input = root.querySelector('#wi') as HTMLInputElement;
    const v = parseFloat(input.value);
    if (!v || Number.isNaN(v)) return;
    addWeight(v, todayISO());
    showToast('Peso guardado 🌱');
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
    addMeasurement({
      date: todayISO(),
      waist: c ? parseFloat(c) : undefined,
      hip: q ? parseFloat(q) : undefined,
      thigh: co ? parseFloat(co) : undefined,
      arm: b ? parseFloat(b) : undefined,
      extra: extraName && extraVal ? { [extraName]: parseFloat(extraVal) } : undefined
    });
    showToast('Medidas guardadas 🌱');
    refreshActive();
  });

  root.querySelector('#nsave')?.addEventListener('click', () => {
    const input = root.querySelector('#ni') as HTMLInputElement;
    if (!input.value.trim()) return;
    addNote(input.value.trim(), todayISO());
    refreshActive();
  });

  root.querySelector('#wlog')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-del-weight]');
    if (!btn) return;
    if (!confirm('Remover este registo de peso?')) return;
    deleteWeight(Number(btn.dataset.delWeight));
    refreshActive();
  });

  root.querySelector('#mlog')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-del-measurement]');
    if (!btn) return;
    if (!confirm('Remover este registo de medidas?')) return;
    deleteMeasurement(Number(btn.dataset.delMeasurement));
    refreshActive();
  });

  root.querySelector('#nlog')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-del-note]');
    if (!btn) return;
    if (!confirm('Remover esta nota?')) return;
    deleteNote(Number(btn.dataset.delNote));
    refreshActive();
  });
}
