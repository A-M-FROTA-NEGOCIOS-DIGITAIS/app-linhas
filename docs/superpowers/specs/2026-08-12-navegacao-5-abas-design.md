# ALMA — Navegação de 5 abas e modelo diário (Frente A)

Data: 2026-08-12
Status: aprovado pelo dono do produto (aguardando revisão do spec escrito)

## Por que este trabalho existe

Hoje o cliente pagante vê um app de duas abas — Leitura e Estante. O `App.tsx`
manda quem tem compra aprovada para a `LeituraCompleta` e só quem está na
allowlist de admin para o `AppShell`, que tem quatro abas. Ou seja: existem dois
apps no mesmo repositório e **o cliente recebe o pobre**.

Pior, o app rico é resíduo do produto anterior ("Linhas"): a `Today.tsx` busca
`daily_insights` (tabela vazia) e `readings` com `reading_type = 'master'`, que o
ALMA nunca grava. A `Readings.tsx` filtra por `master | daily | themed |
compatibility`. Como ninguém além do admin abria essas telas, elas apodreceram
sem que se percebesse.

Esta frente unifica os dois apps em um só, com cinco abas, e liga o motor de
conteúdo diário que os mockups pressupõem.

## Escopo

**Dentro:** navegação de 5 abas, as seis telas (Hoje, Leituras, Leitura em
detalhe, Aurora, Estante, Você), o motor da carta diária, a tabela de catálogo de
produtos e o botão Comprar da Estante.

**Fora — vai para a Frente B (Hotmart):** o webhook que recebe a confirmação de
pagamento e libera acesso. Enquanto a Frente B não existe, a coluna "já pagou" é
alimentada por SQL manual, e o botão Comprar só aparece quando o
`checkout_url` do produto estiver preenchido.

A Frente A roda inteira sem a Frente B. Nenhuma tela quebra com o catálogo vazio.

## Decisões tomadas

### 1. Uma casca só (`AppShell`)

O `AppShell` vira a única casca. Ele é dono de exatamente duas coisas: qual aba
está ativa e qual overlay está aberto.

```
AppShell
├── abas ───────┬── Hoje       Today.tsx      (reescrita)
│               ├── Leituras   Readings.tsx   (reescrita)
│               ├── Aurora     AuroraChat.tsx (ganha empty state e quick replies)
│               ├── Estante    Estante.tsx    (ganha o botão Comprar)
│               └── Você       Profile.tsx    (adaptada ao ALMA)
│
└── overlays ───┬── leitura    visualizador de capítulos (core, produto ou diária)
                ├── sentenca   SentencaView
                ├── despertar  DespertarView
                ├── terceiro   TerceiroForm (compatibilidade | quem_ama)
                ├── outra-mao  OutraMaoFlow
                ├── rescan     PalmScan → Scanning
                └── intencao   IntentionScreen
```

Overlay ocupa a tela inteira, esconde a tab bar e sempre tem botão de voltar que
devolve para a aba de origem. É o padrão que o `AppShell` já usa.

O `App.tsx` deixa de bifurcar:

```
sem profile, ou profile.name vazio        → Onboarding
compra core aprovada  OU  e-mail admin    → AppShell
caso contrário                            → SemAcesso
```

O admin mantém o bypass, mas passa a ver **o mesmo app do cliente**. Isso é
deliberado: a divergência entre os dois shells é a causa raiz do problema que
originou esta frente.

A `LeituraCompleta` para de ser roteador e vira só o visualizador da leitura
core, aberto como overlay.

### 2. Um estado compartilhado (`useBiblioteca`)

Hoje, Leituras e Estante precisam dos mesmos três dados: `compras` aprovadas,
`readings` aprovadas e a `assinatura` ativa. A `Estante` já faz essas queries e
já cruza com `PRODUTOS_ESTANTE` para calcular `comprado` / `pronto`.

Essa lógica sai do componente e vira o hook `useBiblioteca(userId)`, que devolve
`{ itens, readings, compras, assinatura, loading, recarregar }`. As três abas
consomem o mesmo estado.

É isso que faz "os produtos da Estante comporem as Leituras" sem duplicar regra:
**Leituras renderiza os itens prontos; Estante renderiza todos** — mesma fonte,
filtros diferentes.

### 3. A carta do dia é uma `readings`, não uma `daily_insights`

A tela de Leituras mistura numa lista só, ordenada por data e com o mesmo
visualizador, itens do tipo Mestra, Diária e Temática. Se a carta diária morasse
em outra tabela, a aba viraria merge de duas fontes com ordenação em memória e o
visualizador precisaria entender dois formatos.

