import { getDay, getSettings } from './storage';
import { isDayComplete } from './dayCompletion';
import { toISO, addDays, fromISO } from './dates';

/**
 * Whether each day's Essenciais (água + treino) were met, from `startDate`
 * up to and including `endDate`, oldest-to-newest. Shared by Conquistas
 * (streaks) and Desafios (Kaipora 75) — both derive their progress from
 * this same day-completion rule instead of inventing a separate one.
 */
export function essentialsCompletedFlags(startDate: string, endDate: string): boolean[] {
  const start = fromISO(startDate);
  const end = fromISO(endDate);
  if (start > end) return [];

  const settings = getSettings();
  const glassGoal = Math.max(1, Math.round(settings.waterGoalMl / 250));

  const flags: boolean[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    const day = getDay(toISO(d));
    flags.push(isDayComplete({ waterGlasses: day.water, waterGoalGlasses: glassGoal, trainingDone: Boolean(day.training?.done) }));
  }
  return flags;
}
