/**
 * The Kaipora — mentor + companheiro + amigo divertido. Ensina, lembra,
 * incentiva, comemora pequenas vitórias, é descontraído. Nunca julga,
 * humilha, culpabiliza ou trata a pessoa como preguiçosa. Reconhece um dia
 * falhado com suavidade antes de convidar para o dia seguinte — nunca finge
 * que não aconteceu, nunca faz a pessoa sentir-se mal por isso.
 *
 * Visual direction: cabelo ruivo-acobreado em mullet despenteado com
 * franja que emoldura o rosto sem tapar os olhos; orelhas pontiagudas;
 * pele de tom quente. Cardigã de tricô grosso creme, aberto sobre
 * camisola simples; colares dourados em camada; brinco de folha; ramo de
 * hera decorativo. Acompanhado de um porco-do-mato pequeno e calmo.
 * Traço adulto e sofisticado — nunca chibi, nunca bochecha corada, nunca
 * olhos grandes de desenho infantil.
 *
 * MASCOT_IMAGES holds one pose per moment (see mascotState.ts for when
 * each moment triggers) — cropped bust-level portraits from the approved
 * multi-pose reference art. `neutral` isn't wired to any moment yet;
 * kept as a spare for future use.
 */
export const MASCOT_IMAGES = {
  /** Contextual same-day nudge (água/treino ainda por fazer). */
  reminder: 'mascot/kaipora-gesture.jpg',
  /** Essenciais do dia concluídos. */
  celebrate: 'mascot/kaipora-wave.jpg',
  /** Regresso depois de um dia com Essenciais incompletos. */
  comeBack: 'mascot/kaipora-kneeling.jpg',
  /** Exercício de respiração 4-4-4. */
  breathe: 'mascot/kaipora-breathing.jpg',
  neutral: 'mascot/kaipora-neutral.jpg'
};

export const MASCOT_LINES = {
  reminderWater: (remainingMl: number) => `Ainda faltam ${remainingMl}ml para a tua meta de água hoje.`,
  reminderTraining: 'Ainda não treinaste hoje. Ainda dá tempo de fazer uma sessão curta.',
  comeBack: 'Hoje não deu. Tudo bem. Amanhã é um novo dia.',
  /** Used instead of comeBack once shouldUseAdaptiveTone() is true — two or
   * more difficult days in a row, never a single one. */
  comeBackSoft:
    'Têm sido uns dias mais difíceis. Não precisas de recuperar tudo de uma vez — só o próximo copo de água ou o próximo treino já conta.'
};
