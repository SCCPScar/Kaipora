import type { FixedCommitment, FlexibleActivity, ScheduleBlock } from '../data/types-routine';

function timeToMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Slots flexible activities into the gaps between a day's fixed commitments,
 * inside the wake/sleep window. Each flexible activity is placed at the
 * START of the first gap with enough room, in the order given — remaining
 * gap time stays free (rest and unstructured time are valid, per the
 * Kaipora principle of not filling every minute). An activity that doesn't
 * fit anywhere is returned as 'unscheduled' rather than overlapping a fixed
 * commitment or running past bedtime — the caller can suggest deferring it.
 */
export function computeDaySchedule(
  fixed: FixedCommitment[],
  flexible: FlexibleActivity[],
  wakeTime: string,
  sleepTime: string
): ScheduleBlock[] {
  const dayStart = timeToMin(wakeTime);
  const dayEnd = timeToMin(sleepTime);

  const sortedFixed = [...fixed].sort((a, b) => a.startMin - b.startMin);

  const gaps: { start: number; end: number }[] = [];
  let cursor = dayStart;
  for (const f of sortedFixed) {
    if (f.startMin > cursor) gaps.push({ start: cursor, end: f.startMin });
    cursor = Math.max(cursor, f.endMin);
  }
  if (cursor < dayEnd) gaps.push({ start: cursor, end: dayEnd });

  const blocks: ScheduleBlock[] = sortedFixed.map((f) => ({
    kind: 'fixed',
    id: f.id,
    label: f.label,
    startMin: f.startMin,
    endMin: f.endMin
  }));

  for (const activity of flexible) {
    const gapIndex = gaps.findIndex((g) => g.end - g.start >= activity.durationMin);
    if (gapIndex === -1) {
      blocks.push({ kind: 'unscheduled', id: activity.id, label: activity.label, durationMin: activity.durationMin });
      continue;
    }
    const gap = gaps[gapIndex];
    const startMin = gap.start;
    const endMin = gap.start + activity.durationMin;
    blocks.push({ kind: 'flexible', id: activity.id, label: activity.label, startMin, endMin, durationMin: activity.durationMin });
    if (endMin < gap.end) gaps[gapIndex] = { start: endMin, end: gap.end };
    else gaps.splice(gapIndex, 1);
  }

  return blocks.sort((a, b) => {
    const aStart = 'startMin' in a ? a.startMin : Infinity;
    const bStart = 'startMin' in b ? b.startMin : Infinity;
    return aStart - bStart;
  });
}
