import './style.css';
import { migrateFromLegacyApp } from './lib/migrate';
import { registerServiceWorker } from './lib/registerSW';
import { startBackgroundSync, onAuthChange, fullSync } from './lib/sync';
import { startReminderLoop } from './lib/notifications';
import { initNav, refreshActive } from './ui/nav';
import { todayTab } from './ui/tabs/today';
import { trainingTab } from './ui/tabs/training';
import { dietTab } from './ui/tabs/diet';
import { progressTab } from './ui/tabs/progress';
import { calendarTab } from './ui/tabs/calendar';
import { settingsTab } from './ui/tabs/settings';
import { showToast } from './ui/components/toast';

const { migrated, warnings } = migrateFromLegacyApp();
if (migrated) {
  for (const w of warnings) console.info('[VProject migração]', w);
}

const app = document.getElementById('app') as HTMLElement;
app.innerHTML = '';

initNav(app, [todayTab, trainingTab, dietTab, progressTab, calendarTab, settingsTab], 'hoje');

registerServiceWorker();
startReminderLoop();
startBackgroundSync((result) => {
  if (!result.ok) return;
  if (result.pushed > 0 || result.pulled > 0) {
    refreshActive();
    showToast('Dados sincronizados ☁️');
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
      showToast(result.ok ? 'Sessão iniciada e sincronizada ☁️' : 'Sessão iniciada — sincronização falhou, a tentar novamente em breve.');
    });
  } else if (justSignedOut) {
    showToast('Sessão terminada.');
  }
});

if (migrated) {
  showToast('Dados antigos migrados para o VProject 🌱');
}
