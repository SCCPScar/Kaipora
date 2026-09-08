/**
 * A day is "complete" once every ESSENTIAL is done — currently water and
 * training, the only two items promoted to Essencial in this phase (see
 * README roadmap: Rotina/Habilidades will add more Essenciais later).
 * Importante/Opcional items never block completion — see the Kaipora
 * principle "consistência é mais importante que perfeição": an incomplete
 * optional never turns a day into a failed one.
 *
 * `minDay` is the user's own call, made on a hard day (see toggleMinDay in
 * storage.ts): it shrinks the requirement to just ONE of the two Essenciais
 * instead of both. It never happens automatically — the point is a bad day
 * still counting as a good one when the user says it should, not a rule
 * that quietly lowers the bar.
 */
export interface DayEssentials {
  waterGlasses: number;
  waterGoalGlasses: number;
  trainingDone: boolean;
  minDay?: boolean;
}

export function isDayComplete({ waterGlasses, waterGoalGlasses, trainingDone, minDay }: DayEssentials): boolean {
  const waterDone = waterGlasses >= waterGoalGlasses;
  return minDay ? waterDone || trainingDone : waterDone && trainingDone;
}
