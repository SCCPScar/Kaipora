import type { Tombstonable } from '../lib/types';

/** A skill/ability the user is developing — deliberately generic (language,
 * instrument, craft, sport, anything) since the spec calls for a module that
 * tracks time invested and frequency, not a fixed catalog of skills. */
export interface Skill extends Tombstonable {
  id: string;
  name: string;
}

/** One practice session logged against a skill. */
export interface SkillSession extends Tombstonable {
  skillId: string;
  date: string; // YYYY-MM-DD
  minutes: number;
  note?: string;
}

/** A user-defined reward, claimable once total practice time across every
 * skill reaches `targetMinutes`. Claiming is a one-time milestone marker —
 * not a spend/balance economy — so it stays a discreet, non-punitive nudge
 * rather than a full gamification system. */
export interface Reward extends Tombstonable {
  id: string;
  title: string;
  targetMinutes: number;
  claimed: boolean;
  claimedAt?: string; // YYYY-MM-DD
}
