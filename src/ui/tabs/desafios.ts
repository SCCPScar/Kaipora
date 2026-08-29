import type { Tab } from '../nav';
import { getChallenges, addChallenge, deleteChallenge } from '../../lib/storage';
import { challengeStats } from '../../lib/challengeStats';
import { essentialsCompletedFlags } from '../../lib/dayHistory';
import { todayISO } from '../../lib/dates';
import { refreshActive } from '../nav';
import { showToast } from '../components/toast';

let addingChallenge = false;

export const desafiosTab: Tab = {
  id: 'desafios',
  label: 'Desafios',
  icon: '',
  group: 'Desafios',
  render(root: HTMLElement) {
    root.innerHTML = `
      <div class="ph">
        <h2>Desafios</h2>
        <div class="ph-title">Kaipora 75 e outros desafios pessoais</div>
        <div class="ph-sub">Um dia falhado nunca reinicia o desafio — a contagem continua</div>
      </div>

      <section>
        <div id="challenge-list"></div>
        <div id="challenge-form"></div>
      </section>
    `;

    renderChallenges(root);
    wireEvents(root);
  }
};

function renderChallenges(root: HTMLElement) {
  const el = root.querySelector('#challenge-list') as HTMLElement;
  const challenges = getChallenges();
  const today = todayISO();

  el.innerHTML = challenges.length
    ? challenges
        .map((c, i) => {
          const flags = essentialsCompletedFlags(c.startDate, today);
          const stats = challengeStats(flags, c.totalDays);
          return `
      <div class="day-card open">
        <div class="day-head" style="cursor:default">
          <div class="day-info">
            <div class="day-nm">${c.title}${stats.finished ? ' · terminado' : ''}</div>
            <div class="day-focus">Dia ${stats.daysElapsed} de ${c.totalDays} · ${stats.daysCompleted} dia(s) com os Essenciais cumpridos</div>
          </div>
          <button class="log-del" data-del-challenge="${i}">✕</button>
        </div>
        <div class="day-body">
          <div class="sub-row">
            <span class="badge-p">${stats.daysCompleted}/${c.totalDays} cumpridos</span>
            <span class="badge-k">${stats.daysRemaining} dia(s) restantes</span>
          </div>
        </div>
      </div>`;
        })
        .join('')
    : '<div class="empty">Ainda sem desafios ativos</div>';

  const formEl = root.querySelector('#challenge-form') as HTMLElement;
  formEl.innerHTML = addingChallenge
    ? `
    <div class="form-row">
      <input class="finp" id="ch-title" type="text" placeholder="Nome do desafio" style="flex:2" />
      <input class="finp" id="ch-days" type="number" min="1" placeholder="dias" value="75" style="flex:1;min-width:80px" />
    </div>
    <div class="form-row" style="padding-top:0">
      <input class="finp" id="ch-start" type="date" value="${today}" style="flex:1" />
    </div>
    <div class="form-row" style="padding-top:0">
      <button class="btn block" id="ch-save">Guardar desafio</button>
    </div>`
    : `
    <div class="form-row">
      <button class="btn block" id="ch-quickstart-75">+ Começar o Kaipora 75</button>
    </div>
    <div class="form-row" style="padding-top:0">
      <button class="btn block ghost" id="ch-toggle">+ Criar outro desafio</button>
    </div>`;
}

function wireEvents(root: HTMLElement) {
  root.querySelector('#challenge-list')?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-del-challenge]');
    if (!btn) return;
    if (!confirm('Remover este desafio? O teu histórico de dias mantém-se guardado.')) return;
    deleteChallenge(Number(btn.dataset.delChallenge));
    refreshActive();
  });

  root.querySelector('#challenge-form')?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    const quickstart = target.closest<HTMLElement>('#ch-quickstart-75');
    if (quickstart) {
      addChallenge({ id: `ch_${Date.now()}`, title: 'Kaipora 75', totalDays: 75, startDate: todayISO() });
      showToast('Kaipora 75 iniciado — boa sorte!');
      refreshActive();
      return;
    }

    const toggle = target.closest<HTMLElement>('#ch-toggle');
    if (toggle) {
      addingChallenge = true;
      refreshActive();
      return;
    }

    const save = target.closest<HTMLElement>('#ch-save');
    if (save) {
      const title = (root.querySelector('#ch-title') as HTMLInputElement).value.trim();
      const totalDays = Number((root.querySelector('#ch-days') as HTMLInputElement).value);
      const startDate = (root.querySelector('#ch-start') as HTMLInputElement).value || todayISO();
      if (!title || !totalDays || totalDays <= 0) {
        showToast('Preenche o nome e o número de dias');
        return;
      }
      addChallenge({ id: `ch_${Date.now()}`, title, totalDays, startDate });
      addingChallenge = false;
      showToast('Desafio criado');
      refreshActive();
    }
  });
}
