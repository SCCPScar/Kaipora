# Kaipora

PWA pessoal de consistência e evolução — rotina, corpo, alimentação, treino, água, habilidades e diário, para a Scarllett (Scar). Evoluído a partir do VProject (que por sua vez substituiu por completo a antiga `plano-scar.html` single-file e removeu qualquer vestígio da aplicação da Luana).

Identidade visual própria: minimalista, sofisticada e acolhedora, com temas Dark e Light definidos por tokens CSS (`src/style.css`) — sem emojis como elementos de interface. O logótipo/mascote definitivo ainda não foi desenhado; a marca usa por agora só tipografia e um símbolo mínimo.

Princípio central: **consistência é mais importante que perfeição** — um dia incompleto não apaga a jornada nem reinicia o progresso.

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
               cliente Supabase, sync, notificações, tema (dark/light)
  ui/          navegação lateral (nav.ts) + separadores + componentes (ícones, gráfico, modal, timer, toast)
supabase/schema.sql   Esquema para sincronização cloud (tabela chave/valor + RLS)
scripts/stamp-sw.mjs  Dá à cache do service worker um nome único por build
tests/                Testes Vitest (storage, migração, merge/sync, dieta, treino)
```

### Navegação

A navegação é uma sidebar/drawer (menu lateral), agrupada por secção:

| Secção | Separadores |
|---|---|
| Início | Hoje, Rotina* |
| Corpo | Treino, Alimentação, Progresso |
| Desenvolvimento | Habilidades*, Diário* |
| Desafios | Desafios* |
| Acompanhamento | Calendário, Conquistas* |
| Sistema | Ajustes |

Separadores marcados com `*` são placeholders "em breve" — navegáveis desde já (para a estrutura completa ficar visível), com o conteúdo real a chegar em fases seguintes do roteiro Kaipora.

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

### Quais valores são públicos e quais são secretos

Isto confunde muita gente vindo de outros backends, por isso fica claro à partida:

| Valor | É secreto? | Onde vive |
|---|---|---|
| `VITE_SUPABASE_URL` | Não — é o endereço público da tua API. | Bundle JS público (qualquer visitante do site consegue vê-lo). |
| `VITE_SUPABASE_ANON_KEY` (a "anon key" / "publishable key") | **Não.** Foi desenhada pela Supabase para ser distribuída no frontend. Sozinha, sem RLS, permitiria aceder a tudo — é a Row Level Security do `schema.sql` que restringe cada pedido a `auth.uid() = user_id`. Com RLS ativo (como está), expô-la publicamente é seguro e é o uso pretendido. | Bundle JS público. |
| **`service_role` key** | **Sim, extremamente secreta.** Ignora RLS por completo — dá acesso total à base de dados. | **Nunca deve existir neste projeto.** Não é usada em nenhum ficheiro do repositório, não deve ser colada em nenhum ficheiro, commit, issue ou secret do GitHub Actions. Se algum dia precisares dela (não precisas para nada do VProject), fica só no Supabase Dashboard. |
| Password de login | Não existe — autenticação é só por magic link (email). Nunca há password para proteger. | — |

Por isso, no passo do GitHub Actions abaixo, `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` podem ir em **Variables** (não em **Secrets**) — mas colocá-los em Secrets também funciona sem problema, só é menos preciso semanticamente. O que nunca deve acontecer, em nenhum dos dois sítios, é uma `service_role` key.

### Passo a passo completo

**1. Criar o projeto Supabase**
- Entra em [supabase.com](https://supabase.com/dashboard) → **New project**.
- Escolhe uma organização, um nome (ex. `vproject`), uma password de base de dados (guarda-a nalgum sítio seguro — é só para acesso direto Postgres, a app nunca a usa) e uma região perto de ti (ex. `eu-west` / `eu-central`).
- Espera 1-2 minutos até o projeto ficar `ACTIVE_HEALTHY`.

**2. Executar `supabase/schema.sql`**
- No menu lateral do projeto, abre **SQL Editor** → **New query**.
- Copia todo o conteúdo de [`supabase/schema.sql`](./supabase/schema.sql) deste repositório, cola, e clica **Run**.
- Confirma que funcionou: **Table Editor** → deve aparecer uma tabela `user_data` com as colunas `user_id, key, value, created_at, updated_at`. Em **Authentication → Policies** (ou **Table Editor → user_data → RLS**), deves ver 4 policies (`user_data_select_own`, `_insert_own`, `_update_own`, `_delete_own`) e o RLS marcado como **Enabled**.
- Se já tinhas aplicado uma versão anterior deste ficheiro (com um trigger `user_data_touch`), corre o `schema.sql` atual outra vez — a instrução `drop trigger if exists` remove esse trigger antigo, que estava a **substituir o timestamp enviado pelo cliente pelo do servidor em cada UPDATE**, quebrando a resolução de conflitos descrita mais abaixo.

**3. Configurar Auth (magic link)**
- **Authentication → Providers → Email**: confirma que está **Enabled** (vem assim por omissão). Não precisas de configurar nenhum outro provider — o VProject só usa o link de acesso por email (OTP), nunca password.
- **Authentication → Emails → Magic Link**: podes personalizar o template do email aqui se quiseres (opcional — o template por omissão da Supabase já funciona).
- **Authentication → URL Configuration**:
  - **Site URL**: a URL onde a app fica publicada, ex. `https://<o-teu-utilizador-github>.github.io/VProject/`.
  - **Redirect URLs**: adiciona a mesma URL (e, se testares localmente, também `http://localhost:5173/VProject/` ou o que o `npm run dev` te mostrar). O link de magic link só reabre a app numa URL que esteja nesta lista — se faltar, o login falha silenciosamente ao voltar do email.

