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
import { habilidadesTab } from './ui/tabs/habilidades';
import { trainingTab } from './ui/tabs/training';
import { dietTab } from './ui/tabs/diet';
import { progressTab } from './ui/tabs/progress';
import { diarioTab } from './ui/tabs/diario';
import { desafiosTab } from './ui/tabs/desafios';
import { calendarTab } from './ui/tabs/calendar';
import { conquistasTab } from './ui/tabs/conquistas';
import { settingsTab } from './ui/tabs/settings';
import { showToast } from './ui/components/toast';

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
      showToast(result.ok ? 'Sessão iniciada e sincronizada' : 'Sessão iniciada. Sincronização falhou, a tentar novamente em breve.');
    });
  } else if (justSignedOut) {
    showToast('Sessão terminada.');
  }
});

if (migrated) {
  showToast('Dados antigos migrados para o Kaipora');
}
