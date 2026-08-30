import type { Tab } from '../nav';
import {
  getSettings,
  getSkills,
  addSkill,
  deleteSkill,
  getSkillSessions,
  logSkillSession,
  deleteSkillSession,
  getRewards,
  addReward,
  deleteReward,
  claimReward
} from '../../lib/storage';
import { totalMinutesForSkill, totalMinutesAllSkills, lastPracticedDate, daysPracticed } from '../../lib/skillStats';
import { todayISO } from '../../lib/dates';
import { refreshActive, switchTab } from '../nav';
import { showToast } from '../components/toast';

/** skill id currently showing its "log session" mini-form, or null. */
let loggingToSkill: string | null = null;
let addingSkill = false;
let addingReward = false;

function hoursLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
}

export const habilidadesTab: Tab = {
  id: 'habilidades',
  label: 'Habilidades',
  icon: '',
  group: 'Desenvolvimento',
  render(root: HTMLElement) {
    const settings = getSettings();
    const skills = getSkills();
    const sessions = getSkillSessions();

    root.innerHTML = `
      <div class="ph">
        <h2>Habilidades</h2>
        <div class="ph-title">Tempo investido e frequência</div>
        <div class="ph-sub">Qualquer habilidade que estejas a desenvolver, sem categorias fixas</div>
      </div>

      <section>
        <div class="sec-title">As Minhas Habilidades</div>
        <div id="skill-list"></div>
        <div id="skill-add-form"></div>
      </section>

      <section>
        <div class="sec-title">Recompensas</div>
        <div id="rewards-section"></div>
      </section>
    `;

    renderSkills(root, skills, sessions);
    renderSkillAddForm(root);
    renderRewards(root, settings.rewardsEnabled, sessions);
    wireEvents(root);
  }
};

function renderSkills(root: HTMLElement, skills: ReturnType<typeof getSkills>, sessions: ReturnType<typeof getSkillSessions>) {
  const el = root.querySelector('#skill-list') as HTMLElement;
  if (!skills.length) {
    el.innerHTML = '<div class="empty">Ainda sem habilidades. Adiciona a primeira abaixo</div>';
    return;
  }
  el.innerHTML = skills
    .map((skill, i) => {
      const total = totalMinutesForSkill(sessions, skill.id);
      const days = daysPracticed(sessions, skill.id);
      const last = lastPracticedDate(sessions, skill.id);
      const isLogging = loggingToSkill === skill.id;
      return `
      <div class="day-card open">
        <div class="day-head" style="cursor:default">
          <div class="day-info">
            <div class="day-nm">${skill.name}</div>
            <div class="day-focus">${hoursLabel(total)} · ${days} dia${days === 1 ? '' : 's'} praticados${last ? ` · última vez ${last}` : ''}</div>
          </div>
          <button class="log-del" data-del-skill="${i}">✕</button>
        </div>
        <div class="day-body">
          ${
            isLogging
              ? `
          <div class="form-row">
            <input class="finp" id="sess-date-${skill.id}" type="date" value="${todayISO()}" style="flex:1" />
            <input class="finp" id="sess-minutes-${skill.id}" type="number" min="1" placeholder="minutos" style="flex:1" />
          </div>
          <div class="form-row" style="padding-top:0">
            <input class="finp" id="sess-note-${skill.id}" type="text" placeholder="Nota (opcional)" style="flex:1" />
          </div>
          <div class="form-row" style="padding-top:0">
            <button class="btn block" data-save-session="${skill.id}">Guardar sessão</button>
          </div>`
              : `<div class="form-row" style="padding-top:0"><button class="btn block" data-toggle-log="${skill.id}">+ Registar sessão</button></div>`
          }
        </div>
      </div>`;
    })
    .join('');
}

function renderSkillAddForm(root: HTMLElement) {
  const el = root.querySelector('#skill-add-form') as HTMLElement;
  el.innerHTML = addingSkill
    ? `
    <div class="form-row">
      <input class="finp" id="skill-name" type="text" placeholder="Nome da habilidade (ex: Piano, Mandarim)" style="flex:1" />
    </div>
    <div class="form-row" style="padding-top:0">
      <button class="btn block" id="skill-save">Guardar habilidade</button>
    </div>`
    : `<div class="form-row" style="padding-top:0"><button class="btn block" id="skill-toggle">+ Nova habilidade</button></div>`;
}

