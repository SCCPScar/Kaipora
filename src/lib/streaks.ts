/**
 * Discreet, non-punitive streak math for Conquistas — no "streak broken!"
 * messaging anywhere that calls these, just a factual count. `flags` is
 * ordered oldest-to-newest, with the last entry representing today.
 */

/** How many consecutive days (ending today) were complete. 0 if today wasn't. */
export function currentStreakFromToday(flags: boolean[]): number {
  let streak = 0;
  for (let i = flags.length - 1; i >= 0; i--) {
    if (!flags[i]) break;
    streak++;
  }
  return streak;
}

/** The longest run of consecutive complete days anywhere in the window. */
export function longestStreak(flags: boolean[]): number {
  let longest = 0;
  let current = 0;
  for (const complete of flags) {
    current = complete ? current + 1 : 0;
    if (current > longest) longest = current;
  }
  return longest;
}
