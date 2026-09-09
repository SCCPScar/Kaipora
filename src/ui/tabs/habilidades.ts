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
import { escapeHtml } from '../../lib/sanitize';
import { t } from '../../i18n';

/** skill id currently showing its "log session" mini-form, or null. */
let loggingToSkill: string | null = null;
let addingSkill = false;
let addingReward = false;
/** id of the reward whose claim animation should play on this render only. */
let justClaimedRewardId: string | null = null;

function hoursLabel(minutes: number): string {
  if (minutes < 60) return `${minutes} ${t('habilidades.minutesShort')}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
}

export const habilidadesTab: Tab = {
  id: 'habilidades',
  label: 'nav.tab.habilidades',
  icon: '',
  group: 'Desenvolvimento',
  render(root: HTMLElement) {
    const settings = getSettings();
    const skills = getSkills();
    const sessions = getSkillSessions();

    root.innerHTML = `
      <div class="ph">
        <h2>${t('habilidades.title')}</h2>
        <div class="ph-title">${t('habilidades.subtitle')}</div>
        <div class="ph-sub">${t('habilidades.description')}</div>
      </div>

      <section>
        <div class="sec-title">${t('habilidades.mySkills')}</div>
        <div id="skill-list"></div>
        <div id="skill-add-form"></div>
      </section>

      <section>
        <div class="sec-title">${t('habilidades.rewardsTitle')}</div>
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
    el.innerHTML = `<div class="empty">${t('habilidades.empty')}</div>`;
    return;
  }
  el.innerHTML = skills
    .map((skill, i) => {
      const total = totalMinutesForSkill(sessions, skill.id);
      const days = daysPracticed(sessions, skill.id);
      const last = lastPracticedDate(sessions, skill.id);
      const isLogging = loggingToSkill === skill.id;
      const daysText = days === 1 ? t('habilidades.daysPracticedOne', { days }) : t('habilidades.daysPracticedOther', { days });
      return `
      <div class="day-card open">
        <div class="day-head" style="cursor:default">
          <div class="day-info">
            <div class="day-nm">${escapeHtml(skill.name)}</div>
            <div class="day-focus">${hoursLabel(total)} · ${daysText}${last ? ` ${t('habilidades.lastPracticedSuffix', { date: last })}` : ''}</div>
          </div>
          <button class="log-del" data-del-skill="${i}" aria-label="${t('common.remove')}">✕</button>
        </div>
        <div class="day-body">
          ${
            isLogging
              ? `
          <div class="form-row">
            <input class="finp" id="sess-date-${skill.id}" type="date" value="${todayISO()}" style="flex:1" />
            <input class="finp" id="sess-minutes-${skill.id}" type="number" min="1" placeholder="${t('habilidades.sessionMinutesPlaceholder')}" style="flex:1" />
          </div>
          <div class="form-row" style="padding-top:0">
            <input class="finp" id="sess-note-${skill.id}" type="text" placeholder="${t('habilidades.sessionNotePlaceholder')}" style="flex:1" />
          </div>
          <div class="form-row" style="padding-top:0">
            <button class="btn block" data-save-session="${skill.id}">${t('habilidades.saveSession')}</button>
          </div>`
              : `<div class="form-row" style="padding-top:0"><button class="btn block" data-toggle-log="${skill.id}">${t('habilidades.logSession')}</button></div>`
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
      <input class="finp" id="skill-name" type="text" placeholder="${t('habilidades.skillNamePlaceholder')}" style="flex:1" />
    </div>
    <div class="form-row" style="padding-top:0">
      <button class="btn block" id="skill-save">${t('habilidades.saveSkill')}</button>
    </div>`
    : `<div class="form-row" style="padding-top:0"><button class="btn block" id="skill-toggle">${t('habilidades.newSkill')}</button></div>`;
}

function renderRewards(root: HTMLElement, enabled: boolean, sessions: ReturnType<typeof getSkillSessions>) {
  const el = root.querySelector('#rewards-section') as HTMLElement;
  if (!enabled) {
    el.innerHTML = `
      <div style="padding:12px 16px;font-size:12.5px;color:var(--text-dim);line-height:1.6">
        ${t('habilidades.rewardsDisabledPrefix')} <a href="#" data-goto-settings style="color:var(--primary);font-weight:700">${t('nav.tab.ajustes')}</a> ${t('habilidades.rewardsDisabledSuffix')}
      </div>`;
    return;
  }

  const total = totalMinutesAllSkills(sessions);
  const rewards = getRewards();
  el.innerHTML =
    `<div style="padding:0 16px 8px;font-size:12.5px;color:var(--text-dim)">${t('habilidades.totalPracticed')} <strong>${hoursLabel(total)}</strong></div>` +
    (rewards.length
      ? rewards
          .map((r, i) => {
            const pct = Math.min(100, Math.round((total / r.targetMinutes) * 100));
            const canClaim = total >= r.targetMinutes && !r.claimed;
            const justClaimed = r.claimed && r.id === justClaimedRewardId;
            return `
      <div class="row reward-claim-burst ${justClaimed ? 'animate' : ''}" style="cursor:default">
        ${justClaimed ? sparksHTML() : ''}
        <div class="rtxt">
          <strong>${escapeHtml(r.title)}${r.claimed ? ` ${t('habilidades.rewardAchievedSuffix')}` : ''}</strong>
          <small>${hoursLabel(Math.min(total, r.targetMinutes))} / ${hoursLabel(r.targetMinutes)} (${pct}%)</small>
        </div>
        ${
          r.claimed
            ? `<span class="pill">${t('habilidades.rewardAchievedPill')}</span>`
            : `<button class="btn sm ${canClaim ? '' : 'ghost'}" data-claim-reward="${r.id}" ${canClaim ? '' : 'disabled'}>${t('habilidades.rewardClaim')}</button>`
        }
        <button class="log-del" data-del-reward="${i}" aria-label="${t('common.remove')}">✕</button>
      </div>`;
          })
          .join('')
      : `<div class="empty">${t('habilidades.rewardsEmpty')}</div>`) +
    (addingReward
      ? `
      <div class="form-row">
        <input class="finp" id="reward-title" type="text" placeholder="${t('habilidades.rewardTitlePlaceholder')}" style="flex:2" />
        <input class="finp" id="reward-minutes" type="number" min="1" placeholder="${t('habilidades.rewardMinutesPlaceholder')}" style="flex:1;min-width:110px" />
      </div>
      <div class="form-row" style="padding-top:0">
        <button class="btn block" id="reward-save">${t('habilidades.rewardSave')}</button>
      </div>`
      : `<div class="form-row" style="padding-top:0"><button class="btn block" id="reward-toggle">${t('habilidades.rewardAdd')}</button></div>`);

  justClaimedRewardId = null;
}

/** 6 small dots bursting outward — same language as the Hoje completion
 * banner, reused here for unlocking a reward. */
function sparksHTML(): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * Math.PI * 2;
    const dx = Math.round(Math.cos(angle) * 46);
    const dy = Math.round(Math.sin(angle) * 46);
    return `<span class="spark" style="--dx:${dx}px;--dy:${dy}px;animation-delay:${i * 30}ms"></span>`;
  }).join('');
}

