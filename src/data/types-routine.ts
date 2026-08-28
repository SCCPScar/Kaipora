import type { Weekday, Tombstonable } from '../lib/types';

/** A commitment with a fixed time slot — work, school, appointments, ... */
export interface FixedCommitment extends Tombstonable {
  id: string;
  label: string;
  days: Weekday[];
  startMin: number; // minutes since midnight
  endMin: number;
}

/** Something the user wants to fit in, without a fixed time — Kaipora slots it into a free window. */
export interface FlexibleActivity extends Tombstonable {
  id: string;
  label: string;
  days: Weekday[];
  durationMin: number;
}

export type ScheduleBlock =
  | { kind: 'fixed'; id: string; label: string; startMin: number; endMin: number }
  | { kind: 'flexible'; id: string; label: string; startMin: number; endMin: number; durationMin: number }
  | { kind: 'unscheduled'; id: string; label: string; durationMin: number };
