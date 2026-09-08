/**
 * The Kaipora — mentor + companheiro + amigo divertido. Ensina, lembra,
 * incentiva, comemora pequenas vitórias, é descontraído. Nunca julga,
 * humilha, culpabiliza ou trata a pessoa como preguiçosa. Reconhece um dia
 * falhado com suavidade antes de convidar para o dia seguinte — nunca finge
 * que não aconteceu, nunca faz a pessoa sentir-se mal por isso.
 *
 * Visual direction (closed, referência gerada em Gemini — a arte final em
 * várias poses ainda não existe, só esta direção): cabelo ruivo-acobreado
 * em mullet despenteado com franja que emoldura o rosto sem tapar os
 * olhos; orelhas pontiagudas; pele de tom quente. Cardigã de tricô grosso
 * creme, aberto sobre camisola simples; colares dourados em camada; brinco
 * de folha; ramo de hera decorativo. Acompanhado de um porco-do-mato
 * pequeno e calmo. Traço adulto e sofisticado — nunca chibi, nunca
 * bochecha corada, nunca olhos grandes de desenho infantil.
 *
 * MASCOT_IMAGE is a temporary placeholder (the reference portrait itself)
 * until real art in multiple poses is produced — do not swap it for a
 * generated image without that art existing first.
 */
export const MASCOT_IMAGE = 'mascot/kaipora-placeholder.jpg';

export const MASCOT_LINES = {
  reminderWater: (remainingMl: number) => `Ainda faltam ${remainingMl}ml para a tua meta de água hoje.`,
  reminderTraining: 'Ainda não treinaste hoje. Ainda dá tempo de fazer uma sessão curta.',
  comeBack: 'Hoje não deu. Tudo bem. Amanhã é um novo dia.'
};