function wireEvents(root: HTMLElement) {
  root.querySelector('#skill-list')?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;

    const delBtn = target.closest<HTMLElement>('[data-del-skill]');
    if (delBtn) {
      if (!confirm(t('habilidades.confirmRemoveSkill'))) return;
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
        showToast(t('habilidades.toastLogMinutes'));
        return;
      }
      logSkillSession({ skillId, date, minutes, note: note || undefined });
      loggingToSkill = null;
      showToast(t('habilidades.toastSessionSaved'));
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
      showToast(t('habilidades.toastNameSkill'));
      return;
    }
    addSkill({ id: `sk_${Date.now()}`, name });
    addingSkill = false;
    showToast(t('habilidades.toastSkillAdded'));
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
      const rewardId = claimBtn.dataset.claimReward as string;
      claimReward(rewardId, todayISO());
      justClaimedRewardId = rewardId;
      showToast(t('habilidades.toastRewardClaimed'));
      refreshActive();
      return;
    }

    const delRewardBtn = target.closest<HTMLElement>('[data-del-reward]');
    if (delRewardBtn) {
      if (!confirm(t('habilidades.confirmRemoveReward'))) return;
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
        showToast(t('habilidades.toastFillTitleMinutes'));
        return;
      }
      addReward({ id: `rw_${Date.now()}`, title, targetMinutes });
      addingReward = false;
      showToast(t('habilidades.toastRewardCreated'));
      refreshActive();
    }
  });
}
