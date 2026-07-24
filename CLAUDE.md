# ALMA — Contexto do Produto (ler antes de qualquer alteração)

> Este arquivo é a fonte de verdade sobre O QUE é o produto ALMA e o que já existe no código.
> Sempre que houver dúvida sobre nomenclatura, regra de negócio ou prioridade, consultar aqui primeiro.
>
> Última atualização: 17/07 — reconciliado com o estado real do código pelo Claude Code.
> Integração de pagamento (Bluen) em standby; produto deve ser construído de forma agnóstica à
> plataforma de pagamento.

## A ideia central

"A leitura de palma que não adivinha o futuro — revela o padrão que a pessoa repete no amor e a
**Marca Adormecida** que o criou."

Mecanismo: o app lê a mão de verdade (câmera + visão computacional) + um quiz de 7 perguntas.
Esses dados são cruzados pelo **Método das 3 Marcas**:
- **Coração** — como a pessoa ama
- **Mente** — como pensa o amor
- **Vida** — o que viveu

A persona que "fala" com o cliente é a **Madame Aurora**.

---

## Estado atual do desenvolvimento (atualizar sempre que algo mudar)

### ✅ Já existe e funciona (deployado, sem erros de tipo)

**Onboarding e acesso:**
- Fluxo completo: Splash → Intro → EmailEntry (login apenas — autocadastro livre foi desativado) →
  BasicData → Quiz (7 perguntas) → PalmScan → Scanning → Revelation → Paywall (R$47) → Welcome
- Acesso restrito: só entra no app quem tem conta pré-criada via webhook de compra, ou está na
  allowlist de admin (`jmorais@unigranrio.br`, em `App.tsx` — email real usado pra testar o app, não
  confundir com o email da conta Claude.ai de quem desenvolve). Sem compra aprovada → tela `SemAcesso`
- `intake-quiz-externo` — recebe do funil externo de marketing (quiz + palma +, opcionalmente, a
  leitura core já pronta) e vincula à conta. Tabela `quiz_externo_pendente` cobre o caso da conta
  ainda não existir na hora do envio (concilia com o que chegar primeiro)

**Motor de geração (Supabase Edge Functions, Deno):**
- `gerar-leitura` — gera a leitura core (6 capítulos, Método das 3 Marcas) via Claude, com portão de
  qualidade (Haiku avalia, até 3 tentativas). Usado como fallback quando o marketing não manda a
  leitura pronta
- `gerar-produto` — roteador que gera os produtos adicionais: **Mestra** (portão anti-repetição do
  core), **Ritual**, **Compatibilidade/Quem Ama** (aguarda dados do terceiro via formulário no app),
  **Ano Interior** (12 blocos verificados como distintos), **Downsell**, **Sentença** (frase + imagem
  SVG compartilhável), **Áudio** via ElevenLabs TTS (voz "Elena Vinter") — **ativo e testado (21/07)**
- `despertar-releitura-trimestral` — job via `pg_cron` (roda 6h todo dia), gera re-leitura para
  assinaturas do Despertar ativas cuja data já venceu
- `webhook-bluen` — recebe confirmação de pagamento da Bluen, cria/ativa a conta do cliente, registra
  a compra (idempotente por `bluen_tx_id`). **Em standby** — ver seção abaixo

**Tabelas:** `sessoes`, `compras`, `readings`, `assinaturas`, `releituras`, `diario_marca` (vazia,
feature futura), `quiz_externo_pendente`

**App (telas):**
- `LeituraCompleta.tsx` **é** o App Home — não existe uma tela de retorno separada. Ela gera/carrega a
  leitura core e, na mesma tela, tem roteamento interno para:
  - `Estante` — hub que lista os 9 produtos adicionais + Despertar, mostrando o que foi comprado,
    o que já está pronto, e o que ainda não foi comprado ("Em breve" — ver nota de UX abaixo)
  - `AddonReadingView` — visualizador genérico de capítulos (Mestra, Ritual, Vínculos, Ano Interior, Downsell)
  - `SentencaView` — frase + imagem compartilhável
  - `DespertarView` — status da assinatura + lista de re-leituras
  - `TerceiroForm` — coleta nome/nascimento/relação de um terceiro (Compatibilidade/Quem Ama)
  - `OutraMaoFlow` — reaproveita `PalmScan`+`Scanning` para escanear a mão não-dominante

### ⚠️ Ainda NÃO existe / pendente

- **Esteira dinâmica com fila de prioridade** — a `Estante` hoje é uma lista estática dos 9 produtos
  com status (comprado/pronto/em breve). **Não existe** a lógica de "próximo produto que a pessoa
  ainda não tem" (Mestra → Quem Você Ama → 12 Meses → Compatibilidade → Outra Mão → Áudio) descrita
  na regra da esteira dinâmica abaixo — isso precisaria ser construído se for prioridade
