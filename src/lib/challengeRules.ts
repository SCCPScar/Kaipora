import { getDay, getSettings, getSkillSessions, getChallengeDayLog } from './storage';
import { toISO, addDays, fromISO, WEEKDAY_KEYS } from './dates';
import type { Challenge } from '../data/types-challenges';

/**
 * Shared rule engine for every preset challenge (Kaipora 75, Kaipora 45—
 * see src/data/challengePresets.ts). The four rules are the same shape for
 * both; only what a day off does (restWeekday) differs, and that's data on
 * the Challenge itself, not a second copy of this file.
 */
export interface ChallengeDayStatus {
  water: boolean;
  training: boolean;
  skill: boolean;
  diet: boolean;
  allDone: boolean;
}

export function challengeDayStatus(challenge: Challenge, date: string): ChallengeDayStatus {
  const day = getDay(date);
  const settings = getSettings();
  const glassGoal = Math.max(1, Math.round(settings.waterGoalMl / 250));
  const log = getChallengeDayLog(challenge.id, date);

  const isPlannedRestDay = challenge.restWeekday !== undefined && WEEKDAY_KEYS[fromISO(date).getDay()] === challenge.restWeekday;

  const water = day.water >= glassGoal;
  const training = Boolean(day.training?.done) || log.extraActivity || isPlannedRestDay;
  const skill = getSkillSessions().some((s) => s.date === date);
  const diet = log.dietOk;

  return { water, training, skill, diet, allDone: water && training && skill && diet };
}

/** Whether each day from `startDate` to `endDate` (oldest-to-newest, both
 * inclusive) fully met the challenge's rules. A missed day is never
 * punished — see the doc comment on Challenge in types-challenges.ts. */
export function challengeCompletedFlags(challenge: Challenge, startDate: string, endDate: string): boolean[] {
  const start = fromISO(startDate);
  const end = fromISO(endDate);
  if (start > end) return [];

  const flags: boolean[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    flags.push(challengeDayStatus(challenge, toISO(d)).allDone);
  }
  return flags;
}
