/**
 * Automatic, permanent markers surfaced in Conquistas — never tied to the
 * CURRENT streak (which resets, non-punitively, on any missed day), only to
 * the best-ever streak and the total days done, so a milestone earned once
 * is never lost when a later day is missed.
 */
export interface Milestone {
  id: string;
  label: string;
  metric: 'longestStreak' | 'daysDone';
  threshold: number;
}

export interface MilestoneStatus extends Milestone {
  reached: boolean;
}

const MILESTONE_DEFS: Milestone[] = [
  { id: 'streak-7', label: '7 dias seguidos', metric: 'longestStreak', threshold: 7 },
  { id: 'streak-30', label: '30 dias seguidos', metric: 'longestStreak', threshold: 30 },
  { id: 'streak-75', label: '75 dias seguidos', metric: 'longestStreak', threshold: 75 },
  { id: 'days-50', label: '50 dias cumpridos', metric: 'daysDone', threshold: 50 },
  { id: 'days-100', label: '100 dias cumpridos', metric: 'daysDone', threshold: 100 },
  { id: 'days-365', label: '365 dias cumpridos', metric: 'daysDone', threshold: 365 }
];

export function evaluateMilestones(longestStreakValue: number, daysDone: number): MilestoneStatus[] {
  return MILESTONE_DEFS.map((m) => ({
    ...m,
    reached: (m.metric === 'longestStreak' ? longestStreakValue : daysDone) >= m.threshold
  }));
}
