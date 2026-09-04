import type { Tab } from '../nav';
import type { Challenge } from '../../data/types-challenges';
import type { BuiltInModality, Weekday } from '../../lib/types';
import {
  getChallenges,
  addChallenge,
  deleteChallenge,
  getDay,
  getWater,
  setWater,
  setTrainingDone,
  getSkills,
  getSkillSessions,
  logSkillSession,
  getChallengeDayLog,
  setChallengeDayLog
} from '../../lib/storage';
import { challengeStats } from '../../lib/challengeStats';
import { essentialsCompletedFlags } from '../../lib/dayHistory';
import { kaipora75CompletedFlags, kaipora75DayStatus } from '../../lib/kaipora75';
import { getTrainingDay } from '../../data/training';
import { todayISO, addDays, toISO, fromISO, DAY_ABBR, MONTH_NAMES, WEEKDAY_KEYS } from '../../lib/dates';
import { refreshActive, switchTab } from '../nav';
import { showToast } from '../components/toast';
import { openModal } from '../components/modal';

let addingChallenge = false;

/** id of the Kaipora 75 challenge currently showing its 75-day calendar, or null for the list. */
let openChallengeId: string | null = null;
let calViewYear = new Date().getFullYear();
let calViewMonth = new Date().getMonth();

export const desafiosTab: Tab = {
  id: 'desafios',
  label: 'Desafios',
  icon: '',
  group: 'Desafios',
  render(root: HTMLElement) {
    const open = openChallengeId ? getChallenges().find((c) => c.id === openChallengeId) : undefined;
    if (open) {
      renderCalendarView(root, open);
    } else {
      openChallengeId = null;
      renderList(root);
    }
  }
};

function renderList(root: HTMLElement) {
  root.innerHTML = `
    <div class="ph">
      <h2>Desafios</h2>
      <div class="ph-title">Kaipora 75 e outros desafios pessoais</div>
      <div class="ph-sub">Um dia falhado nunca reinicia o desafio. A contagem continua</div>
    </div>

    <div class="alert">
      <span>
        <strong>Como funciona o Kaipora 75:</strong> é a nossa versão adaptada do desafio "75 Hard", com 75
        dias em que cada dia tem quatro regras próprias (vê o calendário do desafio para o detalhe). Se te
        esqueceres um dia, esse dia simplesmente não conta: o desafio não reinicia nem termina antes do
        prazo, continua sempre a contar até chegares aos 75 dias.
      </span>
    </div>

    <section>
      <div id="challenge-list"></div>
      <div id="challenge-form"></div>
    </section>
  `;

  renderChallenges(root);
  wireListEvents(root);
}