**4. Obter `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`**
- **Project Settings (ícone de engrenagem) → API**.
- **Project URL** → é o teu `VITE_SUPABASE_URL`.
- Em **Project API keys**, copia a key marcada **`anon` `public`** (não a `service_role`, essa nunca sai daqui) → é o teu `VITE_SUPABASE_ANON_KEY`.

**5. Configurar para desenvolvimento local (opcional)**
```bash
cp .env.example .env.local
# edita .env.local e cola os dois valores do passo 4
npm run dev
```
`.env.local` está no `.gitignore` — nunca é commitado.

**6. Configurar o GitHub Actions**
No repositório GitHub → **Settings → Secrets and variables → Actions**:
- Aba **Variables** (recomendado, já que nenhum dos dois é secreto — ver tabela acima) *ou* aba **Secrets** (também funciona): cria `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com os valores do passo 4.
- O workflow `.github/workflows/deploy.yml` já está preparado para ler qualquer um dos dois (`secrets.VITE_SUPABASE_URL` funciona tanto para Secrets como, com o mesmo nome, para Variables promovidas a env — se usares Variables, ver nota abaixo).

> Nota técnica: o workflow atual referencia `${{ secrets.VITE_SUPABASE_URL }}`. Se preferires guardá-los em **Variables** em vez de **Secrets**, muda essa linha em `.github/workflows/deploy.yml` para `${{ vars.VITE_SUPABASE_URL }}` (e o mesmo para a anon key). Qualquer uma das duas opções é segura para estes dois valores especificamente.

**7. Publicar no GitHub Pages**
- **Settings → Pages → Source**: **GitHub Actions**.
- Faz push para `main` (ou faz merge desta branch para `main` quando estiveres pronta) — o workflow builda, corre os testes, e publica.
- Site fica em `https://<o-teu-utilizador-github>.github.io/VProject/`.

**8. Confirmar que a sincronização está mesmo a funcionar**
- Abre o site publicado, vai a **Ajustes → Conta e sincronização**, introduz o teu email, recebe o magic link, clica-o.
- Regista um peso. Abre o site noutro dispositivo/browser, faz login com o mesmo email, espera alguns segundos (ou clica **Sincronizar agora**) — o peso deve aparecer.