function renderRewards(root: HTMLElement, enabled: boolean, sessions: ReturnType<typeof getSkillSessions>) {
  const el = root.querySelector('#rewards-section') as HTMLElement;
  if (!enabled) {
    el.innerHTML = `
      <div style="padding:12px 16px;font-size:12.5px;color:var(--text-dim);line-height:1.6">
        Sistema de recompensas desativado. Ativa em <a href="#" data-goto-settings style="color:var(--primary);font-weight:700">Ajustes</a> se quiseres definir marcos para o teu tempo de prática.
      </div>`;
    return;
  }

  const total = totalMinutesAllSkills(sessions);
  const rewards = getRewards();
  el.innerHTML =
    `<div style="padding:0 16px 8px;font-size:12.5px;color:var(--text-dim)">Total praticado em todas as habilidades: <strong>${hoursLabel(total)}</strong></div>` +
    (rewards.length
      ? rewards
          .map((r, i) => {
            const pct = Math.min(100, Math.round((total / r.targetMinutes) * 100));
            const canClaim = total >= r.targetMinutes && !r.claimed;
            return `
      <div class="row" style="cursor:default">
        <div class="rtxt">
          <strong>${r.title}${r.claimed ? ' · conquistada' : ''}</strong>
          <small>${hoursLabel(Math.min(total, r.targetMinutes))} / ${hoursLabel(r.targetMinutes)} (${pct}%)</small>
        </div>
        ${
          r.claimed
            ? '<span class="pill">Conquistada</span>'
            : `<button class="btn sm ${canClaim ? '' : 'ghost'}" data-claim-reward="${r.id}" ${canClaim ? '' : 'disabled'}>Resgatar</button>`
        }
        <button class="log-del" data-del-reward="${i}">✕</button>
      </div>`;
          })
          .join('')
      : '<div class="empty">Ainda sem recompensas definidas</div>') +
    (addingReward
      ? `
      <div class="form-row">
        <input class="finp" id="reward-title" type="text" placeholder="Recompensa (ex: Ver um filme)" style="flex:2" />
        <input class="finp" id="reward-minutes" type="number" min="1" placeholder="minutos alvo" style="flex:1;min-width:110px" />
      </div>
      <div class="form-row" style="padding-top:0">
        <button class="btn block" id="reward-save">Guardar recompensa</button>
      </div>`
      : `<div class="form-row" style="padding-top:0"><button class="btn block" id="reward-toggle">+ Nova recompensa</button></div>`);
}

function wireEvents(root: HTMLElement) {
  root.querySelector('#skill-list')?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    const delBtn = target.closest<HTMLElement>('[data-del-skill]');
    if (delBtn) {
      if (!confirm('Remover esta habilidade? O tempo já registado mantém-se guardado.')) return;
      deleteSkill(Number(delBtn.dataset.delSkill));
      refreshActive();
      return;
    }

    const toggleBtn = target.closest<HTMLElement>('[data-toggle-log]');
    if (toggleBtn) {
      const skillId = toggleBtn.dataset.toggleLog as string;
      loggingToSkill = loggingToSkill === skillId ? null : skillId;
      refreshActive();
      return;
    }

    const saveBtn = target.closest<HTMLElement>('[data-save-session]');
    if (saveBtn) {
      const skillId = saveBtn.dataset.saveSession as string;
      const date = (root.querySelector(`#sess-date-${skillId}`) as HTMLInputElement).value || todayISO();
      const minutes = Number((root.querySelector(`#sess-minutes-${skillId}`) as HTMLInputElement).value);
      const note = (root.querySelector(`#sess-note-${skillId}`) as HTMLInputElement).value.trim();
      if (!minutes || minutes <= 0) {
        showToast('Indica quantos minutos praticaste');
        return;
      }
      logSkillSession({ skillId, date, minutes, note: note || undefined });
      loggingToSkill = null;
      showToast('Sessão registada');
      refreshActive();
    }
  });

  root.querySelector('#skill-toggle')?.addEventListener('click', () => {
    addingSkill = true;
    refreshActive();
  });

  root.querySelector('#skill-save')?.addEventListener('click', () => {
    const name = (root.querySelector('#skill-name') as HTMLInputElement).value.trim();
    if (!name) {
      showToast('Dá um nome à habilidade');
      return;
    }
    addSkill({ id: `sk_${Date.now()}`, name });
    addingSkill = false;
    showToast('Habilidade adicionada');
    refreshActive();
  });

  root.querySelector('#rewards-section')?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    const gotoSettings = target.closest<HTMLElement>('[data-goto-settings]');
    if (gotoSettings) {
      e.preventDefault();
      switchTab('ajustes');
      return;
    }

    const claimBtn = target.closest<HTMLButtonElement>('[data-claim-reward]');
    if (claimBtn && !claimBtn.disabled) {
      claimReward(claimBtn.dataset.claimReward as string, todayISO());
      showToast('Recompensa conquistada!');
      refreshActive();
      return;
    }

    const delRewardBtn = target.closest<HTMLElement>('[data-del-reward]');
    if (delRewardBtn) {
      if (!confirm('Remover esta recompensa?')) return;
      deleteReward(Number(delRewardBtn.dataset.delReward));
      refreshActive();
      return;
    }

    const toggleBtn = target.closest<HTMLElement>('#reward-toggle');
    if (toggleBtn) {
      addingReward = true;
      refreshActive();
      return;
    }

    const saveBtn = target.closest<HTMLElement>('#reward-save');
    if (saveBtn) {
      const title = (root.querySelector('#reward-title') as HTMLInputElement).value.trim();
      const targetMinutes = Number((root.querySelector('#reward-minutes') as HTMLInputElement).value);
      if (!title || !targetMinutes || targetMinutes <= 0) {
        showToast('Preenche o nome e os minutos alvo');
        return;
      }
      addReward({ id: `rw_${Date.now()}`, title, targetMinutes });
      addingReward = false;
      showToast('Recompensa criada');
      refreshActive();
    }
  });
}
