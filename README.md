# VProject

Plataforma pessoal de transformação física e recomposição corporal — construída para a Scarllett (Scar). Substitui por completo a antiga `plano-scar.html` (single-file) e remove qualquer vestígio da aplicação da Luana.

Identidade visual própria inspirada na atmosfera de Vi (Arcane) e Maki Zenin (Jujutsu Kaisen) — roxo/azul elétrico, borgonha, tons escuros, glow — sem usar personagens, logótipos ou assets protegidos.

## Stack

- Vite + TypeScript, sem framework de UI (a app é pequena o suficiente para não precisar de React/Vue — menos dependências, bundle mais leve, mais fácil de manter offline).
- Estado local em `localStorage`, com um esquema tipado em `src/lib/storage.ts`.
- Sincronização cloud **opcional** via Supabase (`src/lib/sync.ts`) — a app funciona 100% offline sem qualquer configuração.
- PWA: `public/manifest.webmanifest` + `public/sw.js` (service worker escrito à mão, sem plugin).
- Testes: Vitest (`npm test`).

## Estrutura

```
src/
  data/        Exercícios, plano de treino (Academia+Casa x7 dias), dieta, hábitos
  lib/         storage, migração, datas, cálculo calórico, cliente Supabase, sync, notificações
  ui/          nav + 6 separadores (Hoje, Treino, Dieta, Progresso, Calendário, Ajustes) + componentes
supabase/schema.sql   Esquema opcional para sincronização cloud
tests/                Testes Vitest (storage, migração, dieta, treino)
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

## Sincronização cloud (opcional)

Sem `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`, o VProject funciona inteiramente com `localStorage` — nada quebra, apenas não sincroniza entre dispositivos.

Para ativar:

1. Cria um projeto em [supabase.com](https://supabase.com) (ou usa um existente).
2. No **SQL Editor**, corre o conteúdo de `supabase/schema.sql` — cria uma tabela `user_data` (chave/valor por utilizador) com Row Level Security, para que cada pessoa só veja os seus próprios dados.
3. Em **Project Settings → API**, copia o **Project URL** e a **anon public key**.
4. Cria um `.env.local` (baseado em `.env.example`) para desenvolvimento local, e/ou define os secrets do GitHub Actions acima para o site publicado.
5. Autenticação é **sem palavra-passe** (magic link por email) — nunca guardamos nem transmitimos passwords.

A estratégia de sincronização é *last-write-wins* por chave, comparando o timestamp local com `updated_at` no Supabase — suficiente para uso pessoal num único perfil em 2 dispositivos (iPhone + PC).

## Migração de dados antigos

Ao abrir a app pela primeira vez, `src/lib/migrate.ts` procura as chaves antigas `scar_*` (do `plano-scar.html`) no `localStorage` do mesmo browser/dispositivo e copia-as para o novo esquema `vp_*`. **As chaves antigas nunca são apagadas.**

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
- **PWA real**: manifest + service worker com cache do essencial da app, funcionamento offline e instalação no ecrã inicial.

## Limitações conhecidas / trabalho por fazer

- **Sincronização cloud não está provisionada** — o código e o esquema SQL estão prontos, mas é preciso seguir os passos acima para ligar a um projeto Supabase real. Isto foi deixado como passo manual em vez de automatizado porque envolve criar/gerir uma conta e recursos externos ao repositório.
- **Notificações no iOS**: só disparam com a app aberta em primeiro plano (limitação da própria plataforma para PWAs sem servidor de push dedicado). Explicado na app, no separador Ajustes.
- Não foram feitos testes manuais num iPhone físico nem num dispositivo Android físico — apenas em Chromium headless (mobile viewport) e verificação de responsividade em CSS. Testar em dispositivos reais antes do primeiro uso a sério é recomendado.
- Os valores nutricionais (kcal/macros) das opções de refeição são estimativas de referência, não dados de uma tabela nutricional certificada — suficientes para acompanhamento pessoal, não para prescrição clínica.
- Não existe um passo de build automatizado de ícones — se quiseres trocar a identidade visual, edita `public/icons/icon.svg` e volta a gerar os PNGs (qualquer ferramenta de rasterização de SVG serve, ex. `npx sharp-cli` ou o Supabase/qualquer conversor online).