### Como funciona a sincronização (offline-first, com merge)

Cada dispositivo sincroniza (no arranque, ao recuperar ligação, ao voltar a ficar visível, e a cada 2 minutos) fazendo `pull` das linhas do Supabase e depois `push` das chaves locais alteradas desde a última sincronização bem-sucedida. Isto não é um simples "última escrita ganha por chave inteira" — isso destruiria dados no cenário mais importante: **registares treino/água/refeições no ginásio sem rede, e sincronizares horas depois**, com o PC entretanto a ter guardado outra coisa nesse mesmo dia.

Em vez disso, `src/lib/sync.ts` distingue três casos ao processar cada chave recebida do Supabase:

1. **Remoto não mudou desde a última sincronização** → o local mantém-se como está (nada a fazer).
2. **Local não mudou desde a última sincronização** → aplica-se o remoto tal como está.
3. **Ambos mudaram desde a última sincronização** (conflito real) → `src/lib/merge.ts` faz o merge em vez de escolher um lado às cegas:
   - `vp_day_{data}` (refeições, água, exercícios, hábitos, treino do dia): merge campo a campo — água fica com o valor mais alto, refeições/hábitos/exercícios ficam com a união (nunca desmarca algo que um dos lados marcou), e o treino concluído sobrevive se qualquer um dos lados o tiver concluído.
   - `vp_weights` / `vp_measurements` / `vp_notes` / `vp_loads_*`: união das listas por identidade de conteúdo (mesma data + mesmo valor = a mesma entrada), resolvendo cada entrada em comum pelo `updatedAt` mais recente — ver "Apagar em sincronização" abaixo.
   - Tudo o resto (definições, etc.): não há forma de fazer merge campo a campo de forma genérica — fica com o valor remoto, um caso de baixo risco e baixa frequência.

### Apagar em sincronização (tombstones — não ressuscita)

Apagar um registo de peso/medida/nota/carga **nunca** remove a entrada de imediato do armazenamento — marca-a como `deleted: true` com um `updatedAt` novo (um "tombstone"), e só essa versão marcada é que é sincronizada. Isto é o que garante o cenário que importa:

```
iPhone (offline): tens um registo de peso  →  apagas
PC:               ainda tem o registo antigo, por não saber do apagamento
iPhone volta a ter Internet → sincroniza
```

Resultado: o apagamento propaga-se para o Supabase e, na sincronização seguinte do PC, o registo desaparece lá também — nunca reaparece no iPhone por o PC "ainda o ter". A resolução usa sempre o lado com `updatedAt` mais recente, incluindo quando esse lado é um apagamento — por isso um apagamento genuinamente mais antigo do que uma reintrodução deliberada do mesmo valor (re-pesares-te e voltares a registar o mesmo número) não sobrepõe essa reintrodução mais recente. Testado em `tests/merge.test.ts` e `tests/sync-conflicts.test.ts` (incluindo o cenário exato acima, apagamentos concorrentes nos dois dispositivos, e apagamento concorrente com uma adição não relacionada no outro dispositivo).

A app nunca remove fisicamente essas entradas marcadas — não há um processo de limpeza (garbage collection) de tombstones antigos. Para o volume de dados de uma app pessoal (dezenas a centenas de registos ao longo de anos, não milhares por dia) isto é irrelevante em termos de espaço; não foi implementado por ser complexidade desnecessária a este nível de uso.

Chaves internas de sincronização (`vp_meta`, `vp_last_synced_at`, `vp_migrated_from_scar`) nunca são enviadas para a cloud nem incluídas em backups — são só para uso interno deste dispositivo.

### Fluxo de login — o que foi verificado no código

Percorrido linha a linha (não só testado à superfície):

