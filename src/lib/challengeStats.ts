/**
 * Pure progress math for a Challenge (Kaipora 75 and other personal
 * challenges). `flags` covers every day from the challenge's start date up
 * to today (oldest-to-newest) — whether isDayComplete() was true that day.
 * A missed day is simply not counted; it never resets progress or ends the
 * challenge early.
 */
export interface ChallengeProgress {
  daysElapsed: number;
  daysCompleted: number;
  daysRemaining: number;
  finished: boolean;
}

export function challengeStats(flags: boolean[], totalDays: number): ChallengeProgress {
  const daysElapsed = Math.min(flags.length, totalDays);
  const daysCompleted = flags.filter(Boolean).length;
  const finished = flags.length >= totalDays;
  return {
    daysElapsed,
    daysCompleted,
    daysRemaining: Math.max(0, totalDays - flags.length),
    finished
  };
}
