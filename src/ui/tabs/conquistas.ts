import type { Tab } from '../nav';
import { essentialsCompletedFlags } from '../../lib/dayHistory';
import { currentStreakFromToday, longestStreak } from '../../lib/streaks';
import { todayISO, toISO, addDays } from '../../lib/dates';

const WINDOW_DAYS = 365;

export const conquistasTab: Tab = {
  id: 'conquistas',
  label: 'Conquistas',
  icon: '',
  group: 'Acompanhamento',
  render(root: HTMLElement) {
    const today = todayISO();
    const start = toISO(addDays(new Date(today), -(WINDOW_DAYS - 1)));
    const flags = essentialsCompletedFlags(start, today);
    const current = currentStreakFromToday(flags);
    const longest = longestStreak(flags);
    const daysDone = flags.filter(Boolean).length;

    root.innerHTML = `
      <div class="ph">
        <h2>Conquistas</h2>
        <div class="ph-title">Consistência, sem punição</div>
        <div class="ph-sub">Um dia falhado nunca apaga o que já construíste</div>
      </div>

      <div class="stat-row">
        <div class="stat"><strong>${current}</strong><small>sequência atual</small></div>
        <div class="stat"><strong>${longest}</strong><small>melhor sequência</small></div>
        <div class="stat"><strong>${daysDone}</strong><small>dias nos últimos ${WINDOW_DAYS}</small></div>
      </div>

      <div class="alert">
        <span>Sequência = dias seguidos (até hoje) com os Essenciais cumpridos (água + treino). Falhar um dia não apaga a tua melhor sequência nem o teu histórico — só recomeça a contagem atual.</span>
      </div>
    `;
  }
};