- **Login por magic link**: sem password em momento algum. `detectSessionInUrl` está explicitamente ativo no cliente Supabase para apanhar a sessão assim que o link do email reabre a app.
- **Sessão persistente**: `persistSession: true` — sobrevive a refresh da página e a fechar/reabrir o browser (guardada pelo próprio SDK da Supabase, não nas chaves `vp_*` da app).
- **Login não faz overwrite destrutivo**: no primeiro login num dispositivo com dados locais já existentes (ex. usaste a app offline antes de configurares a conta), a sincronização faz *merge* — nunca substitui às cegas o que já tinhas localmente por vazio ou por dados de outro dispositivo. Ver "Como funciona a sincronização" acima.
- **Interface atualiza-se sozinha**: depois de um login, a app sincroniza imediatamente (não espera pelo temporizador de 2 em 2 minutos) e volta a re-renderizar o ecrã visível quando essa sincronização termina — não é preciso mudar de separador para os dados aparecerem.
- **Logout não apaga nada local**: termina só a sessão Supabase; os dados em `localStorage` ficam intactos, continuas a poder usar a app offline depois de saíres da conta, e voltas a ter tudo sincronizado ao iniciares sessão outra vez.
- **Sessão expirada**: se o token de atualização deixar de ser válido (ex. não abrires a app durante muito tempo), a sincronização em fundo simplesmente para de funcionar em silêncio (sem crash, sem apagar dados) até voltares a iniciar sessão — o separador Ajustes deteta isto automaticamente da próxima vez que o abrires, mostrando o formulário de login outra vez.
- **Offline → online**: qualquer chamada de sincronização falha de forma controlada (`Sem ligação à internet.`) sem tentar pedidos de rede quando `navigator.onLine` é falso; o evento `online` do browser volta a disparar a sincronização automaticamente assim que a ligação volta.

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
- **Progressão de treino**: cada exercício tem um mini-formulário (no ℹ️ do exercício) para registar carga (kg), repetições, duração (s) e variação/dificuldade por sessão — cobre tanto academia (carga+reps) como calistenia (reps/duração/variação, sem carga). Mostra sempre uma comparação explícita "Última vez: X → Agora: Y" com a diferença destacada, além de um gráfico de evolução quando há 2+ registos com carga. Antes só existia um checkbox "concluído", sem qualquer histórico.
- **Contador de calorias completo**: a Dieta mostra consumido/meta/restante em kcal, e proteína/carboidratos/gordura vs meta (antes só mostrava kcal e proteína, sem "restante" nem carboidratos/gordura).
- **Medidas personalizadas e edição**: a área de Progresso permite adicionar uma medida extra (nome + valor), além de cintura/quadril/coxa/braço — e agora também **editar** um registo de medidas já guardado (toca no registo na lista, os campos preenchem-se, "Guardar alterações" substitui-o). A edição está implementada como um apagamento (tombstone) do valor antigo seguido de uma nova entrada — não como uma alteração direta — para se manter tão segura em sincronização como um apagamento normal (ver "Apagar em sincronização" acima).

## iPhone / Safari / PWA — revisão de código e checklist física

**Não tenho acesso a um iPhone físico — nada aqui foi validado num dispositivo real.** O que se segue é uma revisão do código contra o comportamento conhecido do WebKit/iOS, mais uma checklist para validares fisicamente.

### O que a revisão de código confirmou/corrigiu

