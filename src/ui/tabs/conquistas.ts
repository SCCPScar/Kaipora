import type { Tab } from '../nav';
import { essentialsCompletedFlags } from '../../lib/dayHistory';
import { currentStreakFromToday, longestStreak } from '../../lib/streaks';
import { evaluateMilestones } from '../../lib/milestones';
import { todayISO, toISO, addDays } from '../../lib/dates';
import { t } from '../../i18n';

const WINDOW_DAYS = 365;

/** Last streak value seen rendered, so a genuine increase gets a brief
 * pulse — not every re-render (e.g. reopening the tab unchanged). */
let lastSeenStreak: number | null = null;

export const conquistasTab: Tab = {
  id: 'conquistas',
  label: 'nav.tab.conquistas',
  icon: '',
  group: 'Acompanhamento',
  render(root: HTMLElement) {
    const today = todayISO();
    const start = toISO(addDays(new Date(today), -(WINDOW_DAYS - 1)));
    const flags = essentialsCompletedFlags(start, today);
    const current = currentStreakFromToday(flags);
    const longest = longestStreak(flags);
    const daysDone = flags.filter(Boolean).length;

    const streakRose = lastSeenStreak !== null && current > lastSeenStreak;
    lastSeenStreak = current;

    const milestones = evaluateMilestones(longest, daysDone);

    root.innerHTML = `
      <div class="ph">
        <h2>${t('conquistas.title')}</h2>
        <div class="ph-title">${t('conquistas.subtitle')}</div>
        <div class="ph-sub">${t('conquistas.description')}</div>
      </div>

      <div class="stat-row">
        <div class="stat"><strong class="${streakRose ? 'pulse' : ''}">${current}</strong><small>${t('conquistas.currentStreak')}</small></div>
        <div class="stat"><strong>${longest}</strong><small>${t('conquistas.bestStreak')}</small></div>
        <div class="stat"><strong>${daysDone}</strong><small>${t('conquistas.daysInLast', { days: WINDOW_DAYS })}</small></div>
      </div>

      <div class="alert">
        <span>${t('conquistas.alert')}</span>
      </div>

      <div class="sec-title">${t('conquistas.milestonesTitle')}</div>
      <div class="milestone-grid">
        ${milestones.map((m) => `<span class="pill ${m.reached ? 'earned' : ''}">${m.reached ? '✓ ' : ''}${m.label}</span>`).join('')}
      </div>
    `;
  }
};