A carta do dia passa a ser uma linha em `readings` com `reading_type = 'daily'`.
A constraint do banco já aceita `daily` e `themed`. A `readings` já tem `theme`,
`word_count` e `capitulos`.

A `daily_insights` fica marcada como legado. Não é usada e não é removida nesta
frente (removê-la é limpeza sem valor imediato e com risco de quebrar a
`Today.tsx` antiga antes da reescrita entrar).

## Modelo de dados

### Alterações em `readings`

| Coluna | Tipo | Para quê |
|---|---|---|
| `titulo` | `text` | Título de topo da leitura. Hoje só existe `capitulos[].titulo`, que não serve para a lista nem para o cabeçalho do detalhe. |
| `traco_origem` | `text` | O traço da palma que originou o texto: `"Coração · quebra dupla"`. Aparece no rodapé da carta e no subtítulo de cada item da lista. |
| `ultimo_capitulo_lido` | `int` | Retomar de onde parou. Default 0. |
| `aberta_em` | `timestamptz` | Última abertura. A Aurora usa para dizer "você abriu sua leitura há 4 horas". |
| `data_carta` | `date` nulo | Só para `reading_type='daily'`: o dia a que a carta se refere, no fuso de São Paulo. |

### Índice de idempotência da carta diária

```sql
create unique index readings_uma_carta_por_dia
  on public.readings (user_id, data_carta)
  where reading_type = 'daily';
```

Garante uma carta por pessoa por dia mesmo se o cron rodar duas vezes.

A coluna `data_carta` existe em vez de indexar `created_at::date` porque
`created_at` é `timestamptz` e o corte por dia precisa ser no fuso de São Paulo,
não em UTC. A conversão `at time zone` é `STABLE`, não `IMMUTABLE`, e portanto
não pode entrar em índice. A função de geração grava a data explicitamente.

### Permissão de escrita do progresso

A `readings` hoje tem só duas policies: `SELECT` das próprias e `INSERT` por
`service_role`. **Não existe policy de `UPDATE`** — ou seja, o cliente não
consegue gravar `aberta_em` nem `ultimo_capitulo_lido`, e o "continue de onde
parou" nunca sairia do lugar.

A correção não é liberar `UPDATE` na tabela, o que deixaria a pessoa reescrever o
conteúdo da própria leitura. É policy de linha mais permissão de coluna:

```sql
create policy "users can update own reading progress" on public.readings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

revoke update on public.readings from authenticated;
grant update (aberta_em, ultimo_capitulo_lido) on public.readings to authenticated;
```

RLS controla quais linhas; o `GRANT` por coluna controla quais campos.

### Tabela nova: `produtos_catalogo`

| Coluna | Tipo | Nota |
|---|---|---|
| `produto` | `text` PK | O código ALMA (`mestra`, `ritual`, …) |
| `nome` | `text` | Rótulo exibido — a lista canônica (ver Itens abertos) |
| `descricao` | `text` | Uma linha, mostrada na Estante |
| `preco_brl` | `numeric` | Exibição apenas; a cobrança é da plataforma |
| `checkout_url` | `text` nulo | Link da Hotmart. Nulo = botão Comprar não aparece |
| `ordem` | `int` | Ordem na Estante |
| `ativo` | `bool` | Desligar uma oferta sem apagar a linha |

RLS: leitura liberada para `authenticated`; escrita só `service_role`.

### O que deliberadamente não vira coluna

- **Streak** ("23 dias seguidos"): derivado contando dias consecutivos de
  `readings` com `reading_type='daily'` e `aberta_em` preenchida. Um contador
  seria uma segunda verdade que sai de sincronia.
- **Numeração da lista** (`01`, `14`): é posição, não identidade. `row_number()`
  por data. Coluna desincronizaria na primeira exclusão.
- **Tempo de leitura** ("6 min"): `word_count / 200`, arredondado para cima.
- **Fase da lua**: matemática pura no cliente, sem API.
- **Mercúrio retrógrado**: tabela de janelas até 2030 num arquivo de constantes.
  São ~3 janelas por ano, conhecidas com antecedência. Sem dependência externa;
  se errar um dia, nada quebra.

## As telas

### Hoje

Ordem vertical:

1. **Cabeçalho contextual** — `QUARTA · 14 MAI` à esquerda, fase da lua à direita.
2. **Saudação** — "Bom dia / Boa tarde / Boa noite, {primeiro nome}." por hora local.
3. **Diretiva do dia** — o `titulo` da carta de hoje, em serifada grande.
4. **Carta do Dia** — hora de geração, corpo, rodapé com `traco_origem`, e
   "LER MAIS →" que abre o overlay de leitura.