- ✅ `viewport-fit=cover` no `index.html` — necessário para os `env(safe-area-inset-*)` funcionarem (sem isto, resolvem sempre para 0). Presente.
- ✅ Safe areas aplicadas: cabeçalho, navegação inferior, modais e o toast usam `--safe-top`/`--safe-bottom`, para não ficarem por baixo do notch/Dynamic Island nem da barra de gestos.
- ✅ `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style` e `apple-touch-icon` presentes — cobre tanto o modo antigo do iOS de "Adicionar ao Ecrã Principal" como o suporte mais recente ao manifest (iOS 16.4+).
- 🔧 **Corrigido nesta fase**: campos de texto/número tinham `font-size: 14px` — o Safari no iOS faz zoom automático da página ao focar em qualquer input com menos de 16px, mesmo com `maximum-scale=1.0`. Subido para 16px em todos os inputs (`.finp`).
- 🔧 **Corrigido nesta fase**: o `apple-touch-icon` (`icon-180.png`) tinha cantos arredondados desenhados no próprio SVG — o iOS aplica a sua própria máscara de cantos ao ícone, o que produzia um "arredondamento duplo". Regenerado a partir de um SVG quadrado sem `rx`.
- 🔧 **Corrigido nesta fase**: o beep do temporizador criava o `AudioContext` só quando o tempo chegava a zero (dentro de um `setInterval`) — o Safari no iOS só deixa um `AudioContext` produzir som se for criado/retomado diretamente dentro de um gesto do utilizador (um toque). Agora é criado no momento em que tocas "Iniciar" (o próprio gesto) e reutilizado quando o temporizador termina.
- 📝 `navigator.vibrate` **não existe no Safari iOS, em nenhuma versão** (é uma limitação da própria Apple, não da app) — o código já verifica `if (navigator.vibrate)` antes de chamar, por isso não rebenta, mas no iPhone o único aviso de fim de temporizador é o som (ou visual, o ecrã a mostrar "0:00"). Não há vibração de todo no iPhone, com ou sem PWA instalada.
- 📝 **Risco de despejo de armazenamento no iOS**: o Safari (Intelligent Tracking Prevention) pode limpar dados de armazenamento de sites/PWAs não abertos durante várias semanas. Isto é exatamente o cenário para o qual a sincronização cloud existe como rede de segurança — se isto acontecer, os dados não se perdem desde que a conta tenha sido sincronizada pelo menos uma vez antes do despejo. Sem sincronização cloud configurada, este é um risco real de perda de dados apenas com armazenamento local.
- 📝 **Modais e o teclado do iOS**: os modais (temporizador, registo de carga, guia de exercício) são `position: fixed` ancorados ao fundo do ecrã. O comportamento de elementos `fixed` quando o teclado do iOS está aberto tem historial de inconsistências entre versões do WebKit — não consegui confirmar isto sem um dispositivo. Está na checklist abaixo.
- 📝 Notificações: o aviso já presente no separador Ajustes está tecnicamente correto — no iOS só disparam com a app aberta em primeiro plano, sem servidor de push dedicado não há lembretes em segundo plano.

### Checklist para testares fisicamente no iPhone

Nenhum destes pontos deve ser assumido como funcional até seres tu a confirmar:

- [ ] Abrir o site publicado no Safari.
- [ ] Fazer login por magic link (recebes o email, clicas o link, volta à app com sessão iniciada).
- [ ] **Adicionar ao Ecrã Principal** (Partilhar → Adicionar ao Ecrã Principal).
- [ ] Abrir a partir do ícone no ecrã principal (modo standalone, sem barra de endereço do Safari).
- [ ] Confirmar que o conteúdo não fica escondido atrás do notch/Dynamic Island nem da barra de gestos em baixo.
- [ ] Registar um peso em Progresso.
- [ ] Registar uma medida (incluindo uma medida personalizada).
- [ ] Marcar um treino/exercício como concluído em Treino.
- [ ] Abrir o temporizador de descanso, confirmar que o som toca ao chegar a zero.
- [ ] Registar uma refeição em Dieta.
- [ ] Registar água em Hoje.
- [ ] Abrir um modal com um campo de texto (ex. registo de carga) e confirmar que o teclado não tapa o campo nem o botão de guardar.
- [ ] **Desligar a Internet** (modo avião).
- [ ] Continuar a usar a app — marcar mais coisas, registar mais dados.
- [ ] **Voltar a ligar a Internet.**
- [ ] Confirmar (no separador Ajustes, "Sincronizar agora", ou esperar ~2 min) que a sincronização acontece sem erros.
- [ ] Abrir a mesma conta no PC (browser normal).
- [ ] Confirmar que os mesmos dados aparecem — os registados no iPhone offline devem estar lá.
- [ ] Registar algo novo no PC, voltar ao iPhone, confirmar que também chega lá.

