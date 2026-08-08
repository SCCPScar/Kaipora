// Biblioteca de exercícios do VProject.
// Base reaproveitada do plano-scar.html original (44 exercícios) + exercícios
// adicionais dedicados ao programa de glúteos (Academia + Casa).
import type { Exercise } from './types-training';

export const EXERCISES: Record<string, Exercise> = {
  desenvolvimento: {
    id: "desenvolvimento",
    name: "Desenvolvimento com Halteres",
    muscles: ["Ombros", "Tríceps"],
    location: "academia",
    gluteFocus: false,
    desc: "Senta-te num banco com as costas apoiadas. Segura um halter em cada mão ao nível dos ombros com as palmas para a frente. Empurra os halteres para cima até os braços ficarem quase esticados. Desce de forma controlada.",
    tip: "Não trava os cotovelos no topo — mantém uma ligeira flexão. Expira ao subir, inspira ao descer."
  },
  elevacao_lateral: {
    id: "elevacao_lateral",
    name: "Elevação Lateral",
    muscles: ["Ombros laterais"],
    location: "academia",
    gluteFocus: false,
    desc: "Em pé ou sentada, segura um halter em cada mão ao lado do corpo. Com os cotovelos levemente dobrados, eleva os braços para os lados até ficarem ao nível dos ombros.",
    tip: "Não uses momentum do corpo. Sobe só até ao nível dos ombros — não mais alto."
  },
  crucifixo: {
    id: "crucifixo",
    name: "Crucifixo com Halteres",
    muscles: ["Peito", "Ombros"],
    location: "academia",
    gluteFocus: false,
    desc: "Deita-te num banco plano com um halter em cada mão. Abre os braços para os lados com uma ligeira flexão no cotovelo, sentindo o alongamento no peito. Junta os halteres em cima de forma controlada.",
    tip: "Imagina que estás a abraçar uma árvore grande. Mantém sempre a flexão nos cotovelos."
  },
  triceps_polia: {
    id: "triceps_polia",
    name: "Tríceps na Polia",
    muscles: ["Tríceps"],
    location: "academia",
    gluteFocus: false,
    desc: "Na polia alta do cabo, agarra a barra ou corda com as duas mãos. Com os cotovelos fixos junto ao corpo, empurra a barra para baixo até os braços ficarem completamente esticados. Sobe devagar de volta.",
    tip: "Os cotovelos são o pivô — não se movem. Só o antebraço se move. Mantém o tronco levemente inclinado."
  },
  triceps_extensao: {
    id: "triceps_extensao",
    name: "Extensão de Tríceps Deitada",
    muscles: ["Tríceps"],
    location: "academia",
    gluteFocus: false,
    desc: "Deita-te num banco. Segura os halteres com os braços apontados para o teto. Sem mover os ombros, dobra os cotovelos e desce os pesos em direção à testa. Estende de volta.",
    tip: "Este exercício chama-se skull crusher — vai devagar! Mantém os cotovelos apontados para o teto durante todo o movimento."
  },
  puxador_alto: {
    id: "puxador_alto",
    name: "Puxador Alto (Lat Pulldown)",
    muscles: ["Costas (latíssimo)", "Bíceps"],
    location: "academia",
    gluteFocus: false,
    desc: "Senta-te na máquina de puxador alto. Agarra a barra com as mãos um pouco mais largas que os ombros. Puxa a barra para baixo até ao peito, contraindo as costas. Deixa subir de forma controlada.",
    tip: "Pensa em colocar os cotovelos nos bolsos. Não uses as costas para balançar para trás."
  },
  remada_curvada: {
    id: "remada_curvada",
    name: "Remada Curvada com Halteres",
    muscles: ["Costas", "Bíceps", "Ombro traseiro"],
    location: "academia",
    gluteFocus: false,
    desc: "Com os halteres nas mãos, inclina o tronco para a frente (cerca de 45°), costas direitas. Puxa os halteres em direção à barriga, contraindo as costas. Baixa de forma controlada.",
    tip: "Mantém as costas sempre retas. Imagina que queres esmagar um lápis entre as omoplatas."
  },
  remada_unilateral: {
    id: "remada_unilateral",
    name: "Remada Unilateral",
    muscles: ["Costas", "Bíceps"],
    location: "academia",
    gluteFocus: false,
    desc: "Apoia um joelho e uma mão num banco plano. Com a outra mão segura um halter. Puxa o halter em direção à anca, mantendo o cotovelo junto ao corpo. Repete do outro lado.",
    tip: "Mantém as costas paralelas ao chão. Não torças o tronco para ganhar impulso."
  },
  rosca_direta: {
    id: "rosca_direta",
    name: "Rosca Direta com Halteres",
    muscles: ["Bíceps", "Antebraço"],
    location: "academia",
    gluteFocus: false,
    desc: "Em pé, segura um halter em cada mão com as palmas viradas para a frente. Mantendo os cotovelos junto ao corpo, dobra os braços e traz os halteres até aos ombros. Desce de forma controlada.",
    tip: "Não balances o corpo para trás! Os cotovelos ficam fixos junto ao tronco. No topo aperta o bíceps 1 segundo."
  },
  rosca_martelo: {
    id: "rosca_martelo",
    name: "Rosca Martelo",
    muscles: ["Bíceps", "Braquiorradial"],
    location: "academia",
    gluteFocus: false,
    desc: "Igual à rosca direta mas as palmas ficam viradas uma para a outra (como se segurasses um martelo). Alterna os braços.",
    tip: "Trabalha o bíceps num ângulo diferente e o músculo do antebraço — ótimo para dar volume ao braço inteiro."
  },
  agachamento: {
    id: "agachamento",
    name: "Agachamento Livre",
    muscles: ["Quadríceps", "Glúteos", "Posterior de coxa"],
    location: "academia",
    gluteFocus: true,
    desc: "Em pé, pés à largura dos ombros. Dobra os joelhos e desce como se fosses sentar numa cadeira, mantendo as costas retas e o peito para cima. Desce até as coxas ficarem paralelas ao chão.",
    tip: "Os joelhos não devem ultrapassar muito os pés. Mantém os calcanhares no chão. Olha para a frente."
  },
  leg_press: {
    id: "leg_press",
    name: "Leg Press (Máquina)",
    muscles: ["Quadríceps", "Glúteos", "Posterior de coxa"],
    location: "academia",
    gluteFocus: true,
    desc: "Na máquina de leg press, posiciona os pés na plataforma à largura dos ombros. Empurra a plataforma para cima até os joelhos ficarem quase esticados. Desce de forma controlada até 90°.",
    tip: "Não bloqueies os joelhos completamente! Mantém sempre uma ligeira flexão. Pés mais altos = mais glúteos."
  },
  extensora: {
    id: "extensora",
    name: "Extensora (Quadríceps)",
    muscles: ["Quadríceps (frente da coxa)"],
    location: "academia",
    gluteFocus: false,
    desc: "Na máquina extensora, senta-te com as costas apoiadas e o apoio no tornozelo. Estende as pernas até ficarem retas. Desce de forma controlada.",
    tip: "Faz o movimento devagar e controlado — evita usar balanço. No topo aperta o músculo por 1 segundo."
  },
  cadeira_flexora: {
    id: "cadeira_flexora",
    name: "Cadeira Flexora (Posterior)",
    muscles: ["Posterior de coxa (bíceps femoral)"],
    location: "academia",
    gluteFocus: false,
    desc: "Na máquina de cadeira flexora sentada, posiciona o apoio no tornozelo. Puxa as pernas para baixo, dobrando os joelhos. Volta à posição inicial de forma controlada.",
    tip: "Essencial para equilibrar com o trabalho de quadríceps e prevenir lesões nos joelhos."
  },
  abducao_quadril: {
    id: "abducao_quadril",
    name: "Abdução de Quadril (Máquina)",
    muscles: ["Abdutores (lado externo da coxa)", "Glúteo médio"],
    location: "academia",
    gluteFocus: true,
    desc: "Na máquina de abdução (as almofadas ficam por fora das pernas), afasta as pernas para os lados contra a resistência. Volta a fechar devagar.",
    tip: "Diz ao instrutor que queres a máquina de abdução — as almofadas ficam por fora (ao contrário da adução)."
  },
  gluteo_cabo: {
    id: "gluteo_cabo",
    name: "Glúteo no Cabo / Cross",
    muscles: ["Glúteo", "Posterior de coxa"],
    location: "academia",
    gluteFocus: true,
    desc: "No cabo/cross, prende a argola num tornozelo. Com as mãos a apoiar na máquina, chuta a perna para trás, contraindo o glúteo. Repete do outro lado.",
    tip: "Não dobres a coluna — o movimento deve ser só da perna. Aperta o glúteo no ponto mais alto por 1 segundo."
  },
  afundo: {
    id: "afundo",
    name: "Afundo (Lunge) com Halteres",
    muscles: ["Quadríceps", "Glúteos", "Posterior de coxa"],
    location: "academia",
    gluteFocus: true,
    desc: "Em pé, dá um passo largo para a frente. Dobra os dois joelhos e desce até o joelho de trás quase tocar no chão. Empurra e volta. Alterna as pernas.",
    tip: "Mantém o tronco reto. Para começar faz sem pesos, só com o peso do corpo."
  },
  panturrilha: {
    id: "panturrilha",
    name: "Elevação de Panturrilha",
    muscles: ["Gémeos (panturrilha)"],
    location: "academia",
    gluteFocus: false,
    desc: "Em pé, eleva os calcanhares do chão, ficando nas pontas dos pés. Mantém um segundo em cima. Desce de forma controlada.",
    tip: "Podes fazer numa degrau de escada para maior amplitude — sobe até às pontas e desce deixando o calcanhar ir abaixo da degrau."
  },
  prancha: {
    id: "prancha",
    name: "Prancha Frontal",
    muscles: ["Core (abdómen)", "Lombar", "Ombros"],
    location: "casa",
    gluteFocus: false,
    desc: "Apoia-te nos antebraços e nas pontas dos pés. Mantém o corpo em linha reta da cabeça aos calcanhares. Não levantes o rabo nem deixes a barriga cair.",
    tip: "Imagina que tens uma tábua no teu corpo. Aperta o abdómen como se fosses receber um murro. Respira normalmente!"
  },
  crunch: {
    id: "crunch",
    name: "Crunch / Abdominal Cruzado",
    muscles: ["Abdómen (reto abdominal)", "Oblíquos"],
    location: "casa",
    gluteFocus: false,
    desc: "Deita-te de costas, joelhos dobrados, mãos atrás da cabeça. Levanta os ombros do chão, contraindo o abdómen. No cruzado: leva o cotovelo direito ao joelho esquerdo e vice-versa.",
    tip: "Não puxes o pescoço com as mãos! As mãos são só apoio ligeiro. O movimento vem do abdómen."
  },
  mountain_climber: {
    id: "mountain_climber",
    name: "Mountain Climbers",
    muscles: ["Core", "Cardio", "Quadríceps"],
    location: "casa",
    gluteFocus: false,
    desc: "Na posição de prancha com braços esticados, traz um joelho em direção ao peito rapidamente, depois alterna. Como se estivesses a correr no lugar em posição de prancha.",
    tip: "Mantém as ancas baixas — não levantes o rabo! Começa devagar e depois acelera."
  },
  flexao: {
    id: "flexao",
    name: "Flexões Adaptadas",
    muscles: ["Peito", "Tríceps", "Ombros", "Core"],
    location: "casa",
    gluteFocus: false,
    desc: "Em posição de prancha com os braços estendidos. Dobra os cotovelos e desce o peito ao chão. Empurra para cima de volta. Se for difícil, faz com os joelhos no chão.",
    tip: "Para começar faz com os joelhos no chão — não há problema! Os cotovelos ficam a 45° do corpo."
  },
  agachamento_salto: {
    id: "agachamento_salto",
    name: "Agachamento com Salto",
    muscles: ["Quadríceps", "Glúteos", "Cardio"],
    location: "casa",
    gluteFocus: true,
    desc: "Agachamento normal, mas ao subir explodes num salto. Cai de volta suavemente em posição de agachamento.",
    tip: "Cai sempre com os joelhos levemente dobrados — nunca com as pernas esticadas! Aterragem suave é fundamental."
  },
  elevacao_pernas: {
    id: "elevacao_pernas",
    name: "Elevação de Pernas",
    muscles: ["Abdómen inferior", "Core", "Flexores da anca"],
    location: "casa",
    gluteFocus: false,
    desc: "Deita-te plana no chão. Mantendo as pernas juntas e ligeiramente dobradas, eleva-as até ficarem perpendiculares ao chão. Baixa de forma controlada sem deixar tocar no chão.",
    tip: "Se for muito difícil, começa com os joelhos dobrados. Movimento sempre lento e controlado."
  },
  burpee: {
    id: "burpee",
    name: "Burpees",
    muscles: ["Full Body", "Cardio"],
    location: "casa",
    gluteFocus: false,
    desc: "Em pé, agacha-te e apoia as mãos no chão. Salta os pés para trás para posição de prancha. Faz uma flexão (opcional). Salta os pés para perto das mãos. Levanta-te e salta com os braços para cima.",
    tip: "Exercício muito intenso! Começa devagar e vai ganhando ritmo. Podes tirar o salto final se for demasiado exigente."
  },
  pull_up: {
    id: "pull_up",
    name: "Dominadas (Pull-ups)",
    muscles: ["Costas (latíssimo)", "Bíceps", "Core"],
    location: "casa",
    gluteFocus: false,
    desc: "Agarra a barra com as palmas para a frente, mãos mais largas que os ombros. Puxa o teu corpo para cima até o queixo ultrapassar a barra. Desce de forma controlada.",
    tip: "Se não consegues fazer uma repetição completa, começa com dominadas negativas: sobe com ajuda de um banco e desce devagar em 5 segundos."
  },
  dip: {
    id: "dip",
    name: "Dips de Cadeira / Banco",
    muscles: ["Tríceps", "Ombros", "Peito"],
    location: "casa",
    gluteFocus: false,
    desc: "Senta-te na beira de uma cadeira firme. Coloca as mãos na beira com os dedos para a frente. Desliza o rabo para fora e desce dobrando os cotovelos até os braços formarem 90°. Empurra de volta.",
    tip: "Mantém o rabo próximo da cadeira durante todo o movimento. Para facilitar, dobra mais os joelhos."
  },
  australian_row: {
    id: "australian_row",
    name: "Remada Invertida (Australian Row)",
    muscles: ["Costas", "Bíceps"],
    location: "casa",
    gluteFocus: false,
    desc: "Deitada por baixo de uma barra fixa ou mesa, agarra a barra com as palmas para fora. O corpo fica em diagonal. Puxa o peito até à barra.",
    tip: "O exercício de costas perfeito para iniciantes antes de passar para as dominadas. Quanto mais horizontal, mais difícil."
  },
  pistol_squat: {
    id: "pistol_squat",
    name: "Pistol Squat (Progressão)",
    muscles: ["Quadríceps", "Glúteos", "Equilíbrio"],
    location: "casa",
    gluteFocus: true,
    desc: "De pé numa perna, estende a outra para a frente. Desce em agachamento numa perna só até o glúteo tocar o calcanhar. Sobe de volta.",
    tip: "Começa apoiando-te numa parede ou segurando algo. É um exercício avançado — treina o agachamento normal primeiro!"
  },
  muscle_up: {
    id: "muscle_up",
    name: "Muscle-Up",
    muscles: ["Costas", "Peito", "Tríceps", "Core"],
    location: "casa",
    gluteFocus: false,
    desc: "A partir de uma dominada, ganha impulso e passa os cotovelos por cima da barra até ficares em posição de dip. Desce de volta.",
    tip: "Um dos exercícios mais desafiantes da calistenia. Requer dominadas e dips sólidos primeiro. Pratica a transição separadamente."
  },
  handstand_pu: {
    id: "handstand_pu",
    name: "Handstand Push-Up (Parede)",
    muscles: ["Ombros", "Tríceps", "Core"],
    location: "casa",
    gluteFocus: false,
    desc: "Em posição de handstand apoiada na parede, dobra os cotovelos e desce a cabeça ao chão. Empurra de volta.",
    tip: "Começa pela versão pike push-up (pés no chão). Só avança para handstand quando conseguires 15 reps de pike com boa técnica."
  },
  hanging_knee: {
    id: "hanging_knee",
    name: "Knee Raises na Barra",
    muscles: ["Abdómen inferior", "Core", "Agarrar"],
    location: "casa",
    gluteFocus: false,
    desc: "Pendurada na barra, levanta os joelhos até à altura da anca (ou do peito). Desce devagar.",
    tip: "Mantém os ombros baixos e não uses balanço. Evolução natural: joelhos dobrados → pernas esticadas → L-hang."
  },
  pike_push: {
    id: "pike_push",
    name: "Pike Push-Up",
    muscles: ["Ombros", "Tríceps"],
    location: "casa",
    gluteFocus: false,
    desc: "Posição de prancha com os pés próximos das mãos e o rabo elevado (forma de V invertido). Dobra os cotovelos e desce a cabeça ao chão.",
    tip: "Preparação para o handstand push-up. Quanto mais verticais forem as costas, mais trabalham os ombros."
  },
  push_up_plank: {
    id: "push_up_plank",
    name: "Push-Up para Prancha Lateral",
    muscles: ["Peito", "Tríceps", "Core"],
    location: "casa",
    gluteFocus: false,
    desc: "Flexão normal mas ao chegar ao topo, roda o corpo para o lado levantando um braço para o teto. Alterna os lados.",
    tip: "Ótimo para trabalhar o core durante as flexões. Mantém as ancas baixas durante a rotação."
  },
  dip_parallel: {
    id: "dip_parallel",
    name: "Dips nas Barras Paralelas",
    muscles: ["Tríceps", "Peito"],
    location: "casa",
    gluteFocus: false,
    desc: "Nas barras paralelas, apoia-te de braços esticados. Dobra os cotovelos e desce. Empurra de volta.",
    tip: "Varia a inclinação do tronco: mais vertical = mais tríceps. Mais inclinado = mais peito."
  },
  squat: {
    id: "squat",
    name: "Agachamento (Sem Equipamento)",
    muscles: ["Quadríceps", "Glúteos", "Posterior de coxa"],
    location: "casa",
    gluteFocus: true,
    desc: "Pés à largura dos ombros. Dobra os joelhos e desce como se fosses sentar numa cadeira imaginária, costas retas, peito para cima, calcanhares no chão.",
    tip: "Para começar faz agachamentos parciais se sentires dificuldade. Os joelhos seguem a direção dos pés — não os deixes cair para dentro."
  },
  lunge: {
    id: "lunge",
    name: "Afundo (Sem Equipamento)",
    muscles: ["Quadríceps", "Glúteos"],
    location: "casa",
    gluteFocus: true,
    desc: "Em pé, dá um passo largo para a frente. Dobra os dois joelhos e desce até o joelho de trás quase tocar no chão. Empurra e volta. Alterna as pernas.",
    tip: "Tronco ereto. Para iniciantes faz apoiada numa parede ou cadeira."
  },
  plank: {
    id: "plank",
    name: "Prancha Frontal",
    muscles: ["Core", "Lombar"],
    location: "casa",
    gluteFocus: false,
    desc: "Apoia-te nos antebraços e nas pontas dos pés. Mantém o corpo em linha reta da cabeça aos calcanhares. Não levantes o rabo nem deixes a barriga cair.",
    tip: "Aperta o abdómen! Começa com 20 segundos e vai aumentando gradualmente."
  },
  leg_raise: {
    id: "leg_raise",
    name: "Elevação de Pernas (Chão)",
    muscles: ["Abdómen inferior", "Core"],
    location: "casa",
    gluteFocus: false,
    desc: "Deitada no chão, pernas juntas e ligeiramente dobradas. Eleva-as até ficarem perpendiculares ao chão. Baixa de forma lenta e controlada.",
    tip: "Se for muito difícil, começa com os joelhos dobrados. Movimento sempre lento — não uses balanço!"
  },
  glute_bridge: {
    id: "glute_bridge",
    name: "Ponte de Glúteos",
    muscles: ["Glúteos", "Posterior de coxa", "Core"],
    location: "casa",
    gluteFocus: true,
    desc: "Deita-te de costas com os joelhos dobrados e pés no chão. Empurra os calcanhares e eleva as ancas até o corpo formar uma linha reta dos ombros aos joelhos. Aperta os glúteos no topo. Desce devagar.",
    tip: "Para intensificar, faz com uma perna levantada (single leg). Aperta os glúteos no ponto mais alto por 1-2 segundos."
  },
  superman: {
    id: "superman",
    name: "Superman (Extensão de Costas)",
    muscles: ["Lombar", "Glúteos", "Ombros", "Posterior de coxa"],
    location: "casa",
    gluteFocus: true,
    desc: "Deita-te de barriga para baixo com os braços estendidos à frente. Eleva simultaneamente os braços, peito e pernas do chão, como se fosses voar. Mantém 2 segundos e desce.",
    tip: "Não forces o pescoço — olha para o chão. Excelente para fortalecer as costas e prevenir dores lombares."
  },
  dead_bug: {
    id: "dead_bug",
    name: "Dead Bug (Core Profundo)",
    muscles: ["Core profundo", "Lombar", "Estabilizadores"],
    location: "casa",
    gluteFocus: false,
    desc: "Deita-te de costas com os braços apontados para o teto e joelhos dobrados a 90°. Baixa simultaneamente o braço direito atrás da cabeça e a perna esquerda até quase tocar no chão. Volta e alterna.",
    tip: "Mantém sempre as costas coladas ao chão. Este é o exercício mais eficaz para o core profundo. Vai devagar!"
  },
  tricep_dip: {
    id: "tricep_dip",
    name: "Dips de Cadeira (Tríceps)",
    muscles: ["Tríceps", "Ombros"],
    location: "casa",
    gluteFocus: false,
    desc: "Senta-te na beira de uma cadeira firme. Mãos na beira com os dedos para a frente. Desliza o rabo para fora e desce dobrando os cotovelos. Empurra de volta.",
    tip: "Para facilitar dobra mais os joelhos. Para dificultar, estica as pernas completamente."
  },
  calf_raise: {
    id: "calf_raise",
    name: "Elevação de Panturrilha (Casa)",
    muscles: ["Gémeos (panturrilha)", "Solhar"],
    location: "casa",
    gluteFocus: false,
    desc: "Em pé com os pés à largura dos ombros. Eleva os calcanhares do chão ficando nas pontas dos pés. Mantém 1 segundo. Desce de forma controlada. Podes apoiar-te numa parede para equilíbrio.",
    tip: "Para maior amplitude, faz numa degrau de escada — sobe até às pontas e desce deixando o calcanhar ir abaixo da degrau."
  },
  hip_thrust: {
    id: "hip_thrust",
    name: "Hip Thrust (Elevação de Anca)",
    muscles: ["Glúteo máximo"],
    location: "academia",
    gluteFocus: true,
    desc: "Senta-te no chão com as costas apoiadas na borda de um banco, joelhos dobrados e pés apoiados no chão. Coloca uma barra ou halter sobre a anca (usa um step ou toalha para proteger). Empurra a anca para cima até o corpo ficar reto dos ombros aos joelhos, contraindo bem o glúteo no topo. Desce controlado.",
    tip: "É o exercício rei para o glúteo máximo. Aperta o glúteo com força no topo durante 1-2 segundos antes de descer — a contração importa mais do que a carga."
  },
  gluteo_maquina: {
    id: "gluteo_maquina",
    name: "Extensão de Anca na Máquina (Glute Machine)",
    muscles: ["Glúteo máximo"],
    location: "academia",
    gluteFocus: true,
    desc: "Ajusta a máquina de extensão de anca/glúteo. Coloca o pé na plataforma com o joelho ligeiramente dobrado. Empurra para trás e para baixo, estendendo a anca, contraindo o glúteo. Volta controlada sem deixar o peso bater.",
    tip: "Mantém o tronco estável, evita usar as costas para compensar. O movimento vem só da anca."
  },
  elevacao_pelvica_maquina: {
    id: "elevacao_pelvica_maquina",
    name: "Elevação Pélvica Guiada (Smith/Máquina)",
    muscles: ["Glúteo máximo", "Posterior de coxa"],
    location: "academia",
    gluteFocus: true,
    desc: "Deita-te no chão com a barra guiada apoiada na anca (usa proteção). Pés à largura dos ombros, joelhos dobrados. Empurra a anca para cima até estender completamente, aperta o glúteo, desce controlado sem tocar o chão entre repetições.",
    tip: "Versão do hip thrust com maior estabilidade — ótima para progredir carga com segurança."
  },
  stiff_halteres: {
    id: "stiff_halteres",
    name: "Levantamento Terra Romeno (Stiff) com Halteres",
    muscles: ["Posterior de coxa", "Glúteos", "Lombar"],
    location: "academia",
    gluteFocus: true,
    desc: "Em pé, halteres à frente das coxas. Com joelhos quase esticados (ligeira flexão), inclina o tronco à frente empurrando a anca para trás, deixando os halteres deslizarem pelas pernas até sentires o alongamento no posterior da coxa. Volta à posição inicial contraindo o glúteo.",
    tip: "As costas mantêm-se sempre direitas — o movimento é na anca, não na coluna. Se sentires a lombar a curvar, reduz a amplitude."
  },
  step_up_banco: {
    id: "step_up_banco",
    name: "Step-Up com Halteres",
    muscles: ["Glúteos", "Quadríceps"],
    location: "academia",
    gluteFocus: true,
    desc: "Com um halter em cada mão, sobe para cima de um banco ou step com uma perna, empurrando através do calcanhar e contraindo o glúteo no topo. Desce controlada pela mesma perna. Alterna ou completa todas as repetições de um lado antes de trocar.",
    tip: "Evita empurrar com a perna de trás — o trabalho deve vir da perna que está em cima do banco."
  },
  abducao_deitada_cabo: {
    id: "abducao_deitada_cabo",
    name: "Abdução de Anca no Cabo (em pé)",
    muscles: ["Glúteo médio"],
    location: "academia",
    gluteFocus: true,
    desc: "Prende uma caneleira de cabo no tornozelo, de lado para a máquina. Com a perna quase esticada, afasta-a lateralmente contra a resistência do cabo, contraindo o glúteo médio. Volta controlada.",
    tip: "Mantém o tronco estável e não uses balanço — isola o glúteo médio, importante para a forma e estabilidade da anca."
  },
  ponte_gluteo_unilateral: {
    id: "ponte_gluteo_unilateral",
    name: "Ponte de Glúteos Unilateral",
    muscles: ["Glúteo máximo"],
    location: "casa",
    gluteFocus: true,
    desc: "Deitada de costas, joelhos dobrados, pés apoiados no chão. Estende uma perna a apontar para o teto. Empurra a anca para cima usando apenas a perna apoiada, contraindo o glúteo no topo. Desce controlada. Completa as repetições e troca de perna.",
    tip: "Se for muito difícil, mantém as duas mãos apoiadas no chão para equilíbrio. Para dificultar, adiciona uma pausa de 2s no topo."
  },
  elevacao_quadril_elastico: {
    id: "elevacao_quadril_elastico",
    name: "Elevação de Quadril com Elástico (Hip Thrust em casa)",
    muscles: ["Glúteo máximo"],
    location: "casa",
    gluteFocus: true,
    desc: "Deitada de costas com as costas apoiadas numa cadeira ou sofá baixo, elástico de resistência colocado por cima da anca e preso ao chão ou segurado pelas mãos. Empurra a anca para cima contra a resistência, aperta o glúteo, desce controlada.",
    tip: "Sem elástico também funciona muito bem — usa só o peso do corpo e foca na contração máxima no topo."
  },
  caminhada_lateral_elastico: {
    id: "caminhada_lateral_elastico",
    name: "Caminhada Lateral com Elástico (Monster Walk)",
    muscles: ["Glúteo médio"],
    location: "casa",
    gluteFocus: true,
    desc: "Coloca um elástico de resistência à volta dos tornozelos ou acima dos joelhos. Fica em meio-agachamento e dá passos laterais mantendo tensão constante no elástico, sem deixar os joelhos colapsarem para dentro.",
    tip: "Sem elástico, faz o mesmo movimento em meio-agachamento focando em manter os joelhos alinhados com os pés — a intenção do movimento já ativa o glúteo médio."
  },
  frog_pump: {
    id: "frog_pump",
    name: "Frog Pump (Ponte de Rã)",
    muscles: ["Glúteo máximo"],
    location: "casa",
    gluteFocus: true,
    desc: "Deitada de costas, sola dos pés unidas e joelhos abertos para os lados (posição de rã). Empurra a anca para cima apertando o glúteo no topo, desce controlada sem deixar a anca tocar completamente no chão entre repetições.",
    tip: "Amplitude curta mas intensa — foca-te em apertar bem o glúteo no topo em vez de ires rápido."
  },
  donkey_kick: {
    id: "donkey_kick",
    name: "Donkey Kick (Coice de Glúteo)",
    muscles: ["Glúteo máximo"],
    location: "casa",
    gluteFocus: true,
    desc: "De quatro apoios (mãos e joelhos no chão), mantém o joelho a 90° e eleva uma perna para trás e para cima, empurrando com a sola do pé em direção ao teto. Contrai o glúteo no topo e desce controlada sem deixar o joelho tocar no chão.",
    tip: "Não uses a lombar para ganhar altura — a amplitude é menor do que parece, mantém o core firme."
  },
  fire_hydrant: {
    id: "fire_hydrant",
    name: "Fire Hydrant (Abdução em 4 Apoios)",
    muscles: ["Glúteo médio"],
    location: "casa",
    gluteFocus: true,
    desc: "De quatro apoios, mantém o joelho dobrado a 90° e eleva a perna lateralmente, como um cão a levantar a perna, mantendo a anca estável e o tronco parado. Volta controlada.",
    tip: "Movimento pequeno e controlado — evita rodar o tronco para ganhar amplitude extra."
  },
  sumo_squat_casa: {
    id: "sumo_squat_casa",
    name: "Agachamento Sumo (Sem Equipamento)",
    muscles: ["Glúteos", "Interior de coxa"],
    location: "casa",
    gluteFocus: true,
    desc: "Pés bem afastados, mais largos que os ombros, pontas viradas para fora. Desce dobrando joelhos e anca, mantendo o tronco direito, até as coxas ficarem paralelas ao chão. Sobe empurrando pelos calcanhares e apertando o glúteo.",
    tip: "A postura mais larga recruta mais o glúteo e interior de coxa do que o agachamento normal. Podes segurar um objeto pesado de casa (mochila, garrafão) à frente do peito para aumentar a dificuldade."
  },
  step_up_casa: {
    id: "step_up_casa",
    name: "Step-Up em Escada/Banco (Casa)",
    muscles: ["Glúteos", "Quadríceps"],
    location: "casa",
    gluteFocus: true,
    desc: "Usa um degrau de escada, banco ou step estável. Sobe com uma perna, empurrando pelo calcanhar e apertando o glúteo no topo, desce controlada pela mesma perna. Podes segurar garrafões de água para adicionar peso.",
    tip: "Escolhe uma altura que sintas segura e estável — quanto mais alto o degrau, mais intenso para o glúteo."
  },
};
