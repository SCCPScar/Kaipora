import type { Tombstonable } from '../lib/types';

/**
 * A personal challenge over a fixed number of days. Free-form challenges
 * (no `kind`) are generic — the user names them and progress is derived
 * from the same Essenciais rule (água + treino) used everywhere else.
 *
 * `kind: 'kaipora75'` is the Kaipora 75 preset: a distinct, adapted version
 * of the "75 Hard" challenge with its own day-by-day rules (água, treino ou
 * atividade física, uma sessão de Habilidades, dieta sem exceções) — see
 * `src/lib/kaipora75.ts`. It does not reuse the original 75 Hard's daily
 * photo or its "restart from day 1 on any miss" rule: like every streak in
 * this app, a missed day simply isn't counted, and the challenge keeps
 * running to totalDays regardless. There is no reset/restart mechanic
 * anywhere in this feature.
 */
export interface Challenge extends Tombstonable {
  id: string;
  title: string;
  totalDays: number;
  startDate: string; // YYYY-MM-DD
  kind?: 'kaipora75';
}

/**
 * Manual per-day check-ins for a `kind: 'kaipora75'` challenge — only the
 * two things nothing else in the app already tracks. Água and treino reuse
 * the real day record (getDay/setWater/setTrainingDone) instead of being
 * duplicated here, and a Habilidades session logged that day is what marks
 * the skill item done — see kaipora75DayStatus().
 */
export interface ChallengeDayLog extends Tombstonable {
  id: string; // `${challengeId}_${date}`
  challengeId: string;
  date: string; // YYYY-MM-DD
  dietOk: boolean;
  extraActivity: boolean;
}
