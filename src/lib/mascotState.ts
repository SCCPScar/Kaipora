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
