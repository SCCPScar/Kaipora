import { t } from '../i18n';

export interface Habit {
  id: string;
  label: string;
}

/** Stable ids in display order — used by migrate.ts to resolve a legacy
 * by-index habit reference without depending on the (locale-dependent)
 * display labels below. */
export const HABIT_IDS = ['agua', 'sem_agua_refeicao', 'suplementos', 'treino', 'sono', 'alimentacao', 'pesagem'];

/** A function (not a static array) so the labels re-resolve to the active
 * locale on every call — see src/i18n. */
export function getHabits(): Habit[] {
  return [
    { id: 'agua', label: t('habits.agua') },
    { id: 'sem_agua_refeicao', label: t('habits.semAguaRefeicao') },
    { id: 'suplementos', label: t('habits.suplementos') },
    { id: 'treino', label: t('habits.treino') },
    { id: 'sono', label: t('habits.sono') },
    { id: 'alimentacao', label: t('habits.alimentacao') },
    { id: 'pesagem', label: t('habits.pesagem') }
  ];
}
