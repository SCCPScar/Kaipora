import { describe, it, expect } from 'vitest';
import { computeDaySchedule } from '../src/lib/routineSchedule';
import type { FixedCommitment, FlexibleActivity } from '../src/data/types-routine';

function fixed(id: string, label: string, startMin: number, endMin: number): FixedCommitment {
  return { id, label, days: ['seg'], startMin, endMin };
}

function flexible(id: string, label: string, durationMin: number): FlexibleActivity {
  return { id, label, days: ['seg'], durationMin };
}

describe('computeDaySchedule', () => {
  it('always places fixed commitments, sorted by start time', () => {
    const blocks = computeDaySchedule(
      [fixed('b', 'Reunião', 14 * 60, 15 * 60), fixed('a', 'Trabalho', 9 * 60, 12 * 60)],
      [],
      '07:00',
      '23:00'
    );
    expect(blocks.map((b) => b.id)).toEqual(['a', 'b']);
    expect(blocks.every((b) => b.kind === 'fixed')).toBe(true);
  });

  it('slots a flexible activity into the gap before the first fixed commitment', () => {
    const blocks = computeDaySchedule([fixed('work', 'Trabalho', 9 * 60, 17 * 60)], [flexible('read', 'Leitura', 30)], '07:00', '23:00');
    const reading = blocks.find((b) => b.id === 'read');
    expect(reading?.kind).toBe('flexible');
    if (reading?.kind === 'flexible') {
      expect(reading.startMin).toBe(7 * 60); // right at wake time, the first available gap
      expect(reading.endMin).toBe(7 * 60 + 30);
    }
  });

  it('slots a second flexible activity after the first, within the same gap', () => {
    const blocks = computeDaySchedule(
      [],
      [flexible('a', 'Programação', 60), flexible('b', 'Mandarim', 30)],
      '07:00',
      '23:00'
    );
    const a = blocks.find((b) => b.id === 'a');
    const b = blocks.find((b) => b.id === 'b');
    expect(a?.kind).toBe('flexible');
    expect(b?.kind).toBe('flexible');
    if (a?.kind === 'flexible' && b?.kind === 'flexible') {
      expect(a.startMin).toBe(7 * 60);
      expect(a.endMin).toBe(8 * 60);
      expect(b.startMin).toBe(8 * 60); // immediately after, same free window
      expect(b.endMin).toBe(8 * 60 + 30);
    }
  });

  it('never overlaps a fixed commitment when slotting flexible activities', () => {
    const blocks = computeDaySchedule(
      [fixed('work', 'Trabalho', 9 * 60, 17 * 60)],
      [flexible('gym', 'Treino', 90)],
      '07:00',
      '23:00'
    );
    const gym = blocks.find((b) => b.id === 'gym');
    expect(gym?.kind).toBe('flexible');
    if (gym?.kind === 'flexible') {
      // Must land either fully before 9:00 or fully after 17:00.
      const clearOfWork = gym.endMin <= 9 * 60 || gym.startMin >= 17 * 60;
      expect(clearOfWork).toBe(true);
    }
  });

  it('flags an activity as unscheduled instead of creating an impossible overlap', () => {
    // Only a 30-minute gap exists anywhere in the day (07:00-07:30); the activity needs 60 minutes.
    const blocks = computeDaySchedule(
      [fixed('work', 'Trabalho', 7 * 60 + 30, 23 * 60)],
      [flexible('long', 'Sessão longa', 60)],
      '07:00',
      '23:00'
    );
    const long = blocks.find((b) => b.id === 'long');
    expect(long?.kind).toBe('unscheduled');
  });

  it('does not fill every minute of the day — leftover gap time stays free', () => {
    const blocks = computeDaySchedule([], [flexible('a', 'Leitura', 30)], '07:00', '23:00');
    const a = blocks.find((b) => b.id === 'a');
    expect(a?.kind).toBe('flexible');
    // Total scheduled time (30min) is far less than the full wake-to-sleep window (16h) — no forced padding.
    expect(blocks).toHaveLength(1);
  });
});
