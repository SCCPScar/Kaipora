import type { Tombstonable, Weekday } from '../lib/types';

/**
 * A medication or supplement the user takes regularly. Distinct from
 * Rotina's FixedCommitment/FlexibleActivity (see types-routine.ts) — this is
 * health/dosage data, not a calendar block to schedule into the day's free
 * time — but reuses the same `days: Weekday[]` shape for "which days it
 * applies", and the same tombstoned-list CRUD pattern in storage.ts.
 */
export interface Medication extends Tombstonable {
  id: string;
  name: string;
  /** One or more "HH:MM" doses per day, e.g. ["08:00", "20:00"]. */
  times: string[];
  /** Which weekdays it applies; all 7 selected means every day. */
  days: Weekday[];
  /** Optional free text — what it's for ("para que serve"). */
  purpose?: string;
}
