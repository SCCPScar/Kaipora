// Biblioteca de exercícios do Kaipora.
// Base reaproveitada do plano-scar.html original (44 exercícios) + exercícios
// adicionais dedicados ao programa de glúteos (Academia + Casa).
import type { Exercise, ExerciseLike } from './types-training';
import { getCustomExercises } from '../lib/storage';

export const EXERCISES: Record<string, Exercise> = {
  desenvolvimento: {
    id: "desenvolvimento",
    name: "Desenvolvimento com Halteres",
    muscles: ["Ombros", "Tríceps"],
    location: "academia",
    gluteFocus: false,
    desc: "Sente-se num banco com as costas apoiadas. Segure um halter em cada mão ao nível dos ombros com as palmas para a frente. Empurre os halteres para cima até os braços ficarem quase esticados. Desça de forma controlada.",
    tip: "Não trave os cotovelos no topo. Mantenha uma ligeira flexão. Expire ao subir, inspire ao descer."
  },
  elevacao_lateral: {
    id: "elevacao_lateral",
    name: "Elevação Lateral",
    muscles: ["Ombros laterais"],
    location: "academia",
    gluteFocus: false,
    desc: "Em pé ou sentada, segure um halter em cada mão ao lado do corpo. Com os cotovelos levemente dobrados, eleve os braços para os lados até ficarem ao nível dos ombros.",
    tip: "Não use impulso do corpo. Suba só até o nível dos ombros, não mais alto."
  },
  crucifixo: {
    id: "crucifixo",
    name: "Crucifixo com Halteres",
    muscles: ["Peito", "Ombros"],
    location: "academia",
    gluteFocus: false,
    desc: "Deite-se num banco plano com um halter em cada mão. Abra os braços para os lados com uma ligeira flexão no cotovelo, sentindo o alongamento no peito. Junte os halteres em cima de forma controlada.",
    tip: "Imagine que está abraçando uma árvore grande. Mantenha sempre a flexão nos cotovelos."
  },
  triceps_polia: {
    id: "triceps_polia",
    name: "Tríceps na Polia",
    muscles: ["Tríceps"],
    location: "academia",
    gluteFocus: false,
    desc: "Na polia alta do cabo, agarre a barra ou corda com as duas mãos. Com os cotovelos fixos junto ao corpo, empurre a barra para baixo até os braços ficarem completamente esticados. Suba devagar de volta.",
    tip: "Os cotovelos são o pivô: não se movem. Só o antebraço se move. Mantenha o tronco levemente inclinado."
  },
  triceps_extensao: {
    id: "triceps_extensao",
    name: "Extensão de Tríceps Deitada",
    muscles: ["Tríceps"],
    location: "academia",
    gluteFocus: false,
    desc: "Deite-se num banco. Segure os halteres com os braços apontados para o teto. Sem mover os ombros, dobre os cotovelos e desça os pesos em direção à testa. Estenda de volta.",
    tip: "Este exercício se chama skull crusher. Vá devagar! Mantenha os cotovelos apontados para o teto durante todo o movimento."
  },
  puxador_alto: {
    id: "puxador_alto",
    name: "Puxador Alto (Lat Pulldown)",
    muscles: ["Costas (latíssimo)", "Bíceps"],
    location: "academia",
    gluteFocus: false,
    desc: "Sente-se na máquina de puxador alto. Agarre a barra com as mãos um pouco mais largas que os ombros. Puxe a barra para baixo até o peito, contraindo as costas. Deixe subir de forma controlada.",
    tip: "Pense em colocar os cotovelos nos bolsos. Não use as costas para balançar para trás."
  },
  remada_curvada: {
    id: "remada_curvada",
    name: "Remada Curvada com Halteres",
    muscles: ["Costas", "Bíceps", "Ombro traseiro"],
    location: "academia",
    gluteFocus: false,
    desc: "Com os halteres nas mãos, incline o tronco para a frente (cerca de 45°), costas direitas. Puxe os halteres em direção à barriga, contraindo as costas. Baixe de forma controlada.",
    tip: "Mantenha as costas sempre retas. Imagine que quer esmagar um lápis entre as omoplatas."
  },
  remada_unilateral: {
    id: "remada_unilateral",
    name: "Remada Unilateral",
    muscles: ["Costas", "Bíceps"],
    location: "academia",
    gluteFocus: false,
    desc: "Apoie um joelho e uma mão num banco plano. Com a outra mão segure um halter. Puxe o halter em direção ao quadril, mantendo o cotovelo junto ao corpo. Repita do outro lado.",
    tip: "Mantenha as costas paralelas ao chão. Não torça o tronco para ganhar impulso."
  },
  rosca_direta: {
    id: "rosca_direta",
    name: "Rosca Direta com Halteres",
    muscles: ["Bíceps", "Antebraço"],
    location: "academia",
    gluteFocus: false,
    desc: "Em pé, segure um halter em cada mão com as palmas viradas para a frente. Mantendo os cotovelos junto ao corpo, dobre os braços e traga os halteres até os ombros. Desça de forma controlada.",
    tip: "Não balance o corpo para trás! Os cotovelos ficam fixos junto ao tronco. No topo, aperte o bíceps por 1 segundo."
  },
  rosca_martelo: {
    id: "rosca_martelo",
    name: "Rosca Martelo",
    muscles: ["Bíceps", "Braquiorradial"],
    location: "academia",
    gluteFocus: false,
    desc: "Igual à rosca direta, mas as palmas ficam viradas uma para a outra (como se você segurasse um martelo). Alterne os braços.",
    tip: "Trabalha o bíceps num ângulo diferente e o músculo do antebraço, ótimo para dar volume ao braço inteiro."
  },
  agachamento: {
    id: "agachamento",
    name: "Agachamento Livre",
    muscles: ["Quadríceps", "Glúteos", "Posterior de coxa"],
    location: "academia",
    gluteFocus: true,
    desc: "Em pé, pés à largura dos ombros. Dobre os joelhos e desça como se fosse sentar numa cadeira, mantendo as costas retas e o peito para cima. Desça até as coxas ficarem paralelas ao chão.",
    tip: "Os joelhos não devem ultrapassar muito os pés. Mantenha os calcanhares no chão. Olhe para a frente."
  },
  leg_press: {
    id: "leg_press",
    name: "Leg Press (Máquina)",
    muscles: ["Quadríceps", "Glúteos", "Posterior de coxa"],
    location: "academia",
    gluteFocus: true,
    desc: "Na máquina de leg press, posicione os pés na plataforma à largura dos ombros. Empurre a plataforma para cima até os joelhos ficarem quase esticados. Desça de forma controlada até 90°.",
    tip: "Não bloqueie os joelhos completamente! Mantenha sempre uma ligeira flexão. Pés mais altos = mais glúteos."
  },
  extensora: {
    id: "extensora",
    name: "Extensora (Quadríceps)",
    muscles: ["Quadríceps (frente da coxa)"],
    location: "academia",
    gluteFocus: false,
    desc: "Na máquina extensora, sente-se com as costas apoiadas e o apoio no tornozelo. Estenda as pernas até ficarem retas. Desça de forma controlada.",
    tip: "Faça o movimento devagar e controlado, evite usar balanço. No topo, aperte o músculo por 1 segundo."
  },
  cadeira_flexora: {
    id: "cadeira_flexora",
    name: "Cadeira Flexora (Posterior)",
    muscles: ["Posterior de coxa (bíceps femoral)"],
    location: "academia",
    gluteFocus: false,
    desc: "Na máquina de cadeira flexora sentada, posicione o apoio no tornozelo. Puxe as pernas para baixo, dobrando os joelhos. Volte à posição inicial de forma controlada.",
    tip: "Essencial para equilibrar com o trabalho de quadríceps e prevenir lesões nos joelhos."
  },
  abducao_quadril: {
    id: "abducao_quadril",
    name: "Abdução de Quadril (Máquina)",
    muscles: ["Abdutores (lado externo da coxa)", "Glúteo médio"],
    location: "academia",
    gluteFocus: true,
    desc: "Na máquina de abdução (as almofadas ficam por fora das pernas), afaste as pernas para os lados contra a resistência. Volte a fechar devagar.",
    tip: "Diga ao instrutor que quer a máquina de abdução: as almofadas ficam por fora (ao contrário da adução)."
  },
  gluteo_cabo: {
    id: "gluteo_cabo",
    name: "Glúteo no Cabo / Cross",
    muscles: ["Glúteo", "Posterior de coxa"],
    location: "academia",
    gluteFocus: true,
    desc: "No cabo/cross, prenda a argola num tornozelo. Com as mãos apoiando na máquina, chute a perna para trás, contraindo o glúteo. Repita do outro lado.",
    tip: "Não dobre a coluna, o movimento deve ser só da perna. Aperte o glúteo no ponto mais alto por 1 segundo."
  },
  afundo: {
    id: "afundo",
    name: "Afundo (Lunge) com Halteres",
    muscles: ["Quadríceps", "Glúteos", "Posterior de coxa"],
    location: "academia",
    gluteFocus: true,
    desc: "Em pé, dê um passo largo para a frente. Dobre os dois joelhos e desça até o joelho de trás quase tocar no chão. Empurre e volte. Alterne as pernas.",
    tip: "Mantenha o tronco reto. Para começar, faça sem pesos, só com o peso do corpo."
  },
  panturrilha: {
    id: "panturrilha",
    name: "Elevação de Panturrilha",
    muscles: ["Gêmeos (panturrilha)"],
    location: "academia",
    gluteFocus: false,
    desc: "Em pé, eleve os calcanhares do chão, ficando nas pontas dos pés. Mantenha um segundo em cima. Desça de forma controlada.",
    tip: "Pode fazer num degrau de escada para maior amplitude: suba até as pontas e desça deixando o calcanhar ir abaixo do degrau."
  },
  prancha: {
    id: "prancha",
    name: "Prancha Frontal",
    muscles: ["Core (abdômen)", "Lombar", "Ombros"],
    location: "casa",
    gluteFocus: false,
    desc: "Apoie-se nos antebraços e nas pontas dos pés. Mantenha o corpo em linha reta da cabeça aos calcanhares. Não levante o quadril nem deixe a barriga cair.",
    tip: "Imagine que tem uma tábua no seu corpo. Aperte o abdômen como se fosse receber um murro. Respire normalmente!"
  },
  crunch: {
    id: "crunch",
    name: "Crunch / Abdominal Cruzado",
    muscles: ["Abdômen (reto abdominal)", "Oblíquos"],
    location: "casa",
    gluteFocus: false,
    desc: "Deite-se de costas, joelhos dobrados, mãos atrás da cabeça. Levante os ombros do chão, contraindo o abdômen. No cruzado: leve o cotovelo direito ao joelho esquerdo e vice-versa.",
    tip: "Não puxe o pescoço com as mãos! As mãos são só um apoio ligeiro. O movimento vem do abdômen."
  },
  mountain_climber: {
    id: "mountain_climber",
    name: "Mountain Climbers",
    muscles: ["Core", "Cardio", "Quadríceps"],
    location: "casa",
    gluteFocus: false,
    desc: "Na posição de prancha com braços esticados, traga um joelho em direção ao peito rapidamente, depois alterne. Como se estivesse correndo no lugar em posição de prancha.",
    tip: "Mantenha o quadril baixo, não levante o glúteo! Comece devagar e depois acelere."
  },
  flexao: {
    id: "flexao",
    name: "Flexões Adaptadas",
    muscles: ["Peito", "Tríceps", "Ombros", "Core"],
    location: "casa",
    gluteFocus: false,
    desc: "Em posição de prancha com os braços estendidos. Dobre os cotovelos e desça o peito ao chão. Empurre para cima de volta. Se for difícil, faça com os joelhos no chão.",
    tip: "Para começar, faça com os joelhos no chão, não há problema! Os cotovelos ficam a 45° do corpo."
  },
  agachamento_salto: {
    id: "agachamento_salto",
    name: "Agachamento com Salto",
    muscles: ["Quadríceps", "Glúteos", "Cardio"],
    location: "casa",
    gluteFocus: true,
    desc: "Agachamento normal, mas ao subir, exploda num salto. Caia de volta suavemente em posição de agachamento.",
    tip: "Caia sempre com os joelhos levemente dobrados, nunca com as pernas esticadas! Um pouso suave é fundamental."
  },
  elevacao_pernas: {
    id: "elevacao_pernas",
    name: "Elevação de Pernas",
    muscles: ["Abdômen inferior", "Core", "Flexores do quadril"],
    location: "casa",
    gluteFocus: false,
    desc: "Deite-se de costas no chão. Mantendo as pernas juntas e ligeiramente dobradas, eleve-as até ficarem perpendiculares ao chão. Baixe de forma controlada sem deixar tocar no chão.",
    tip: "Se for muito difícil, comece com os joelhos dobrados. Movimento sempre lento e controlado."
  },
  burpee: {
    id: "burpee",
    name: "Burpees",
    muscles: ["Full Body", "Cardio"],
    location: "casa",
    gluteFocus: false,
    desc: "Em pé, agache-se e apoie as mãos no chão. Salte os pés para trás para posição de prancha. Faça uma flexão (opcional). Salte os pés para perto das mãos. Levante-se e salte com os braços para cima.",
    tip: "Exercício muito intenso! Comece devagar e vá ganhando ritmo. Pode tirar o salto final se for muito exigente."
  },
  pull_up: {
    id: "pull_up",
    name: "Dominadas (Pull-ups)",
    muscles: ["Costas (latíssimo)", "Bíceps", "Core"],
    location: "casa",
    gluteFocus: false,
    desc: "Agarre a barra com as palmas para a frente, mãos mais largas que os ombros. Puxe o seu corpo para cima até o queixo ultrapassar a barra. Desça de forma controlada.",
    tip: "Se não consegue fazer uma repetição completa, comece com dominadas negativas: suba com ajuda de um banco e desça devagar em 5 segundos."
  },
  dip: {
    id: "dip",
    name: "Dips de Cadeira / Banco",
    muscles: ["Tríceps", "Ombros", "Peito"],
    location: "casa",
    gluteFocus: false,
    desc: "Sente-se na beira de uma cadeira firme. Coloque as mãos na beira com os dedos para a frente. Deslize o quadril para fora e desça dobrando os cotovelos até os braços formarem 90°. Empurre de volta.",
    tip: "Mantenha o quadril próximo da cadeira durante todo o movimento. Para facilitar, dobre mais os joelhos."
  },
  australian_row: {
    id: "australian_row",
    name: "Remada Invertida (Australian Row)",
    muscles: ["Costas", "Bíceps"],
    location: "casa",
    gluteFocus: false,
    desc: "Deitada por baixo de uma barra fixa ou mesa, agarre a barra com as palmas para fora. O corpo fica em diagonal. Puxe o peito até a barra.",
    tip: "O exercício de costas perfeito para iniciantes antes de passar para as dominadas. Quanto mais horizontal, mais difícil."
  },
  pistol_squat: {
    id: "pistol_squat",
    name: "Pistol Squat (Progressão)",
    muscles: ["Quadríceps", "Glúteos", "Equilíbrio"],
    location: "casa",
    gluteFocus: true,
    desc: "De pé numa perna, estenda a outra para a frente. Desça em agachamento numa perna só até o glúteo tocar o calcanhar. Suba de volta.",
    tip: "Comece apoiando-se numa parede ou segurando algo. É um exercício avançado, treine o agachamento normal primeiro!"
  },
  muscle_up: {
    id: "muscle_up",
    name: "Muscle-Up",
    muscles: ["Costas", "Peito", "Tríceps", "Core"],
    location: "casa",
    gluteFocus: false,
    desc: "A partir de uma dominada, ganhe impulso e passe os cotovelos por cima da barra até ficar em posição de dip. Desça de volta.",
    tip: "Um dos exercícios mais desafiantes da calistenia. Requer dominadas e dips sólidos primeiro. Pratique a transição separadamente."
  },
  handstand_pu: {
    id: "handstand_pu",
    name: "Handstand Push-Up (Parede)",
    muscles: ["Ombros", "Tríceps", "Core"],
    location: "casa",
    gluteFocus: false,
    desc: "Em posição de handstand apoiada na parede, dobre os cotovelos e desça a cabeça ao chão. Empurre de volta.",
    tip: "Comece pela versão pike push-up (pés no chão). Só avance para handstand quando conseguir 15 reps de pike com boa técnica."
  },
  hanging_knee: {
    id: "hanging_knee",
    name: "Knee Raises na Barra",
    muscles: ["Abdômen inferior", "Core", "Agarrar"],
    location: "casa",
    gluteFocus: false,
    desc: "Pendurada na barra, levante os joelhos até a altura do quadril (ou do peito). Desça devagar.",
    tip: "Mantenha os ombros baixos e não use balanço. Evolução natural: joelhos dobrados → pernas esticadas → L-hang."
  },
  pike_push: {
    id: "pike_push",
    name: "Pike Push-Up",
    muscles: ["Ombros", "Tríceps"],
    location: "casa",
    gluteFocus: false,
    desc: "Posição de prancha com os pés próximos das mãos e o quadril elevado (forma de V invertido). Dobre os cotovelos e desça a cabeça ao chão.",
    tip: "Preparação para o handstand push-up. Quanto mais verticais forem as costas, mais trabalham os ombros."
  },
  push_up_plank: {
    id: "push_up_plank",
    name: "Push-Up para Prancha Lateral",
    muscles: ["Peito", "Tríceps", "Core"],
    location: "casa",
    gluteFocus: false,
    desc: "Flexão normal, mas ao chegar ao topo, rode o corpo para o lado levantando um braço para o teto. Alterne os lados.",
    tip: "Ótimo para trabalhar o core durante as flexões. Mantenha o quadril baixo durante a rotação."
  },
  dip_parallel: {
    id: "dip_parallel",
    name: "Dips nas Barras Paralelas",
    muscles: ["Tríceps", "Peito"],
    location: "casa",
    gluteFocus: false,
    desc: "Nas barras paralelas, apoie-se de braços esticados. Dobre os cotovelos e desça. Empurre de volta.",
    tip: "Varie a inclinação do tronco: mais vertical = mais tríceps. Mais inclinado = mais peito."
  },
  squat: {
    id: "squat",
    name: "Agachamento (Sem Equipamento)",
    muscles: ["Quadríceps", "Glúteos", "Posterior de coxa"],
    location: "casa",
    gluteFocus: true,
    desc: "Pés à largura dos ombros. Dobre os joelhos e desça como se fosse sentar numa cadeira imaginária, costas retas, peito para cima, calcanhares no chão.",
    tip: "Para começar, faça agachamentos parciais se sentir dificuldade. Os joelhos seguem a direção dos pés, não os deixe cair para dentro."
  },
  lunge: {
    id: "lunge",
    name: "Afundo (Sem Equipamento)",
    muscles: ["Quadríceps", "Glúteos"],
    location: "casa",
    gluteFocus: true,
    desc: "Em pé, dê um passo largo para a frente. Dobre os dois joelhos e desça até o joelho de trás quase tocar no chão. Empurre e volte. Alterne as pernas.",
    tip: "Tronco ereto. Para iniciantes, faça apoiada numa parede ou cadeira."
  },
  plank: {
    id: "plank",
    name: "Prancha Frontal",
    muscles: ["Core", "Lombar"],
    location: "casa",
    gluteFocus: false,
    desc: "Apoie-se nos antebraços e nas pontas dos pés. Mantenha o corpo em linha reta da cabeça aos calcanhares. Não levante o quadril nem deixe a barriga cair.",
    tip: "Aperte o abdômen! Comece com 20 segundos e vá aumentando gradualmente."
  },
  leg_raise: {
    id: "leg_raise",
    name: "Elevação de Pernas (Chão)",
    muscles: ["Abdômen inferior", "Core"],
    location: "casa",
    gluteFocus: false,
    desc: "Deitada no chão, pernas juntas e ligeiramente dobradas. Eleve-as até ficarem perpendiculares ao chão. Baixe de forma lenta e controlada.",
    tip: "Se for muito difícil, comece com os joelhos dobrados. Movimento sempre lento, não use balanço!"
  },
  glute_bridge: {
    id: "glute_bridge",
    name: "Ponte de Glúteos",
    muscles: ["Glúteos", "Posterior de coxa", "Core"],
    location: "casa",
    gluteFocus: true,
    desc: "Deite-se de costas com os joelhos dobrados e pés no chão. Empurre os calcanhares e eleve o quadril até o corpo formar uma linha reta dos ombros aos joelhos. Aperte os glúteos no topo. Desça devagar.",
    tip: "Para intensificar, faça com uma perna levantada (single leg). Aperte os glúteos no ponto mais alto por 1-2 segundos."
  },
  superman: {
    id: "superman",
    name: "Superman (Extensão de Costas)",
    muscles: ["Lombar", "Glúteos", "Ombros", "Posterior de coxa"],
    location: "casa",
    gluteFocus: true,
    desc: "Deite-se de barriga para baixo com os braços estendidos à frente. Eleve simultaneamente os braços, peito e pernas do chão, como se fosse voar. Mantenha 2 segundos e desça.",
    tip: "Não force o pescoço, olhe para o chão. Excelente para fortalecer as costas e prevenir dores lombares."
  },
  dead_bug: {
    id: "dead_bug",
    name: "Dead Bug (Core Profundo)",
    muscles: ["Core profundo", "Lombar", "Estabilizadores"],
    location: "casa",
    gluteFocus: false,
    desc: "Deite-se de costas com os braços apontados para o teto e joelhos dobrados a 90°. Baixe simultaneamente o braço direito atrás da cabeça e a perna esquerda até quase tocar no chão. Volte e alterne.",
    tip: "Mantenha sempre as costas coladas ao chão. Este é o exercício mais eficaz para o core profundo. Vá devagar!"
  },
  tricep_dip: {
    id: "tricep_dip",
    name: "Dips de Cadeira (Tríceps)",
    muscles: ["Tríceps", "Ombros"],
    location: "casa",
    gluteFocus: false,
    desc: "Sente-se na beira de uma cadeira firme. Mãos na beira com os dedos para a frente. Deslize o quadril para fora e desça dobrando os cotovelos. Empurre de volta.",
    tip: "Para facilitar, dobre mais os joelhos. Para dificultar, estique as pernas completamente."
  },
  calf_raise: {
    id: "calf_raise",
    name: "Elevação de Panturrilha (Casa)",
    muscles: ["Gêmeos (panturrilha)", "Solhar"],
    location: "casa",
    gluteFocus: false,
    desc: "Em pé com os pés à largura dos ombros. Eleve os calcanhares do chão ficando nas pontas dos pés. Mantenha 1 segundo. Desça de forma controlada. Pode se apoiar numa parede para equilíbrio.",
    tip: "Para maior amplitude, faça num degrau de escada: suba até as pontas e desça deixando o calcanhar ir abaixo do degrau."
  },
  hip_thrust: {
    id: "hip_thrust",
    name: "Hip Thrust (Elevação de Anca)",
    muscles: ["Glúteo máximo"],
    location: "academia",
    gluteFocus: true,
    desc: "Sente-se no chão com as costas apoiadas na borda de um banco, joelhos dobrados e pés apoiados no chão. Coloque uma barra ou halter sobre o quadril (use um step ou toalha para proteger). Empurre o quadril para cima até o corpo ficar reto dos ombros aos joelhos, contraindo bem o glúteo no topo. Desça controlado.",
    tip: "É o exercício rei para o glúteo máximo. Aperte o glúteo com força no topo durante 1-2 segundos antes de descer. A contração importa mais do que a carga."
  },
  gluteo_maquina: {
    id: "gluteo_maquina",
    name: "Extensão de Anca na Máquina (Glute Machine)",
    muscles: ["Glúteo máximo"],
    location: "academia",
    gluteFocus: true,
    desc: "Ajuste a máquina de extensão de quadril/glúteo. Coloque o pé na plataforma com o joelho ligeiramente dobrado. Empurre para trás e para baixo, estendendo o quadril, contraindo o glúteo. Volte controlado sem deixar o peso bater.",
    tip: "Mantenha o tronco estável, evite usar as costas para compensar. O movimento vem só do quadril."
  },
  elevacao_pelvica_maquina: {
    id: "elevacao_pelvica_maquina",
    name: "Elevação Pélvica Guiada (Smith/Máquina)",
    muscles: ["Glúteo máximo", "Posterior de coxa"],
    location: "academia",
    gluteFocus: true,
    desc: "Deite-se no chão com a barra guiada apoiada no quadril (use proteção). Pés à largura dos ombros, joelhos dobrados. Empurre o quadril para cima até estender completamente, aperte o glúteo, desça controlado sem tocar o chão entre repetições.",
    tip: "Versão do hip thrust com maior estabilidade, ótima para progredir carga com segurança."
  },
  stiff_halteres: {
    id: "stiff_halteres",
    name: "Levantamento Terra Romeno (Stiff) com Halteres",
    muscles: ["Posterior de coxa", "Glúteos", "Lombar"],
    location: "academia",
    gluteFocus: true,
    desc: "Em pé, halteres à frente das coxas. Com joelhos quase esticados (ligeira flexão), incline o tronco à frente empurrando o quadril para trás, deixando os halteres deslizarem pelas pernas até sentir o alongamento no posterior da coxa. Volte à posição inicial contraindo o glúteo.",
    tip: "As costas se mantêm sempre direitas. O movimento é no quadril, não na coluna. Se sentir a lombar curvando, reduza a amplitude."
  },
  step_up_banco: {
    id: "step_up_banco",
    name: "Step-Up com Halteres",
    muscles: ["Glúteos", "Quadríceps"],
    location: "academia",
    gluteFocus: true,
    desc: "Com um halter em cada mão, suba para cima de um banco ou step com uma perna, empurrando pelo calcanhar e contraindo o glúteo no topo. Desça controlada pela mesma perna. Alterne ou complete todas as repetições de um lado antes de trocar.",
    tip: "Evite empurrar com a perna de trás. O trabalho deve vir da perna que está em cima do banco."
  },
  abducao_deitada_cabo: {
    id: "abducao_deitada_cabo",
    name: "Abdução de Anca no Cabo (em pé)",
    muscles: ["Glúteo médio"],
    location: "academia",
    gluteFocus: true,
    desc: "Prenda uma caneleira de cabo no tornozelo, de lado para a máquina. Com a perna quase esticada, afaste-a lateralmente contra a resistência do cabo, contraindo o glúteo médio. Volte controlada.",
    tip: "Mantenha o tronco estável e não use balanço. Isola o glúteo médio, importante para a forma e estabilidade do quadril."
  },
  ponte_gluteo_unilateral: {
    id: "ponte_gluteo_unilateral",
    name: "Ponte de Glúteos Unilateral",
    muscles: ["Glúteo máximo"],
    location: "casa",
    gluteFocus: true,
    desc: "Deitada de costas, joelhos dobrados, pés apoiados no chão. Estenda uma perna apontando para o teto. Empurre o quadril para cima usando apenas a perna apoiada, contraindo o glúteo no topo. Desça controlada. Complete as repetições e troque de perna.",
    tip: "Se for muito difícil, mantenha as duas mãos apoiadas no chão para equilíbrio. Para dificultar, adicione uma pausa de 2s no topo."
  },
  elevacao_quadril_elastico: {
    id: "elevacao_quadril_elastico",
    name: "Elevação de Quadril com Elástico (Hip Thrust em casa)",
    muscles: ["Glúteo máximo"],
    location: "casa",
    gluteFocus: true,
    desc: "Deitada de costas com as costas apoiadas numa cadeira ou sofá baixo, elástico de resistência colocado por cima do quadril e preso ao chão ou segurado pelas mãos. Empurre o quadril para cima contra a resistência, aperte o glúteo, desça controlada.",
    tip: "Sem elástico também funciona muito bem: use só o peso do corpo e foque na contração máxima no topo."
  },
  caminhada_lateral_elastico: {
    id: "caminhada_lateral_elastico",
    name: "Caminhada Lateral com Elástico (Monster Walk)",
    muscles: ["Glúteo médio"],
    location: "casa",
    gluteFocus: true,
    desc: "Coloque um elástico de resistência ao redor dos tornozelos ou acima dos joelhos. Fique em meio-agachamento e dê passos laterais mantendo tensão constante no elástico, sem deixar os joelhos colapsarem para dentro.",
    tip: "Sem elástico, faça o mesmo movimento em meio-agachamento focando em manter os joelhos alinhados com os pés. A intenção do movimento já ativa o glúteo médio."
  },
  frog_pump: {
    id: "frog_pump",
    name: "Frog Pump (Ponte de Rã)",
    muscles: ["Glúteo máximo"],
    location: "casa",
    gluteFocus: true,
    desc: "Deitada de costas, sola dos pés unidas e joelhos abertos para os lados (posição de rã). Empurre o quadril para cima apertando o glúteo no topo, desça controlada sem deixar o quadril tocar completamente no chão entre repetições.",
    tip: "Amplitude curta, mas intensa: foque-se em apertar bem o glúteo no topo em vez de ir rápido."
  },
  donkey_kick: {
    id: "donkey_kick",
    name: "Donkey Kick (Coice de Glúteo)",
    muscles: ["Glúteo máximo"],
    location: "casa",
    gluteFocus: true,
    desc: "De quatro apoios (mãos e joelhos no chão), mantenha o joelho a 90° e eleve uma perna para trás e para cima, empurrando com a sola do pé em direção ao teto. Contraia o glúteo no topo e desça controlada sem deixar o joelho tocar no chão.",
    tip: "Não use a lombar para ganhar altura. A amplitude é menor do que parece, mantenha o core firme."
  },
  fire_hydrant: {
    id: "fire_hydrant",
    name: "Fire Hydrant (Abdução em 4 Apoios)",
    muscles: ["Glúteo médio"],
    location: "casa",
    gluteFocus: true,
    desc: "De quatro apoios, mantenha o joelho dobrado a 90° e eleve a perna lateralmente, como um cachorro levantando a perna, mantendo o quadril estável e o tronco parado. Volte controlada.",
    tip: "Movimento pequeno e controlado, evite rodar o tronco para ganhar amplitude extra."
  },
  sumo_squat_casa: {
    id: "sumo_squat_casa",
    name: "Agachamento Sumo (Sem Equipamento)",
    muscles: ["Glúteos", "Interior de coxa"],
    location: "casa",
    gluteFocus: true,
    desc: "Pés bem afastados, mais largos que os ombros, pontas viradas para fora. Desça dobrando joelhos e quadril, mantendo o tronco direito, até as coxas ficarem paralelas ao chão. Suba empurrando pelos calcanhares e apertando o glúteo.",
    tip: "A postura mais larga recruta mais o glúteo e o interior da coxa do que o agachamento normal. Pode segurar um objeto pesado de casa (mochila, galão de água) na frente do peito para aumentar a dificuldade."
  },
  step_up_casa: {
    id: "step_up_casa",
    name: "Step-Up em Escada/Banco (Casa)",
    muscles: ["Glúteos", "Quadríceps"],
    location: "casa",
    gluteFocus: true,
    desc: "Use um degrau de escada, banco ou step estável. Suba com uma perna, empurrando pelo calcanhar e apertando o glúteo no topo, desça controlada pela mesma perna. Pode segurar galões de água para adicionar peso.",
    tip: "Escolha uma altura que sinta segura e estável. Quanto mais alto o degrau, mais intenso para o glúteo."
  },
};

/** Looks up an exercise id in the built-in library first, then in the
 * user's custom exercises — used wherever a WorkoutExercise (built-in or
 * from a CustomWorkout) needs its display details. */
export function getExerciseById(id: string): ExerciseLike | undefined {
  return EXERCISES[id] ?? getCustomExercises().find((e) => e.id === id);
}
