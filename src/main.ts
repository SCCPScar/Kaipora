import './style.css';
import { migrateFromLegacyApp } from './lib/migrate';
import { registerServiceWorker } from './lib/registerSW';
import { startBackgroundSync, onAuthChange, fullSync } from './lib/sync';
import { startReminderLoop } from './lib/notifications';
import { getSettings } from './lib/storage';
import { applyTheme } from './lib/theme';
import { initNav, refreshActive } from './ui/nav';
import { todayTab } from './ui/tabs/today';
import { rotinaTab } from './ui/tabs/rotina';
import { trainingTab } from './ui/tabs/training';
import { dietTab } from './ui/tabs/diet';
import { progressTab } from './ui/tabs/progress';
import { calendarTab } from './ui/tabs/calendar';
import { settingsTab } from './ui/tabs/settings';
import { placeholderTab } from './ui/tabs/placeholder';
import { showToast } from './ui/components/toast';

// Sections named in the Kaipora roadmap that don't have real content yet —
// listed honestly as "em breve" so the full navigation is visible from day
// one instead of being hidden until each phase ships.
const habilidadesTab = placeholderTab('habilidades', 'Habilidades', 'Desenvolvimento', 'Acompanha tempo investido, frequência e histórico em qualquer habilidade que estejas a desenvolver.');
const diarioTab = placeholderTab('diario', 'Diário', 'Desenvolvimento', 'Um espaço livre para escreveres sobre o teu dia — sem formulário rígido.');
const desafiosTab = placeholderTab('desafios', 'Desafios', 'Desafios', 'Kaipora 75 e outros desafios pessoais, sem reinício automático em caso de falha.');
const conquistasTab = placeholderTab('conquistas', 'Conquistas', 'Acompanhamento', 'Streaks discretos e não-punitivos — a tua jornada completa fica sempre registada.');

applyTheme(getSettings().theme);

const { migrated, warnings } = migrateFromLegacyApp();
if (migrated) {
  for (const w of warnings) console.info('[Kaipora migração]', w);
}

const app = document.getElementById('app') as HTMLElement;
app.innerHTML = '';

initNav(
  app,
  [todayTab, rotinaTab, trainingTab, dietTab, progressTab, habilidadesTab, diarioTab, desafiosTab, calendarTab, conquistasTab, settingsTab],
  'hoje'
);

registerServiceWorker();
startReminderLoop();
startBackgroundSync((result) => {
  if (!result.ok) return;
  if (result.pushed > 0 || result.pulled > 0) {
    refreshActive();
    showToast('Dados sincronizados');
  }
});

// Single source of truth for sign-in/out feedback (the Ajustes tab itself
// only ever shows sync-in-progress status text, not a duplicate toast).
// After a magic-link sign-in (which lands back on this page with a fresh
// session, or after a manual sign-in/out), sync immediately instead of
// waiting for the next timer tick, and refresh whatever tab is on screen
// twice: once right away (so the Ajustes tab reflects "signed in" without
// delay) and once more when the triggered sync actually finishes (so newly
// pulled data — not just the auth state — shows up without a manual tab
// switch).
let wasSignedIn = false;
onAuthChange((signedIn) => {
  const justSignedIn = signedIn && !wasSignedIn;
  const justSignedOut = !signedIn && wasSignedIn;
  wasSignedIn = signedIn;
  refreshActive();

  if (justSignedIn) {
    void fullSync().then((result) => {
      refreshActive();
      showToast(result.ok ? 'Sessão iniciada e sincronizada' : 'Sessão iniciada — sincronização falhou, a tentar novamente em breve.');
    });
  } else if (justSignedOut) {
    showToast('Sessão terminada.');
  }
});

if (migrated) {
  showToast('Dados antigos migrados para o Kaipora');
}
