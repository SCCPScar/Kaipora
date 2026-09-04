import { getDay, getSettings, getSkillSessions, getChallengeDayLog } from './storage';
import { toISO, addDays, fromISO } from './dates';

/**
 * Kaipora 75's own day-by-day rules — a distinct, adapted "75 Hard": no
 * daily photo, "read 10 pages" becomes any Habilidades session logged that
 * day, and the two structured 45-minute workouts become the day's real
 * treino (setTrainingDone) OR any other physical activity. Água and treino
 * read the actual day record; only diet adherence and the "other activity"
 * override are unique to this challenge (see ChallengeDayLog).
 */
export interface Kaipora75DayStatus {
  water: boolean;
  training: boolean;
  skill: boolean;
  diet: boolean;
  allDone: boolean;
}

export function kaipora75DayStatus(challengeId: string, date: string): Kaipora75DayStatus {
  const day = getDay(date);
  const settings = getSettings();
  const glassGoal = Math.max(1, Math.round(settings.waterGoalMl / 250));
  const log = getChallengeDayLog(challengeId, date);

  const water = day.water >= glassGoal;
  const training = Boolean(day.training?.done) || log.extraActivity;
  const skill = getSkillSessions().some((s) => s.date === date);
  const diet = log.dietOk;

  return { water, training, skill, diet, allDone: water && training && skill && diet };
}

/** Whether each day from `startDate` to `endDate` (oldest-to-newest, both
 * inclusive) fully met Kaipora 75's rules. A missed day is never punished —
 * see the doc comment on Challenge in types-challenges.ts. */
export function kaipora75CompletedFlags(challengeId: string, startDate: string, endDate: string): boolean[] {
  const start = fromISO(startDate);
  const end = fromISO(endDate);
  if (start > end) return [];

  const flags: boolean[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    flags.push(kaipora75DayStatus(challengeId, toISO(d)).allDone);
  }
  return flags;
}
