/**
 * Pure rules for when the Kaipora mascot speaks up. Kept separate from
 * storage/DOM so the "when" is testable on its own — see mascot.ts for the
 * actual lines and today.ts for where these get wired into the UI.
 *
 * The mascot is never a permanent avatar: it only appears for these three
 * moments (lembretes contextuais, fecho do dia, regresso após dia falhado),
 * per the closed design direction.
 */

/** Shown once, the first time Hoje loads after a day whose Essenciais were
 * left incomplete — never punishing, never repeated for the same day. */
export function shouldShowComeBack(yesterdayEssentialsDone: boolean | null, alreadyShownForToday: boolean): boolean {
  return yesterdayEssentialsDone === false && !alreadyShownForToday;
}

/** A same-day nudge for whichever Essencial is still missing, but only
 * later in the day — showing it at 8am would just be noise. */
export function shouldShowReminder(hour: number, essentialDone: boolean, fromHour = 17): boolean {
  return !essentialDone && hour >= fromHour;
}

/** How many days in a row, most-recent-first (yesterday, the day before,
 * ...), were NOT fully done — stops at the first done day. Used only to
 * soften Kaipora's tone after a rough stretch, never to call it out. */
export function consecutiveDifficultDays(recentDoneFlagsMostRecentFirst: boolean[]): number {
  let count = 0;
  for (const done of recentDoneFlagsMostRecentFirst) {
    if (done) break;
    count++;
  }
  return count;
}

/** From two-in-a-row, Kaipora's "come back" line softens further — never
 * scolding, just acknowledging that it's been a genuinely harder stretch. */
export function shouldUseAdaptiveTone(difficultDaysInARow: number): boolean {
  return difficultDaysInARow >= 2;
}
