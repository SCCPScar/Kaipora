/**
 * The two closed-form challenge presets. Both share the exact same rule
 * engine (see src/lib/challengeRules.ts) — everything that differs between
 * them lives here as data, not as a second copy of the calendar/modal code.
 */
export interface ChallengePreset {
  kind: 'kaipora75' | 'kaipora45';
  title: string;
  totalDays: number;
  /** Shown as the diet item's description in the day-detail modal. */
  dietLabel: string;
  /** Shown in the alert at the top of this challenge's calendar. */
  rulesExplanation: string;
  /** Kaipora 45 only: whether this preset supports a weekly planned rest day. */
  hasWeeklyRestDay: boolean;
}

export const CHALLENGE_PRESETS: Record<'kaipora75' | 'kaipora45', ChallengePreset> = {
  kaipora75: {
    kind: 'kaipora75',
    title: 'Kaipora 75',
    totalDays: 75,
    dietLabel: 'Sem exceções, sem álcool',
    rulesExplanation:
      'Água até a meta, o treino do dia (ou outra atividade física), uma sessão de qualquer Habilidade, ' +
      'e a dieta sem exceções nem álcool. O anel de cada dia enche à medida que cumpre cada regra, e fica ' +
      'cheio quando as quatro estão feitas. Um dia falhado não reinicia o desafio.',
    hasWeeklyRestDay: false
  },
  kaipora45: {
    kind: 'kaipora45',
    title: 'Kaipora 45',
    totalDays: 45,
    dietLabel: 'Com atenção',
    rulesExplanation:
      'A versão mais suave do Kaipora 75: água até a meta, o treino do dia ou qualquer atividade física ' +
      '(caminhada e yoga contam), uma sessão de qualquer Habilidade (ler também conta), e a dieta com ' +
      'atenção. Tem um dia de folga planejado por semana que conta sempre, não é falha nem exceção. Um dia ' +
      'falhado não reinicia o desafio.',
    hasWeeklyRestDay: true
  }
};
