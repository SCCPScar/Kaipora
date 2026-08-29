import type { Tombstonable } from '../lib/types';

/**
 * A personal challenge over a fixed number of days (Kaipora 75 is just a
 * quick-start preset: title="Kaipora 75", totalDays=75) — deliberately
 * generic so the user can define "e outros desafios pessoais" too.
 *
 * Progress is derived, never stored: a day "counts" when isDayComplete()
 * was true for it (the same Essenciais rule used everywhere else in the
 * app). Per the spec, a missed day is never punished — it simply isn't
 * counted, and the challenge keeps running to totalDays regardless. There
 * is no reset/restart mechanic anywhere in this feature.
 */
export interface Challenge extends Tombstonable {
  id: string;
  title: string;
  totalDays: number;
  startDate: string; // YYYY-MM-DD
}
