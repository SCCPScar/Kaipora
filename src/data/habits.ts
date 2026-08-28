export interface Habit {
  id: string;
  label: string;
}

export const HABITS: Habit[] = [
  { id: 'agua', label: 'Bebi a meta de água' },
  { id: 'sem_agua_refeicao', label: 'Não bebi água nas refeições' },
  { id: 'suplementos', label: 'Tomei os suplementos' },
  { id: 'treino', label: 'Fiz o treino do dia' },
  { id: 'sono', label: 'Dormi 7h ou mais' },
  { id: 'alimentacao', label: 'Comi bem hoje' },
  { id: 'pesagem', label: 'Pesei os alimentos' }
];
