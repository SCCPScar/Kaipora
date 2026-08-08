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

// After a magic-link sign-in (which lands back on this page with a fresh
// session), sync immediately instead of waiting for the next timer tick, and
// refresh whatever tab is on screen so the account state shows up right away.
let wasSignedIn = false;
onAuthChange((signedIn) => {
  if (signedIn && !wasSignedIn) {
    void fullSync().then((result) => {
      if (result.ok && (result.pushed > 0 || result.pulled > 0)) showToast('Dados sincronizados ☁️');
    });
  }
  wasSignedIn = signedIn;
  refreshActive();
});

if (migrated) {
  showToast('Dados antigos migrados para o VProject 🌱');
}
