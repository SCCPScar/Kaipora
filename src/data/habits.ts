export interface Habit {
  id: string;
  label: string;
  emoji: string;
}

export const HABITS: Habit[] = [
  { id: 'agua', label: 'Bebi a meta de água', emoji: '💧' },
  { id: 'sem_agua_refeicao', label: 'Não bebi água nas refeições', emoji: '🚫' },
  { id: 'suplementos', label: 'Tomei os suplementos', emoji: '💊' },
  { id: 'treino', label: 'Fiz o treino do dia', emoji: '🏋️' },
  { id: 'sono', label: 'Dormi 7h ou mais', emoji: '😴' },
  { id: 'alimentacao', label: 'Comi bem hoje', emoji: '🥗' },
  { id: 'pesagem', label: 'Pesei os alimentos', emoji: '⚖️' }
];