5. **Chips** — Hoje · Amor · Carreira · Família · Decisão.
6. **Continue de onde parou** — a leitura principal dela.
7. **Pergunte à Aurora** — pergunta sugerida que abre a aba Aurora já preenchida.

Três decisões dentro desta tela:

**Os chips navegam, não geram.** Tocar em "Amor" leva para a aba Leituras com o
filtro **Temáticas** ativo e o tema `amor` aplicado por cima — a aba mostra o
tema selecionado e um "×" para limpá-lo. Custo zero e sem ambiguidade sobre o
que o toque faz. A alternativa — cada chip gerar uma leitura temática na hora —
cobra uma chamada de API por toque e convida ao toque acidental. A geração
temática existe, mas fica no botão "+" da aba Leituras, onde a intenção é
explícita.

O chip "Hoje" é o estado neutro: mantém a pessoa no Hoje, sem navegar.

**O card "continue de onde parou" é dinâmico.** O mockup diz "SUA LEITURA
MESTRE", mas a Mestra é o upsell de R$97. Quem só tem a Leitura Completa
veria um card de produto que não comprou. Regra: mostra a Mestra se houver;
senão a leitura core. O rótulo acompanha.

**Sem palma não há carta.** A carta cita um traço concreto — é isso que a
diferencia de horóscopo. Se a pessoa não tem `palm_scans`, não se gera carta
alguma; o Hoje mostra no lugar um card "Complete seu scan" que abre o rescan.
Isso também tapa o buraco atual, em que uma falha no `analyze-palm` deixa a
pessoa sem caminho de volta para escanear.

Se não houver carta hoje por falha de geração, a seção some e as outras
permanecem. A aba nunca fica vazia.

### Leituras

Cabeçalho: `LEITURAS · {n}`, "Suas leituras.", e "{n} capítulos · {streak} dias
seguidos".

Chips: **Todas · Diárias · Temáticas · Produtos**. Escolhi quatro em vez dos
cinco do mockup porque os do mockup (Mestre, Diárias, Temáticas, Compatibilidade)
deixariam Ritual, Ano Interior, Sentença, Quem Te Ama, Outra Mão e Marca da Vida
sem filtro nenhum. "Produtos" cobre tudo que veio da Estante, incluindo a
Leitura Completa e a Mestra.

Quando a aba é aberta por um chip do Hoje, o filtro **Temáticas** vem ativo com
o tema aplicado, exibido como um segundo chip removível. Sem isso, os chips do
Hoje apontariam para um filtro que não existe nesta lista.

Cada item: número por posição, tipo, data, `titulo` e `traco_origem`.

Botão "+" flutuante: gera uma leitura temática nova, via
`generate-themed-reading`, com escolha de tema antes. É a única ação da Frente A
que gasta API por toque, e é explícita.

### Leitura (detalhe)

Eyebrow com o `traco_origem` formatado, título, data e tempo de leitura, corpo em
capítulos, e citação em destaque quando o conteúdo trouxer uma.

Ao abrir, grava `aberta_em`. Ao rolar entre capítulos, atualiza
`ultimo_capitulo_lido` — é isso que alimenta o "continue de onde parou".

### Aurora

O chat já funciona. Ganha duas coisas:

**Empty state** — retrato da Madame Aurora, "Eu li sua palma. Pergunta o que
quiser.", um parágrafo citando os traços reais dela, e três perguntas sugeridas
geradas a partir desses traços. Sem palma, as sugestões viram genéricas.

**Quick replies** — chips acima do input, e contexto da última leitura aberta
(`aberta_em`) para a Aurora poder abrir a conversa como no mockup.

### Estante

Duas colunas de estado por produto:

- **já pagou** → "Ver" quando pronto, ou a ação pendente (preencher dados do
  terceiro, escanear a outra mão), ou "Preparando…"
- **não pagou** → botão **Comprar**, que abre `checkout_url` numa nova aba

O rótulo "Em breve" com botão desabilitado sai. Hoje ele mostra a lista inteira
de ofertas e **impede** a compra — a esteira está morta na interface.

Se `checkout_url` for nulo (catálogo ainda sem os links da Hotmart), o item
aparece esmaecido sem botão. Nada quebra.

### Você

Cabeçalho: avatar com a inicial, nome, e a linha `signo · mão · cidade` — a mão
vem de `palm_scans.analysis.hand_shape`, a cidade de `profiles.city_of_birth`.
Abaixo, "Membro desde {mês}" e o plano, derivado de `compras` e `assinaturas`.

