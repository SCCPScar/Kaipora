import type { Tombstonable, Weekday } from '../lib/types';

/**
 * A personal challenge over a fixed number of days. Free-form challenges
 * (no `kind`) are generic — the user names them and progress is derived
 * from the same Essenciais rule (água + treino) used everywhere else.
 *
 * `kind` picks one of the preset day-by-day rule sets in
 * `src/data/challengePresets.ts` (água, treino ou atividade física, uma
 * sessão de Habilidades, dieta) instead of the generic Essenciais rule —
 * see `src/lib/challengeRules.ts`. Kaipora 45 is the deliberately softer
 * sibling of Kaipora 75: shorter, and `restWeekday` gives it one planned
 * rest day per week that satisfies the treino rule automatically, never
 * counted as a miss.
 *
 * Neither preset reuses the original 75 Hard's daily photo or its
 * "restart from day 1 on any miss" rule: like every streak in this app, a
 * missed day simply isn't counted, and the challenge keeps running to
 * totalDays regardless. There is no reset/restart mechanic anywhere in
 * this feature.
 */
export interface Challenge extends Tombstonable {
  id: string;
  title: string;
  totalDays: number;
  startDate: string; // YYYY-MM-DD
  kind?: 'kaipora75' | 'kaipora45';
  /** Only meaningful for kind: 'kaipora45' — the weekday picked as this
   * challenge's one planned rest day per week. */
  restWeekday?: Weekday;
}

/**
 * Manual per-day check-ins for a preset challenge (`kind` set) — only the
 * two things nothing else in the app already tracks. Água e treino reuse
 * the real day record (getDay/setWater/setTrainingDone) instead of being
 * duplicated here, and a Habilidades session logged that day is what marks
 * the skill item done — see challengeDayStatus().
 */
export interface ChallengeDayLog extends Tombstonable {
  id: string; // `${challengeId}_${date}`
  challengeId: string;
  date: string; // YYYY-MM-DD
  dietOk: boolean;
  extraActivity: boolean;
}