- **O Diário** — tabela `diario_marca` criada mas vazia, tratar como futuro, não construir UI ainda

✅ **Resolvido (17/07):** regra "só quem tem a Mestra acessa o Despertar" agora é verificada em
`DespertarView.tsx` — sem a Mestra aprovada, o CTA de assinar não aparece, só uma mensagem explicando
o requisito.

✅ **Resolvido (21/07): bug crítico de extração de texto das respostas do Claude.** Todas as edge
functions que chamam a API da Anthropic indexavam `message.content[0]` cegamente para pegar o texto.
Com os modelos mais novos, blocos de "thinking" podem vir antes do texto no array `content`, fazendo
`content[0].type !== 'text'` e o texto extraído ficar vazio — causando falha silenciosa (ex:
`gerar-leitura` falhava após as 3 tentativas de geração, sem log claro do motivo real). Corrigido com
um helper `extractText()` (procura o primeiro bloco `type:'text'` no array) em todas as 9 funções que
usavam esse padrão: `gerar-leitura`, `gerar-produto`, `despertar-releitura-trimestral`, `analyze-palm`,
`ai-chat-response`, `generate-master-reading`, `generate-themed-reading`, `generate-daily-insight`,
`compatibility-analysis`. **Se uma função de geração nova "falhar do nada" no futuro, replicar o
`extractText()` — nunca copiar o padrão antigo `content[0].type === 'text' ? content[0].text : ''`.**

✅ **Resolvido (21/07): Áudio (ElevenLabs) ativado.** `ELEVENLABS_API_KEY` e `ELEVENLABS_VOICE_ID`
configurados (voz "Elena Vinter", conta do Alexander). Testado ponta a ponta via `gerar-produto` com
`produto:'audio'` — gera o mp3 e sobe para o bucket público `audios`. `LeituraCompleta` agora tem um
player `<audio>` visível abaixo do card da Marca Adormecida quando `readings.audio_url` existe.

✅ **Testado (21/07): todos os produtos do `gerar-produto` funcionam.** Além do core e do áudio, testei
manualmente Mestra, Ritual, Ano Interior (12meses), Downsell, Sentença e Compatibilidade (com
`contexto_terceiro` de exemplo) — todos geraram com sucesso na 1ª tentativa após a correção do bug de
extração de texto. A imagem SVG da Sentença também foi verificada (XML válido, texto legível,
quebra de linha correta).

**Bug de schema encontrado e corrigido (21/07):** a tabela `compras` tinha um CHECK CONSTRAINT
(`compras_produto_check`) que só aceitava os códigos **antigos** (`upsell_mestra`, `bump_ritual`,
`bump_ano_interior`, `bump_outra_mao`, `bump_audio`, `downsell_cap_marca`, `upsell_quem_ama`,
`pos_sentenca`, `assinatura_despertar`), enquanto todo o resto do sistema já usa os códigos novos.
Corrigido para aceitar `leitura_core, mestra, ritual, compatibilidade, quem_ama, 12meses, outra_mao,
downsell, audio, sentenca, despertar` — sem isso, qualquer webhook de pagamento (Bluen ou outra
plataforma) falharia ao tentar registrar uma compra de produto adicional.

**Bug crítico #2 encontrado e corrigido (23/07): falha silenciosa em 4 produtos.** A tabela `readings`
tinha o MESMO tipo de problema — `readings_reading_type_check` só aceitava um conjunto antigo de
valores, e `gerar-produto` tentava gravar `12meses`/`downsell`/`compatibilidade` (que não batiam) sem
nunca checar o campo `error` do `.insert()`. Resultado: a API respondia `{ok:true}` mas **nada era
salvo no banco** para esses 3 produtos + `outra_mao` (que sequer tentava gerar uma leitura, só
marcava a sessão como vinculada). Só foi descoberto comparando a resposta da API com o conteúdo real
do banco — nunca confiar apenas em `{ok:true}` sem verificar a gravação em casos assim.
Corrigido: constraint atualizada, todos os `.insert()` em `readings` agora checam erro e lançam
exceção se falharem, e `outra_mao` agora gera de fato uma leitura comparando mão dominante e
não-dominante. **Todos os 9 produtos (core + 8 adicionais) re-testados e confirmados gravados no
banco com `qualidade_aprovada=true`.**

### ✅ Varredura completa de falhas silenciosas (23/07)

