import { t } from '../i18n';

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

interface MilestoneDef {
  id: string;
  labelKey: string;
  metric: 'longestStreak' | 'daysDone';
  threshold: number;
}

const MILESTONE_DEFS: MilestoneDef[] = [
  { id: 'streak-7', labelKey: 'conquistas.milestone.streakDays', metric: 'longestStreak', threshold: 7 },
  { id: 'streak-30', labelKey: 'conquistas.milestone.streakDays', metric: 'longestStreak', threshold: 30 },
  { id: 'streak-75', labelKey: 'conquistas.milestone.streakDays', metric: 'longestStreak', threshold: 75 },
  { id: 'days-50', labelKey: 'conquistas.milestone.daysDone', metric: 'daysDone', threshold: 50 },
  { id: 'days-100', labelKey: 'conquistas.milestone.daysDone', metric: 'daysDone', threshold: 100 },
  { id: 'days-365', labelKey: 'conquistas.milestone.daysDone', metric: 'daysDone', threshold: 365 }
];

export function evaluateMilestones(longestStreakValue: number, daysDone: number): MilestoneStatus[] {
  return MILESTONE_DEFS.map((m) => ({
    id: m.id,
    label: t(m.labelKey, { count: m.threshold }),
    metric: m.metric,
    threshold: m.threshold,
    reached: (m.metric === 'longestStreak' ? longestStreakValue : daysDone) >= m.threshold
  }));
}