## Limitações conhecidas / trabalho por fazer

- **Sincronização cloud não está provisionada** — o código e o esquema SQL estão prontos, mas é preciso seguir os 8 passos da secção "Sincronização cloud" acima para ligar a um projeto Supabase real. Isto foi deixado como passo manual porque envolve criar/gerir uma conta e recursos externos ao repositório — nenhuma ferramenta que tenho consegue fazer isso pela Scar em segurança.
- **Relógios dos dispositivos**: a resolução de conflitos (incluindo os tombstones de apagamento) assume que a hora do sistema do iPhone e do PC estão razoavelmente certas (sincronização automática de hora ligada, o que é o padrão). Não há um relógio lógico/NTP próprio — desproporcionado para uma app pessoal de 2 dispositivos.
- **Tombstones não têm garbage collection**: entradas apagadas ficam guardadas para sempre (marcadas, não removidas) para a sincronização continuar correta indefinidamente. Ver "Apagar em sincronização" acima — irrelevante em termos de espaço à escala de uso pessoal.
- **Notificações no iOS**: só disparam com a app aberta em primeiro plano (limitação da própria plataforma para PWAs sem servidor de push dedicado). Explicado na app, no separador Ajustes.
- Não foram feitos testes manuais num iPhone físico nem num dispositivo Android físico — apenas em Chromium headless (mobile viewport), revisão de código contra o comportamento conhecido do WebKit/iOS, e um percurso completo pelas 6 tabs a validar consola/estado/persistência. Ver a secção "iPhone / Safari / PWA" acima para a checklist de validação física.
- Os valores nutricionais (kcal/macros) das opções de refeição são estimativas de referência, não dados de uma tabela nutricional certificada — suficientes para acompanhamento pessoal, não para prescrição clínica.
- Não existe um passo de build automatizado de ícones — se quiseres trocar a identidade visual, edita `public/icons/icon.svg` (ícone geral) e `public/icons/icon-apple-touch-source.svg` (fonte específica para `icon-180.png`, propositadamente **sem** cantos arredondados — o iOS aplica a sua própria máscara ao `apple-touch-icon`; um SVG já arredondado produz um "arredondamento duplo" visível) e volta a gerar os PNGs (qualquer ferramenta de rasterização de SVG serve, ex. `npx sharp-cli` ou um conversor online).
- **Ilustrações de exercícios**: cobertura parcial (13 de 58 exercícios) — ver a secção seguinte para o que existe e o que falta.

## Suporte visual dos exercícios

Implementado de forma limitada e deliberadamente honesta sobre os seus limites, em vez de tentado para os 58 exercícios de uma vez sem revisão individual:

- **O quê**: `src/data/exerciseDiagrams.ts` — diagramas SVG próprios (sem dependências externas, sem licenciamento a verificar, sem fotos de ninguém), desenhados como figuras de traço simplificadas, mostrando **posição inicial → posição final** com uma seta de movimento (ou **Correto vs Evitar** para exercícios isométricos como a prancha, onde não há "início/fim" mas sim uma forma certa e uma errada).
- **Onde aparecem**: no modal de "como executar" de cada exercício (ícone ℹ️), por cima da descrição em texto — que continua a ser a referência principal e mais detalhada.
- **Cobertura atual (13 exercícios, os de maior prioridade)**: `hip_thrust`, `elevacao_pelvica_maquina` (Academia); `glute_bridge`, `elevacao_quadril_elastico`, `ponte_gluteo_unilateral`, `frog_pump` (glúteos, Casa); `donkey_kick`; `squat`, `agachamento`, `sumo_squat_casa`; `plank`, `prancha`; `superman`. Escolhidos por serem exatamente as categorias pedidas: glúteos, calistenia, e exercícios com maior risco de execução incorreta (ex. prancha com anca a cair, hiperextensão lombar no superman).
- **O que NÃO é**: um guia médico ou anatomicamente preciso. É uma figura de traço simplificada para dar uma noção rápida de orientação corporal — a etiqueta "Diagrama esquemático simplificado — a descrição abaixo é a referência principal" aparece sempre por baixo do diagrama, dentro da app.
- **Cobertura restante (45 exercícios sem diagrama)**: os restantes continuam só com texto, como estavam antes desta fase — não pior do que estavam, só ainda não melhorados. Estender a cobertura é mecânico a partir daqui: a arquitetura (`EXERCISE_DIAGRAMS: Record<exerciseId, svgString>`, testada em `tests/training.test.ts` para garantir que cada chave corresponde a um exercício real) já suporta adicionar mais entradas sem alterar nada da UI. O trabalho que falta é de conteúdo — desenhar mais poses com cuidado — não de código.

