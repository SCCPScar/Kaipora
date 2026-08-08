# VProject

Plataforma pessoal de transformação física e recomposição corporal — construída para a Scarllett (Scar). Substitui por completo a antiga `plano-scar.html` (single-file) e remove qualquer vestígio da aplicação da Luana.

Identidade visual própria inspirada na atmosfera de Vi (Arcane) e Maki Zenin (Jujutsu Kaisen) — roxo/azul elétrico, borgonha, tons escuros, glow — sem usar personagens, logótipos ou assets protegidos.

## Stack

- Vite + TypeScript, sem framework de UI (a app é pequena o suficiente para não precisar de React/Vue — menos dependências, bundle mais leve, mais fácil de manter offline).
- Estado local em `localStorage`, com um esquema tipado em `src/lib/storage.ts`.
- Sincronização entre dispositivos via Supabase (`src/lib/sync.ts`), com merge automático em conflitos — ver "Sincronização cloud" abaixo. Sem configuração, a app funciona 100% local/offline.
- PWA: `public/manifest.webmanifest` + `public/sw.js` (service worker escrito à mão, sem plugin).
- Testes: Vitest (`npm test`).

## Estrutura

```
src/
  data/        Exercícios, plano de treino (Academia+Casa x7 dias), dieta, hábitos
  lib/         storage, migração, merge (resolução de conflitos), datas, cálculo calórico,
               cliente Supabase, sync, notificações
  ui/          nav + 6 separadores (Hoje, Treino, Dieta, Progresso, Calendário, Ajustes) + componentes
supabase/schema.sql   Esquema para sincronização cloud (tabela chave/valor + RLS)
scripts/stamp-sw.mjs  Dá à cache do service worker um nome único por build
tests/                Testes Vitest (storage, migração, merge/sync, dieta, treino)
```

## Correr localmente

```bash
npm install
npm run dev       # servidor de desenvolvimento
npm test          # testes
npm run build     # build de produção (gera dist/)
npm run preview   # pré-visualizar o build
```

## Publicar no GitHub Pages

O workflow `.github/workflows/deploy.yml` publica automaticamente a cada push para `main`:

1. Em **Settings → Pages**, define a origem como **GitHub Actions**.
2. (Opcional) Define os secrets `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` em **Settings → Secrets and variables → Actions** para ativar a sincronização cloud no build publicado.
3. Faz push para `main` — o site fica disponível em `https://<utilizador>.github.io/VProject/`.

Se publicares num domínio próprio (raiz, não subpasta), define `VITE_BASE_PATH=/` como variável de ambiente do build.

## Sincronização cloud (iPhone ↔ PC)

Esta é a forma pretendida de usar o VProject em mais do que um dispositivo: Supabase é a fonte de verdade entre o iPhone e o PC, e o `localStorage` de cada dispositivo é a camada offline que garante que a app nunca fica bloqueada à espera de rede. Sem `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` definidos, a app funciona inteiramente local — nada quebra, só não sincroniza entre dispositivos.

Para ativar:

1. Cria um projeto em [supabase.com](https://supabase.com) (ou usa um existente).
2. No **SQL Editor**, corre o conteúdo de `supabase/schema.sql` — cria uma tabela `user_data` (chave/valor por utilizador) com Row Level Security, para que cada pessoa só veja os seus próprios dados.
3. Em **Project Settings → API**, copia o **Project URL** e a **anon public key**.
4. Cria um `.env.local` (baseado em `.env.example`) para desenvolvimento local, e/ou define os secrets do GitHub Actions acima para o site publicado.
5. Autenticação é **sem palavra-passe** (magic link por email) — nunca guardamos nem transmitimos passwords, e a `anon key` é segura para expor num site público: o acesso real é controlado pelas policies de RLS em `supabase/schema.sql`, nunca pela chave em si.

Se já aplicaste uma versão anterior deste ficheiro (com um trigger `user_data_touch`), corre o `supabase/schema.sql` atual outra vez — a primeira instrução remove esse trigger, que estava a **substituir o timestamp enviado pelo cliente pelo do servidor em cada UPDATE**, quebrando a resolução de conflitos descrita abaixo.

### Como funciona a sincronização (offline-first, com merge)

Cada dispositivo sincroniza (no arranque, ao recuperar ligação, ao voltar a ficar visível, e a cada 2 minutos) fazendo `pull` das linhas do Supabase e depois `push` das chaves locais alteradas desde a última sincronização bem-sucedida. Isto não é um simples "última escrita ganha por chave inteira" — isso destruiria dados no cenário mais importante: **registares treino/água/refeições no ginásio sem rede, e sincronizares horas depois**, com o PC entretanto a ter guardado outra coisa nesse mesmo dia.

Em vez disso, `src/lib/sync.ts` distingue três casos ao processar cada chave recebida do Supabase:

1. **Remoto não mudou desde a última sincronização** → o local mantém-se como está (nada a fazer).
2. **Local não mudou desde a última sincronização** → aplica-se o remoto tal como está.
3. **Ambos mudaram desde a última sincronização** (conflito real) → `src/lib/merge.ts` faz o merge em vez de escolher um lado às cegas:
   - `vp_day_{data}` (refeições, água, exercícios, hábitos, treino do dia): merge campo a campo — água fica com o valor mais alto, refeições/hábitos/exercícios ficam com a união (nunca desmarca algo que um dos lados marcou), e o treino concluído sobrevive se qualquer um dos lados o tiver concluído.
   - `vp_weights` / `vp_measurements` / `vp_notes` / `vp_loads_*`: união das listas por conteúdo (mesma data + mesmo valor = a mesma entrada), nunca uma sobrescreve a outra.
   - Tudo o resto (definições, etc.): não há forma de fazer merge campo a campo de forma genérica — fica com o valor remoto, um caso de baixo risco e baixa frequência.

**Limitação aceite e documentada**: como não existe uma lista de "tombstones" (marcadores de apagado), apagar um registo de peso/medida/nota/carga **offline** pode reaparecer depois de sincronizar, se o outro dispositivo ainda tinha a versão antiga guardada e ambos mudaram algo nesse mesmo período. Isto é intencional — o sistema prefere nunca perder silenciosamente algo que registaste a arriscar apagar de forma "demasiado esperta". Se isto acontecer, basta apagar outra vez (agora já sincronizado nos dois lados).

Chaves internas de sincronização (`vp_meta`, `vp_last_synced_at`, `vp_migrated_from_scar`) nunca são enviadas para a cloud nem incluídas em backups — são só para uso interno deste dispositivo.

## Migração de dados antigos

Ao abrir a app pela primeira vez, `src/lib/migrate.ts` procura as chaves antigas `scar_*` (do `plano-scar.html`) no `localStorage` do mesmo browser/dispositivo e copia-as para o novo esquema `vp_*`. **As chaves antigas nunca são apagadas.** Cobre pesos, medidas, notas, refeições/água/exercícios por dia, e os hábitos semanais antigos (`scar_hab_{semana}`) — este último mapeia de forma exata (não aproximada) para o novo registo por dia, porque o formato antigo já guardava um checkbox por hábito por dia da semana.

Limitação conhecida: a app original só guardava "treinou: sim/não" por dia, sem distinguir Academia/Casa. Dias antigos migrados com treino marcado assumem modalidade "Academia" (a mais frequente no plano antigo) — fica visível/editável na app depois de migrado.

Esta migração só functiona dentro do **mesmo browser/dispositivo** onde o `plano-scar.html` era usado (localStorage não viaja entre dispositivos). Se a Scar usava a app antiga em mais do que um telemóvel/PC, recomenda-se exportar manualmente os dados relevantes antes de trocar de dispositivo, ou configurar a sincronização cloud primeiro.

## O que mudou em relação ao plano-scar.html

- **Luana removida por completo** — não existe qualquer código, dado ou menu relacionado.
- **Arquitetura**: de um único ficheiro HTML de ~630KB para um projeto Vite/TS modular, testável e mantível.
- **Treino**: os 7 dias da semana passam a ter sempre as duas versões (Academia e Casa), em vez de dias fixos de academia + 3 níveis de calistenia avulsos. A versão de Casa é um treino completo, não uma alternativa "fácil".
- **Programa de glúteos**: secção dedicada (glúteo máximo + médio), com exercícios próprios de Academia e Casa, integrada nos dias de pernas para não sobrecarregar volume.
- **Dieta**: mais opções por refeição, todas com gramagem, calorias e macros, usando alimentos comuns em supermercados portugueses (Leiria). Continua sem carne vermelha, mantendo o contexto pós-bariátrico da app original (não bebida durante as refeições, foco em proteína, suplementação B12/multivitamínico/cálcio/vitamina D).
- **Fotos de exercícios removidas por decisão deliberada**: a app original tinha fotos reais da Scar embutidas em Base64. Como este repositório é público (GitHub Pages), essas fotos pessoais **não foram incluídas** — cada exercício tem descrição de execução e dica de segurança em texto em vez disso. Se quiseres reintroduzir fotos, o mais seguro é guardá-las fora do repositório público (ex: num storage privado do Supabase) em vez de as embutir no código.
- **Novo separador Calendário** e **Ajustes** (metas, notificações, conta/sincronização, backup, acessibilidade).
- **PWA real**: manifest + service worker com cache do essencial da app, funcionamento offline e instalação no ecrã inicial. A cache é renomeada a cada build (`scripts/stamp-sw.mjs`), para que um novo deployment liberte sempre a cache do anterior em vez de acumular indefinidamente.
- **Progressão de carga/força**: cada exercício tem agora um mini-formulário (no ℹ️ do exercício) para registar carga (kg) e repetições por sessão, com gráfico de evolução quando há 2+ registos — antes só existia um checkbox "concluído", sem histórico de força.
- **Contador de calorias completo**: a Dieta mostra consumido/meta/restante em kcal, e proteína/carboidratos/gordura vs meta (antes só mostrava kcal e proteína, sem "restante" nem carboidratos/gordura).
- **Medidas personalizadas**: a área de Progresso permite adicionar uma medida extra (nome + valor), além de cintura/quadril/coxa/braço.

## Limitações conhecidas / trabalho por fazer

- **Sincronização cloud não está provisionada** — o código e o esquema SQL estão prontos, mas é preciso seguir os passos da secção acima para ligar a um projeto Supabase real. Isto foi deixado como passo manual em vez de automatizado porque envolve criar/gerir uma conta e recursos externos ao repositório.
- **Apagar offline + conflito real = pode "ressuscitar"**: ver a limitação documentada na secção de sincronização acima. Só acontece na janela estreita em que ambos os dispositivos mudaram a mesma lista desde a última sincronização.
- **Relógios dos dispositivos**: a resolução de conflitos assume que a hora do sistema do iPhone e do PC estão razoavelmente certas (sincronização automática de hora ligada, o que é o padrão). Não há um relógio lógico/NTP próprio — desproporcionado para uma app pessoal de 2 dispositivos.
- **Notificações no iOS**: só disparam com a app aberta em primeiro plano (limitação da própria plataforma para PWAs sem servidor de push dedicado). Explicado na app, no separador Ajustes.
- Não foram feitos testes manuais num iPhone físico nem num dispositivo Android físico — apenas em Chromium headless (mobile viewport), verificação de responsividade em CSS, e um percurso completo pelas 6 tabs a validar consola/estado/persistência. Testar em dispositivos reais antes do primeiro uso a sério é recomendado.
- Os valores nutricionais (kcal/macros) das opções de refeição são estimativas de referência, não dados de uma tabela nutricional certificada — suficientes para acompanhamento pessoal, não para prescrição clínica.
- Não existe um passo de build automatizado de ícones — se quiseres trocar a identidade visual, edita `public/icons/icon.svg` e volta a gerar os PNGs (qualquer ferramenta de rasterização de SVG serve, ex. `npx sharp-cli` ou o Supabase/qualquer conversor online).
- **Ilustrações de exercícios**: continuam apenas em texto (descrição + dica de execução), sem imagens — ver a secção seguinte.

## Suporte visual dos exercícios (avaliação, ainda não implementado)

O pedido original de adicionar apoio visual aos exercícios (sem reintroduzir as fotos pessoais da Scar) foi avaliado mas não implementado nesta fase, por ser um trabalho de conteúdo (não só de código) que merece ser feito devidamente:

- **Ilustrações próprias (SVG/desenho simples)**: a opção mais segura a nível de licenciamento — mas são 58 exercícios, cada um precisando de uma pose reconhecível; é trabalho de design significativo, não algo a gerar em massa sem revisão.
- **Bibliotecas de ícones/pictogramas de exercícios com licença aberta** (ex. bibliotecas de pictogramas fitness sob licença MIT/CC0): mais rápido, mas a cobertura de exercícios específicos (ex. "Hip Thrust", "Elevação de Anca na Máquina") costuma ser incompleta, e é preciso confirmar a licença de cada asset individualmente antes de o incluir num repositório público.
- **GIFs/vídeos de terceiros**: desaconselhado — a esmagadora maioria não tem licença clara para reutilização num produto público.

Sugestão para uma próxima iteração: começar pelos exercícios do "Programa de Glúteos" e do dia de pernas (os mais novos, sem histórico de fotos antigas para comparar), usando pictogramas de uma biblioteca de licença aberta já verificada uma a uma, mantendo o texto como conteúdo principal (já claro e detalhado) e a imagem como reforço visual opcional.
