import './style.css';
import { migrateFromLegacyApp } from './lib/migrate';
import { registerServiceWorker } from './lib/registerSW';
import { startBackgroundSync } from './lib/sync';
import { startReminderLoop } from './lib/notifications';
import { initNav } from './ui/nav';
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
  if (result.pushed > 0 || result.pulled > 0) showToast('Dados sincronizados ☁️');
});

if (migrated) {
  showToast('Dados antigos migrados para o VProject 🌱');
}