## Fotos de progresso — **não implementado**

Para ser direto: **esta funcionalidade não existe no código.** Zero linhas — não há upload, não há armazenamento, não há UI para fotos de progresso em lado nenhum da app. Foi avaliada e deliberadamente não implementada nesta fase, pelas razões abaixo — não por esquecimento.

### Porque não foi implementada agora

Fotos de progresso não são só "mais um campo de dados" como uma medida personalizada — são um tipo de dado fundamentalmente diferente do resto da app:

1. **A app inteira sincroniza via uma tabela genérica chave/valor `jsonb`** (`supabase/schema.sql`), pensada para os dados pequenos e estruturados que já existem (pesos, medidas, treinos, texto). Uma foto é um blob binário de megabytes — não cabe nesse modelo sem um caminho de código completamente separado (upload para Supabase Storage, não para a tabela `user_data`).
2. **`localStorage` (a camada offline de toda a app) tem um limite de espaço tipicamente entre 5-10MB no total**, no browser inteiro. Fotos teriam de usar IndexedDB para cache local, outra peça de arquitetura nova.
3. **Fotos pessoais têm riscos de privacidade que os outros dados não têm** — nomeadamente, a maioria das fotos tiradas num telemóvel contém metadados EXIF com localização GPS exata. Implementar isto "à pressa" e esquecer de remover EXIF seria pior do que não implementar.

Dado o âmbito desta fase (sincronização, segurança da conta, PWA, revisão do que já existia), implementar isto agora significaria fazê-lo apressado. Segue-se o plano técnico completo para quando for para avançar.

### Plano técnico, se/quando for implementado

**Backend (Supabase Storage, não a tabela `user_data`):**
- Criar um bucket **privado** `progress-photos` (nunca público).
- Políticas RLS em `storage.objects` restringindo cada operação a objetos cujo caminho comece por `{auth.uid()}/` — o padrão standard da Supabase: `(storage.foldername(name))[1] = auth.uid()::text`. Cada utilizador só vê a sua própria pasta.
- Upload direto do cliente autenticado via `supabase.storage.from('progress-photos').upload(...)` — nunca através de um servidor intermédio.
- Leitura: como o bucket é privado, uma tag `<img src>` normal não consegue autenticar-se — as opções são `createSignedUrl()` (URL temporária, expira) ou fazer `download()` autenticado e criar um `URL.createObjectURL()` local (mais privado, nunca existe um link partilhável, nem que seja temporário).

**Cliente:**
- Remover metadados EXIF (incluindo GPS) da imagem **antes** do upload — nunca confiar em fazer isso só no servidor.
- Redimensionar/comprimir no dispositivo antes de enviar, para controlar custos de armazenamento.
- Cache local em IndexedDB (não `localStorage`), com o mesmo espírito offline-first do resto da app.

**O que NUNCA deve acontecer:**
- Fotos no repositório GitHub público, em qualquer commit, branch ou histórico.
- Bucket público ou sem RLS.
- URLs de fotos permanentemente públicas/adivinháveis.
- Upload sem remoção de EXIF.

Isto não é uma funcionalidade "quase pronta" — é uma funcionalidade de que só existe o plano. Trata-a como um projeto novo, não como uma pequena adição.