Depois de achar o bug acima duas vezes em arquivos diferentes, rodei uma varredura em TODAS as edge
functions procurando o mesmo padrão (`.insert`/`.update`/`.upsert` sem checar `{ error }`). Achou 27
ocorrências. Corrigidas todas as que **não dependem de nada externo**:
`despertar-releitura-trimestral`, `gerar-leitura`, `gerar-produto` (upload de áudio + update de
`audio_url` — mesma classe de bug, só que noutra função do arquivo), `intake-quiz-externo`,
`ai-chat-response` (bônus: corrigido também modelo desatualizado `claude-sonnet-4-6` → `claude-sonnet-5`).

**Deliberadamente NÃO corrigido ainda** (por instrução explícita do usuário — envolvem `webhook-bluen`
e `webhook-payment`, ambos ligados a pagamento/decisão de plataforma em standby):
- `webhook-bluen/index.ts`: 7 ocorrências, incluindo os updates de `subscription_status` (ativar/revogar
  acesso após pagamento/reembolso) — risco alto, mas mexer nisso agora é fora de escopo até a
  plataforma de pagamento ser decidida.
- `webhook-payment/index.ts`: 4 ocorrências (parece ser webhook legado de RevenueCat/Stripe do
  "Linhas" antigo, possivelmente não usado mais na prática, mas não confirmado).

**Why importante lembrar:** esse é o mesmo tipo de bug batendo pela 3ª vez no mesmo dia — sempre que
escrever uma nova edge function que grava no banco, checar `{ error }` de toda chamada Supabase por
padrão, não como exceção.

**How to apply:** quando a plataforma de pagamento for decidida e o usuário pedir pra mexer no
webhook correspondente, aplicar a MESMA correção (checar erro, lançar exceção nos updates críticos de
acesso/pagamento) nesse arquivo também.

### ✅ Compliance de `palma_imagem_url` — confirmado (19/07)

O documento original diz: *"a foto da mão é descartada na hora... a imagem nunca persiste"* (LGPD/BIPA/GDPR).
O campo `palma_imagem_url` (salvo em `sessoes`/`readings` a partir de `intake-quiz-externo`) guarda uma
URL apontando para a foto da palma vinda do funil externo de marketing. **O dono do produto confirmou
com quem decide a regra de compliance que isso não é um problema** — segue sendo usado normalmente,
sem alteração de código necessária.

### ⏸️ Integração de pagamento — EM STANDBY (não é prioridade agora)

**Decisão do dono do produto (16/07):** a integração com a Bluen está pausada. Não se trata mais de
confirmar nome de produto (`core` vs `leitura_core`) — a plataforma de pagamento pode mudar
completamente (talvez não seja a Bluen). Por isso:

- **Não mexer** no `webhook-bluen` nem no `mapProduto()` por enquanto — deixar como está
- **Não é bloqueio** para o resto do desenvolvimento — o produto deve ser construído de forma
  agnóstica à plataforma de pagamento
- Retomar essa frente **somente quando a plataforma de pagamento for definitivamente escolhida**
- `webhook-bluen` hoje ainda usa nomenclatura antiga (`upsell_mestra`, `bump_ritual`, etc.) e não
  dispara `gerar-produto` automaticamente — isso é esperado e está OK ficar assim por ora

**Nomenclatura de produto a manter no restante do código** (fora do webhook de pagamento):
`leitura_core, mestra, ritual, compatibilidade, quem_ama, 12meses, outra_mao, downsell, audio, sentenca, despertar`
(usa-se `leitura_core`, não `core`, porque é o nome já espalhado por várias tabelas/telas desde antes
desta decisão — reconciliar para `core` só junto com a escolha final da plataforma de pagamento)

---

## Estrutura de produtos (o que cada um entrega)

| Código | Nome | Papel | Preço BR |
|---|---|---|---|
| `leitura_core` | Leitura Completa | Produto principal — porta de entrada de todo mundo | R$ 47 |
| `compatibilidade` | Compatibilidade | Bump no checkout | +R$ 27 |
| `audio` | Áudio | Bump / micro-oferta (TTS ElevenLabs) | +R$ 14 |
| `12meses` | O Seu Ano Interior | Bump OU Downsell 2 (mesmo produto/preço, framing diferente) | R$ 37 |
| `mestra` | Leitura Mestra | Upsell 1 — logo após comprar o core | R$ 97 |
| `downsell` | Capítulo da Marca | Downsell 1 — só quem recusou a Mestra | R$ 39 |
| `quem_ama` | Quem Você Ama | Upsell 2 — pede consentimento (dado de terceiro) | R$ 67 |
| `outra_mao` | A Outra Mão | Bump especial — exige 2º scan (mão não-dominante) na entrega | — |
| `ritual` | O Ritual | Bump premium — protocolo prático a partir da Marca | — |
| `sentenca` | A Sentença | Pós-entrega, app — frase-destino em imagem compartilhável | — |
| `despertar` | O Despertar | Assinatura trimestral — só para quem tem a Mestra (regra ainda não aplicada no código) | — |