Três contadores: **Leituras** (contagem de `readings`), **Capítulos** (soma de
`capitulos`) e **Dias** (o streak). Hoje os dois primeiros usam a mesma variável
`readingCount` e mostram sempre o mesmo número — é um defeito a corrigir.

Card "Sua Palma": miniatura de `palm_scans.image_url`, data do último scan e
botão Re-scan.

Configurações: Assinatura, Notificações, Sua intenção, Idioma, Exportar dados,
Sair, Apagar conta.

Dois defeitos existentes a corrigir de passagem: o contador duplicado acima, e o
`.map` que devolve um fragmento curto `<>` com `key` — fragmento curto não aceita
`key`, e o React avisa no console.

## O motor da carta diária

Cron `pg_cron` diário às 07:00 BRT. Para cada pessoa com acesso ativo, palma
escaneada e leitura core aprovada, gera uma carta.

Entrada do prompt: os traços da palma (`palm_scans.analysis`), a Marca
Adormecida (`profiles.marca_adormecida`), as respostas do quiz, a fase da lua e a
janela de Mercúrio retrógrado do dia.

Saída: `titulo` (a diretiva), corpo, `traco_origem`, `theme` e `data_carta`.

A hora exibida no card ("07:42") é o `created_at` da linha, formatado no fuso de
São Paulo. Não há coluna separada para isso.

Custo: uma chamada Haiku por pessoa por dia.

Falha na geração não tem retentativa no mesmo dia — a pessoa fica sem carta e o
Hoje degrada com elegância. Retentativa agressiva multiplicaria custo por um
ganho pequeno.

A função reaproveita o `extractText()` e o `parseJson()` já usados no
`analyze-palm`, e checa o `error` de toda escrita no banco. Ambos são exigências
registradas no `CLAUDE.md` depois de o mesmo tipo de bug aparecer três vezes.

## Erros e estados vazios

| Situação | Comportamento |
|---|---|
| Sem palma escaneada | Hoje mostra "Complete seu scan"; nenhuma carta é gerada; sugestões da Aurora ficam genéricas |
| Carta do dia falhou | A seção some do Hoje; as outras permanecem |
| Sem leitura core | O card "continue de onde parou" some |
| Catálogo sem `checkout_url` | Item esmaecido na Estante, sem botão Comprar |
| Geração temática falha | Erro na própria tela com "Tentar de novo", nunca código técnico |

Regra geral, herdada da correção da tela de scan: **nenhuma tela de erro sem
saída e nenhum código técnico exibido ao usuário.** Detalhe técnico vai para o
console e para o log da edge function.

## Itens abertos

1. **Nomes canônicos dos produtos.** O `PRODUTOS_ESTANTE` e o `CLAUDE.md`
   divergem em cinco dos nove: `ritual` ("Ritual de Ruptura" vs "O Ritual"),
   `quem_ama` ("Quem Te Ama" vs "Quem Você Ama"), `outra_mao` ("Sua Outra Mão" vs
   "A Outra Mão"), `downsell` ("A Marca da Vida" vs "Capítulo da Marca") e
   `audio` ("Áudio com Madame Aurora" vs "Áudio"). Esses nomes viram rótulo de
   botão de compra e precisam bater com o nome do produto na Hotmart. O dono do
   produto decide a lista; ela popula o `produtos_catalogo`.
2. **Links de checkout da Hotmart**, um por produto. Chegam depois; entram por
   UPDATE, sem deploy.
3. **"Raridade 74" do mockup do perfil.** Não existe cálculo definido. Proposta:
   percentil do `hand_shape` dela na base de `palm_scans`. Fica fora desta frente
   até o número ter significado acordado — exibir um número inventado corrói a
   credibilidade que a citação do traço constrói.

## Testes

- `useBiblioteca` com: sem compras, compras sem leitura gerada, compras com
  leitura pronta, e assinatura ativa e inativa.
- Cálculo do streak com dias consecutivos, com buraco no meio e com carta não
  aberta.
- Índice de idempotência: gerar duas cartas no mesmo dia falha na segunda,
  inclusive para geração perto da meia-noite no fuso de São Paulo.
- Permissão de coluna: o cliente consegue gravar `aberta_em` e
  `ultimo_capitulo_lido`, e **não** consegue alterar `capitulos` nem `titulo`.
- Estante: `checkout_url` nulo esconde o botão; preenchido abre o link.
- Hoje: sem palma, sem carta, sem leitura core — a tela renderiza nos três casos.
- Regressão do `App.tsx`: admin e cliente pagante chegam à mesma casca.
