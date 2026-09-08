import { getSettings, getDay, getSnoozedReminderDate } from './storage';
import { todayISO } from './dates';
import { MASCOT_LINES } from '../data/mascot';

let checkInterval: ReturnType<typeof setInterval> | undefined;
const firedToday = new Set<string>();
let lastWaterReminderAt = 0;

const WATER_REMINDER_COOLDOWN_MS = 3 * 60 * 60 * 1000; // 3h — a nudge, not a nag
const WATER_REMINDER_HOURS = { from: 9, to: 21 };

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'default') return Notification.requestPermission();
  return Notification.permission;
}

function notify(title: string, body: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  new Notification(title, { body, icon: `${import.meta.env.BASE_URL}icons/icon-192.png` });
}

/** Content-based, not clock-based: only nudges about water when there is
 * still a real gap to the goal, at most once every few hours, and only in
 * a reasonable window of the day. */
function maybeNotifyWater(now: Date): void {
  const hour = now.getHours();
  if (hour < WATER_REMINDER_HOURS.from || hour >= WATER_REMINDER_HOURS.to) return;
  if (Date.now() - lastWaterReminderAt < WATER_REMINDER_COOLDOWN_MS) return;

  const settings = getSettings();
  const day = getDay(todayISO());
  const glassGoal = Math.max(1, Math.round(settings.waterGoalMl / 250));
  const mlEach = Math.round(settings.waterGoalMl / glassGoal);
  const remainingMl = settings.waterGoalMl - day.water * mlEach;
  if (remainingMl <= 0) return;

  lastWaterReminderAt = Date.now();
  notify('Kaipora', MASCOT_LINES.reminderWater(remainingMl));
}

/**
 * Foreground-only reminder loop. iOS PWAs don't support background timers or
 * scheduled local notifications without a push server, so this only fires
 * while Kaipora is actually open in the foreground — see the Ajustes tab
 * and README for the full explanation shown to the user.
 */
export function startReminderLoop(): void {
  if (checkInterval) clearInterval(checkInterval);
  checkInterval = setInterval(() => {
    const settings = getSettings();
    if (!settings.notificationsEnabled) return;
    const now = new Date();
    if (getSnoozedReminderDate() === todayISO()) return;
    const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const todayKey = `${now.toDateString()}_${hhmm}`;

    maybeNotifyWater(now);

    if (settings.reminderTimes.meals.includes(hhmm) && !firedToday.has(`meal_${todayKey}`)) {
      firedToday.add(`meal_${todayKey}`);
      notify('Kaipora', 'Hora de uma refeição, sem pressa. Regista o que comeres.');
    }
    if (settings.reminderTimes.training.includes(hhmm) && !firedToday.has(`train_${todayKey}`)) {
      firedToday.add(`train_${todayKey}`);
      notify('Kaipora', MASCOT_LINES.reminderTraining);
    }
  }, 30_000);
}
