import type { SkillSession } from '../data/types-skills';

/** Total minutes practiced for one skill, across every logged session. */
export function totalMinutesForSkill(sessions: SkillSession[], skillId: string): number {
  return sessions.filter((s) => s.skillId === skillId).reduce((sum, s) => sum + s.minutes, 0);
}

/** Total minutes practiced across every skill — the "currency" Recompensas milestones are measured against. */
export function totalMinutesAllSkills(sessions: SkillSession[]): number {
  return sessions.reduce((sum, s) => sum + s.minutes, 0);
}

/** The most recent date a skill was practiced, or null if never. */
export function lastPracticedDate(sessions: SkillSession[], skillId: string): string | null {
  const dates = sessions.filter((s) => s.skillId === skillId).map((s) => s.date);
  if (!dates.length) return null;
  return dates.reduce((latest, d) => (d > latest ? d : latest));
}

/** Number of distinct days a skill has been practiced — a simple, honest
 * frequency measure (not a punitive streak that resets on a missed day). */
export function daysPracticed(sessions: SkillSession[], skillId: string): number {
  return new Set(sessions.filter((s) => s.skillId === skillId).map((s) => s.date)).size;
}