### Regra da esteira dinâmica (ainda não implementada como fila de prioridade)
Intenção: nunca repetir oferta, nunca deixar slot vazio. Cada slot puxaria da fila de prioridade o
**próximo produto que a pessoa ainda não tem**:

```
Mestra → Quem Você Ama → 12 Meses → Compatibilidade → A Outra Mão → Áudio
```

Hoje a `Estante` só lista todos os 9 com status — essa fila de priorização precisa ser construída
separadamente se for prioridade.

### Regra de recorrência
Só quem tem a **Leitura Mestra** acessa o Despertar (re-leitura) — checagem implementada em
`DespertarView.tsx` (verifica `compras` com `produto='mestra'` e `status='aprovado'`).

---

## As 2 regras inegociáveis (nunca furar)

1. **Nada é gerado antes do pagamento confirmar.** Quando a integração de pagamento for retomada, o
   webhook da plataforma escolhida deve ser a fonte única da verdade: `webhook → grava compra
   (idempotente por id de transação) → dispara gerar-produto`.
2. **A foto da mão em si não persiste no fluxo próprio do app.** A exceção é `palma_imagem_url`, vinda
   do funil externo de marketing via `intake-quiz-externo` — já confirmada como aceitável (ver nota
   de compliance acima).

---

## O "portão de qualidade" (roda antes de toda entrega do core)

Implementado em `gerar-leitura` via um segundo modelo (Haiku) avaliando 5 critérios:
- especificidade (usa dados reais do quiz/palma, não é genérico)
- voz (tom íntimo, sem clichê de horóscopo)
- profundidade (insight real, não óbvio)
- estrutura (6 capítulos com conteúdo substancial)
- sem previsões de futuro

Se reprovar → regenera (até 3 tentativas). Os produtos adicionais (Mestra, Ano Interior) têm suas
próprias checagens específicas dentro de `gerar-produto` (anti-repetição, blocos distintos), mas não
passam pelo mesmo portão de qualidade via Haiku — só o core tem essa segunda checagem por IA.

---

## Arquitetura / Edge Functions (Supabase) — nomes reais no código

| Arquivo | Função |
|---|---|
| `gerar-leitura` | Gera a leitura core (6 capítulos) via Claude, com portão de qualidade via Haiku |
| `intake-quiz-externo` | Recebe quiz/palma/leitura pronta do funil externo de marketing, vincula à conta |
| `gerar-produto` | Roteador central dos produtos adicionais (mestra, ritual, vínculos, 12meses, downsell, sentença, áudio) |
| `despertar-releitura-trimestral` | Job agendado (pg_cron) — re-leitura trimestral para assinantes do Despertar |
| `webhook-bluen` | Recebe confirmação de pagamento da Bluen (em standby, ver seção acima) |
| `analyze-palm` | Analisa a foto da palma capturada dentro do app (onboarding próprio, sem funil externo) |

---

## Design system

- **Paleta:** navy `#1A1A2E` (fundo) · dourado `#C9A227` (CTA) · dourado-escuro `#8A6D1A` (títulos) ·
  creme `#FBF0D2` (texto) — no código atual as variáveis CSS usadas são `--accent-gold` (`#C9A961`),
  `--bg-primary`, `--bg-surface`, `--text-primary/secondary/muted`, `--border-subtle`
- **Tipografia:** títulos serifada elegante (`--font-serif`); corpo sans humanista (`--font-sans`).
  Aurora fala em itálico quando é a voz dela, romano quando é o sistema
- **Ritmo:** respiro generoso, uma decisão por tela, nunca menu. Ouro é escasso — só no que importa

---

## Fora de escopo deste repositório (não é código do app)

Os itens abaixo existem no documento de produto mas são de **marketing/negócio**, não geram código
aqui — servem só como contexto de por que o produto é como é:
- Criativos de anúncio, VSL, testes A/B de hook/preço
- Sequência de e-mail (roda no N8N — só o "card gêmeo" no App Home é código deste repo, se vier a existir)
- Prova social/depoimentos, FAQ de landing page
- Preços detalhados por mercado (só importa saber que o preço varia por idioma/mercado no código)

---

## Stack

React + TypeScript + Vite (Vercel) · Supabase (banco + Edge Functions, Deno) · Claude API (gera as
leituras) · ElevenLabs (voz da Aurora, ainda não ativado) · Bluen (cobrança/MoR, em standby) · PostHog
(métricas)