function renderChallenges(root: HTMLElement) {
  const el = root.querySelector('#challenge-list') as HTMLElement;
  const challenges = getChallenges();
  const today = todayISO();

  el.innerHTML = challenges.length
    ? challenges
        .map((c, i) => {
          const flags = c.kind === 'kaipora75' ? kaipora75CompletedFlags(c.id, c.startDate, today) : essentialsCompletedFlags(c.startDate, today);
          const stats = challengeStats(flags, c.totalDays);
          const lastDayOfChallenge = toISO(addDays(fromISO(c.startDate), c.totalDays - 1));
          const todayCountsTowardChallenge = !stats.finished && today >= c.startDate && today <= lastDayOfChallenge;
          const todayDone = todayCountsTowardChallenge ? flags[flags.length - 1] : false;
          return `
      <div class="day-card open">
        <div class="day-head" style="cursor:default">
          <div class="day-info">
            <div class="day-nm">${c.title}${stats.finished ? ' · terminado' : ''}</div>
            <div class="day-focus">Dia ${stats.daysElapsed} de ${c.totalDays} · ${stats.daysCompleted} dia(s) cumpridos</div>
          </div>
          <button class="log-del" data-del-challenge="${i}">✕</button>
        </div>
        <div class="day-body">
          ${
            c.kind === 'kaipora75'
              ? `<div class="form-row" style="padding-top:0"><button class="btn block" data-open-calendar="${c.id}">Ver os 75 dias</button></div>`
              : todayCountsTowardChallenge
                ? `<div class="row" data-goto-hoje>
                    <div class="rtxt"><strong>Hoje</strong><small>${todayDone ? 'Essenciais já cumpridos: o dia conta' : 'Essenciais ainda por cumprir'}</small></div>
                    <span class="badge-${todayDone ? 'p' : 'k'}">${todayDone ? 'Cumprido' : 'Ir para Hoje'}</span>
                  </div>`
                : ''
          }
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

function wireListEvents(root: HTMLElement) {
  root.querySelector('#challenge-list')?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    const openCal = target.closest<HTMLElement>('[data-open-calendar]');
    if (openCal) {
      openChallengeId = openCal.dataset.openCalendar as string;
      const c = getChallenges().find((x) => x.id === openChallengeId);
      if (c) {
        const start = fromISO(c.startDate);
        calViewYear = start.getFullYear();
        calViewMonth = start.getMonth();
      }
      refreshActive();
      return;
    }

    const gotoHoje = target.closest<HTMLElement>('[data-goto-hoje]');
    if (gotoHoje) {
      switchTab('hoje');
      return;
    }

    const btn = target.closest<HTMLElement>('[data-del-challenge]');
    if (!btn) return;
    if (!confirm('Remover este desafio? O teu histórico de dias mantém-se guardado.')) return;
    deleteChallenge(Number(btn.dataset.delChallenge));
    refreshActive();
  });

  root.querySelector('#challenge-form')?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    const quickstart = target.closest<HTMLElement>('#ch-quickstart-75');
    if (quickstart) {
      addChallenge({ id: `ch_${Date.now()}`, title: 'Kaipora 75', totalDays: 75, startDate: todayISO(), kind: 'kaipora75' });
      showToast('Kaipora 75 iniciado. Boa sorte!');
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

function renderCalendarView(root: HTMLElement, c: Challenge) {
  const lastDay = toISO(addDays(fromISO(c.startDate), c.totalDays - 1));
  const first = new Date(calViewYear, calViewMonth, 1);
  const startWeekday = first.getDay();
  const daysInMonth = new Date(calViewYear, calViewMonth + 1, 0).getDate();
  const todayIso = todayISO();

  const cells: string[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push('<div class="cal-day empty"></div>');
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(calViewYear, calViewMonth, d);
    const iso = toISO(date);
    const inRange = iso >= c.startDate && iso <= lastDay;
    if (!inRange) {
      cells.push(`<div class="cal-day empty"><span>${d}</span></div>`);
      continue;
    }
    const status = kaipora75DayStatus(c.id, iso);
    const cls = ['cal-day'];
    if (iso === todayIso) cls.push('today');
    if (status.allDone) cls.push('k75-done');
    cells.push(`
      <div class="${cls.join(' ')}" data-k75-date="${iso}">
        <span>${d}</span>
        <div class="cal-dots">
          ${status.water ? '<span class="cal-dot dot-water"></span>' : ''}
          ${status.training ? '<span class="cal-dot dot-train"></span>' : ''}
          ${status.skill ? '<span class="cal-dot dot-skill"></span>' : ''}
          ${status.diet ? '<span class="cal-dot dot-diet"></span>' : ''}
        </div>
      </div>`);
  }

  root.innerHTML = `
    <div class="ph">
      <button class="btn sm ghost" id="k75-back">‹ Voltar aos desafios</button>
      <h2>${c.title}</h2>
      <div class="ph-sub">Toca num dia para veres e registares o que fizeste nesse dia</div>
    </div>

    <div class="alert">
      <span>
        <strong>Regras de cada dia:</strong> água até à meta, o treino do dia (ou outra atividade física),
        uma sessão de qualquer Habilidade, e a dieta sem exceções nem álcool. Um dia só fica marcado como
        cumprido quando os quatro estão feitos nesse mesmo dia. Um dia falhado não reinicia o desafio.
      </span>
    </div>

    <section>
      <div class="cal-head">
        <button class="cal-nav" id="k75-prev">‹</button>
        <span class="pill">${MONTH_NAMES[calViewMonth]} de ${calViewYear}</span>
        <button class="cal-nav" id="k75-next">›</button>
      </div>
      <div class="cal-grid">
        ${DAY_ABBR.map((a) => `<div class="cal-dow">${a}</div>`).join('')}
        ${cells.join('')}
      </div>
      <div class="sub-row" style="padding:0 16px 14px;flex-wrap:wrap">
        <span class="badge-k">● água</span>
        <span class="badge-k">● treino/atividade</span>
        <span class="badge-k">● habilidade</span>
        <span class="badge-k">● dieta</span>
      </div>
    </section>
  `;

  root.querySelector('#k75-back')?.addEventListener('click', () => {
    openChallengeId = null;
    refreshActive();
  });
  root.querySelector('#k75-prev')?.addEventListener('click', () => {
    calViewMonth--;
    if (calViewMonth < 0) {
      calViewMonth = 11;
      calViewYear--;
    }
    refreshActive();
  });
  root.querySelector('#k75-next')?.addEventListener('click', () => {
    calViewMonth++;
    if (calViewMonth > 11) {
      calViewMonth = 0;
      calViewYear++;
    }
    refreshActive();
  });
  root.querySelector('.cal-grid')?.addEventListener('click', (e) => {
    const cell = (e.target as HTMLElement).closest<HTMLElement>('[data-k75-date]');
    if (!cell) return;
    openDayDetail(c, cell.dataset.k75Date as string);
  });
}

function openDayDetail(c: Challenge, iso: string) {
  const dayNum = Math.round((fromISO(iso).getTime() - fromISO(c.startDate).getTime()) / 86_400_000) + 1;
  let close: () => void;

  const render = (modal: HTMLElement) => {
    const status = kaipora75DayStatus(c.id, iso);
    const log = getChallengeDayLog(c.id, iso);
    const day = getDay(iso);
    const skills = getSkills();
    const sessionsToday = getSkillSessions().filter((s) => s.date === iso);

    modal.innerHTML = `
      <button class="modal-close" data-close></button>
      <h3>Dia ${dayNum} de ${c.totalDays}</h3>
      <div style="font-size:12.5px;color:var(--text-dim);margin-bottom:12px">${iso}${status.allDone ? ' · dia cumprido' : ''}</div>

      <div class="row" style="cursor:default">
        <div class="rtxt"><strong>Água</strong><small>${day.water} copo(s) registados</small></div>
        <span class="badge-${status.water ? 'p' : 'k'}">${status.water ? 'Meta atingida' : 'Por atingir'}</span>
      </div>
      <div class="wbtns" style="padding:0 0 12px">
        <button class="wbtn" data-day-water-minus>− Copo</button>
        <button class="wbtn" data-day-water-plus>+ Copo</button>
      </div>

      <div class="row" style="cursor:default">
        <div class="rtxt"><strong>Treino do dia</strong><small>${day.training?.done ? 'Marcado como feito' : 'Ainda não marcado'}</small></div>
        <span class="switch"><input type="checkbox" data-day-training ${day.training?.done ? 'checked' : ''}/><span class="slider"></span></span>
      </div>
      <div class="row" style="cursor:default">
        <div class="rtxt"><strong>Outra atividade física</strong><small>Se não fizeste o treino do plano, mas fizeste outra coisa</small></div>
        <span class="switch"><input type="checkbox" data-day-activity ${log.extraActivity ? 'checked' : ''}/><span class="slider"></span></span>
      </div>

      <div class="row" style="cursor:default">
        <div class="rtxt"><strong>Dieta</strong><small>Sem exceções, sem álcool</small></div>
        <span class="switch"><input type="checkbox" data-day-diet ${log.dietOk ? 'checked' : ''}/><span class="slider"></span></span>
      </div>

      <div class="sec-title" style="padding-top:14px;padding-left:0">Habilidades neste dia</div>
      ${
        sessionsToday.length
          ? sessionsToday
              .map(
                (s) => `
        <div class="row" style="cursor:default">
          <div class="rtxt"><strong>${skills.find((sk) => sk.id === s.skillId)?.name ?? 'Habilidade'}</strong><small>${s.minutes} min</small></div>
        </div>`
              )
              .join('')
          : '<div class="empty">Ainda sem sessão registada neste dia</div>'
      }
      ${
        skills.length
          ? `
      <div class="form-row" style="padding-left:0;padding-right:0">
        <select class="finp" id="k75-skill-select" style="flex:2">
          ${skills.map((s) => `<option value="${s.id}">${s.name}</option>`).join('')}
        </select>
        <input class="finp" id="k75-skill-minutes" type="number" min="1" placeholder="minutos" style="flex:1" />
      </div>
      <div class="form-row" style="padding:0 0 4px">
        <button class="btn block" data-log-skill>Registar sessão</button>
      </div>`
          : `<div style="padding:0 0 4px;font-size:12.5px;color:var(--text-dim)">Ainda sem habilidades criadas. Adiciona uma em <a href="#" data-goto-habilidades style="color:var(--primary);font-weight:700">Habilidades</a>.</div>`
      }
    `;

    modal.querySelector('[data-close]')?.addEventListener('click', () => close());
    modal.querySelector('[data-day-water-plus]')?.addEventListener('click', () => {
      setWater(iso, getWater(iso) + 1);
      render(modal);
      refreshActive();
    });
    modal.querySelector('[data-day-water-minus]')?.addEventListener('click', () => {
      if (getWater(iso) > 0) setWater(iso, getWater(iso) - 1);
      render(modal);
      refreshActive();
    });
    modal.querySelector('[data-day-training]')?.addEventListener('change', (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      const weekday = WEEKDAY_KEYS[fromISO(iso).getDay()] as Weekday;
      const modality: BuiltInModality = (day.training?.modality as BuiltInModality) ?? 'academia';
      const workout = getTrainingDay(weekday)[modality];
      setTrainingDone(iso, modality, workout.id, checked);
      render(modal);
      refreshActive();
    });
    modal.querySelector('[data-day-activity]')?.addEventListener('change', (e) => {
      setChallengeDayLog(c.id, iso, { extraActivity: (e.target as HTMLInputElement).checked });
      render(modal);
      refreshActive();
    });
    modal.querySelector('[data-day-diet]')?.addEventListener('change', (e) => {
      setChallengeDayLog(c.id, iso, { dietOk: (e.target as HTMLInputElement).checked });
      render(modal);
      refreshActive();
    });
    modal.querySelector('[data-log-skill]')?.addEventListener('click', () => {
      const skillId = (modal.querySelector('#k75-skill-select') as HTMLSelectElement)?.value;
      const minutes = Number((modal.querySelector('#k75-skill-minutes') as HTMLInputElement)?.value);
      if (!skillId || !minutes || minutes <= 0) {
        showToast('Escolhe a habilidade e indica os minutos');
        return;
      }
      logSkillSession({ skillId, date: iso, minutes });
      showToast('Sessão registada');
      render(modal);
      refreshActive();
    });
    modal.querySelector('[data-goto-habilidades]')?.addEventListener('click', (e) => {
      e.preventDefault();
      close();
      switchTab('habilidades');
    });
  };

  close = openModal('', (modal) => render(modal));
}
