import { getSettings } from './storage';

let checkInterval: ReturnType<typeof setInterval> | undefined;
const firedToday = new Set<string>();

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'default') return Notification.requestPermission();
  return Notification.permission;
}

function notify(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  new Notification(title, { body, icon: `${import.meta.env.BASE_URL}icons/icon-192.png` });
}

/**
 * Foreground-only reminder loop. iOS PWAs don't support background timers or
 * scheduled local notifications without a push server, so this only fires
 * while VProject is actually open in the foreground — see the Ajustes tab
 * and README for the full explanation shown to the user.
 */
export function startReminderLoop(): void {
  if (checkInterval) clearInterval(checkInterval);
  checkInterval = setInterval(() => {
    const settings = getSettings();
    if (!settings.notificationsEnabled) return;
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayKey = `${now.toDateString()}_${hhmm}`;

    if (settings.reminderTimes.water.includes(hhmm) && !firedToday.has(`water_${todayKey}`)) {
      firedToday.add(`water_${todayKey}`);
      notify('VProject 💧', 'Hora de beber água!');
    }
    if (settings.reminderTimes.meals.includes(hhmm) && !firedToday.has(`meal_${todayKey}`)) {
      firedToday.add(`meal_${todayKey}`);
      notify('VProject 🥗', 'Hora de uma refeição — regista o que comeres.');
    }
    if (settings.reminderTimes.training.includes(hhmm) && !firedToday.has(`train_${todayKey}`)) {
      firedToday.add(`train_${todayKey}`);
      notify('VProject 💪', 'Hora de treinar, Scarllett!');
    }
  }, 30_000);
}
