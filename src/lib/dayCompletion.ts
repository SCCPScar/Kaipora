/**
 * A day is "complete" once every ESSENTIAL is done — currently water and
 * training, the only two items promoted to Essencial in this phase (see
 * README roadmap: Rotina/Habilidades will add more Essenciais later).
 * Importante/Opcional items never block completion — see the Kaipora
 * principle "consistência é mais importante que perfeição": an incomplete
 * optional never turns a day into a failed one.
 */
export interface DayEssentials {
  waterGlasses: number;
  waterGoalGlasses: number;
  trainingDone: boolean;
}

export function isDayComplete({ waterGlasses, waterGoalGlasses, trainingDone }: DayEssentials): boolean {
  const waterDone = waterGlasses >= waterGoalGlasses;
  return waterDone && trainingDone;
}
