# ALMA Frente A — Plano 1: Fundação e navegação unificada

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unificar os dois shells do app num `AppShell` de 5 abas (Hoje, Leituras, Aurora, Estante, Você), com a Estante finalmente vendendo os produtos da esteira.

**Architecture:** O `AppShell` passa a ser a única casca, dona de duas coisas — aba ativa e overlay aberto. A `LeituraCompleta` deixa de rotear e vira só o visualizador da leitura core. Um hook `useBiblioteca` centraliza as três queries (compras, readings, assinatura) que Hoje, Leituras e Estante compartilham. O `App.tsx` para de bifurcar entre cliente e admin.

**Tech Stack:** React 18 + TypeScript + Vite, Zustand, Supabase (Postgres + RLS), Tailwind, i18next. Testes com Vitest + Testing Library (instalados na Tarefa 1).

**Spec:** `docs/superpowers/specs/2026-08-12-navegacao-5-abas-design.md`

**Fora deste plano:** o motor da carta diária (Plano 2) e o webhook da Hotmart (Frente B).

---

## Preparação

Trabalhe numa worktree isolada. A `main` tem deploy automático para produção em
`almaurora.com` — commits diretos nela vão ao ar para clientes reais.

```bash
cd N:/projetos/GitHub/app-linhas
git worktree add ../app-linhas-navegacao -b frente-a-navegacao
cd ../app-linhas-navegacao
npm ci
```

As migrations são aplicadas no projeto Supabase `pwlzmpzhschxtwnitbpk`. Não há
ambiente de staging: as alterações de schema são aditivas e retrocompatíveis de
propósito, para que a produção atual continue funcionando enquanto o branch é
desenvolvido.

---

## Estrutura de arquivos

**Criar:**
- `vitest.config.ts` — configuração do runner
- `src/test/setup.ts` — setup do Testing Library
- `src/hooks/useBiblioteca.ts` — as três queries compartilhadas e o cruzamento com o catálogo
- `src/hooks/useBiblioteca.test.ts`
- `src/lib/leitura.ts` — funções puras: streak, tempo de leitura, numeração
- `src/lib/leitura.test.ts`
- `supabase/migrations/002_progresso_e_catalogo.sql`

**Modificar:**
- `src/App.tsx` — remover a bifurcação cliente/admin
- `src/components/screens/AppShell.tsx` — 5 abas e os overlays vindos da LeituraCompleta
- `src/components/screens/app/Estante.tsx` — botão Comprar, consumindo o hook
- `src/components/screens/app/Profile.tsx` — adaptar ao ALMA e corrigir dois defeitos
- `src/components/screens/app/Readings.tsx` — reescrever para o vocabulário ALMA
- `src/components/screens/app/Today.tsx` — reescrever (versão sem carta diária)
- `src/types/index.ts` — tipos novos
- `src/locales/pt-BR.ts`, `en.ts`, `es.ts` — rótulos novos

---

### Tarefa 1: Infraestrutura de teste

**Files:**
- Create: `vitest.config.ts`, `src/test/setup.ts`, `src/lib/leitura.ts`, `src/lib/leitura.test.ts`
- Modify: `package.json`

- [ ] **Passo 1: Instalar as dependências**

```bash
npm i -D vitest@^2.1.8 jsdom@^25.0.1 @testing-library/react@^16.1.0 @testing-library/jest-dom@^6.6.3 @testing-library/user-event@^14.5.2
```

- [ ] **Passo 2: Criar `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

- [ ] **Passo 3: Criar `src/test/setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Passo 4: Adicionar o script de teste ao `package.json`**

Em `scripts`, adicione a linha `test` logo depois de `build`:

```json
    "test": "vitest run",
```

- [ ] **Passo 5: Escrever o primeiro teste, que deve falhar**

Crie `src/lib/leitura.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { tempoDeLeitura } from './leitura'

describe('tempoDeLeitura', () => {
  it('converte palavras em minutos arredondando para cima', () => {
    expect(tempoDeLeitura(1000)).toBe(5)
    expect(tempoDeLeitura(1001)).toBe(6)
  })

  it('nunca devolve menos de 1 minuto', () => {
    expect(tempoDeLeitura(0)).toBe(1)
    expect(tempoDeLeitura(undefined)).toBe(1)
  })
})
```

- [ ] **Passo 6: Rodar e confirmar que falha**

Rode: `npm test -- src/lib/leitura.test.ts`
Esperado: FAIL com `Failed to resolve import "./leitura"`.

- [ ] **Passo 7: Implementar o mínimo**

Crie `src/lib/leitura.ts`:

```ts
const PALAVRAS_POR_MINUTO = 200

export function tempoDeLeitura(wordCount?: number): number {
  if (!wordCount) return 1
  return Math.max(1, Math.ceil(wordCount / PALAVRAS_POR_MINUTO))
}
```

- [ ] **Passo 8: Rodar e confirmar que passa**

Rode: `npm test -- src/lib/leitura.test.ts`
Esperado: PASS, 2 testes.

- [ ] **Passo 9: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/test/setup.ts src/lib/leitura.ts src/lib/leitura.test.ts
git commit -m "chore: configura vitest e adiciona tempoDeLeitura"
```

---

### Tarefa 2: Streak de dias consecutivos

O perfil e a aba Leituras mostram "N dias seguidos". O spec decidiu derivar em
vez de guardar um contador, para não criar uma segunda verdade.

**Files:**
- Modify: `src/lib/leitura.ts`, `src/lib/leitura.test.ts`

- [ ] **Passo 1: Escrever o teste que falha**

Acrescente ao fim de `src/lib/leitura.test.ts`:

```ts
import { calcularStreak } from './leitura'

describe('calcularStreak', () => {
  const hoje = new Date('2026-08-12T12:00:00-03:00')

  it('conta dias consecutivos terminando hoje', () => {
    const datas = ['2026-08-12', '2026-08-11', '2026-08-10']
    expect(calcularStreak(datas, hoje)).toBe(3)
  })

  it('aceita que a sequencia termine ontem', () => {
    const datas = ['2026-08-11', '2026-08-10']
    expect(calcularStreak(datas, hoje)).toBe(2)
  })

  it('para no primeiro buraco', () => {
    const datas = ['2026-08-12', '2026-08-11', '2026-08-08', '2026-08-07']
    expect(calcularStreak(datas, hoje)).toBe(2)
  })

  it('devolve zero quando a ultima data e antiga demais', () => {
    expect(calcularStreak(['2026-08-01'], hoje)).toBe(0)
  })

  it('devolve zero para lista vazia', () => {
    expect(calcularStreak([], hoje)).toBe(0)
  })

  it('ignora datas repetidas', () => {
    const datas = ['2026-08-12', '2026-08-12', '2026-08-11']
    expect(calcularStreak(datas, hoje)).toBe(2)
  })
})
```

- [ ] **Passo 2: Rodar e confirmar que falha**

Rode: `npm test -- src/lib/leitura.test.ts`
Esperado: FAIL, `calcularStreak is not a function`.

- [ ] **Passo 3: Implementar**

Acrescente a `src/lib/leitura.ts`:

```ts
/**
 * Conta dias consecutivos a partir de hoje (ou de ontem, para nao zerar o
 * streak de quem ainda nao abriu o app hoje).
 *
 * `datas` sao strings YYYY-MM-DD ja no fuso de Sao Paulo.
 */
export function calcularStreak(datas: string[], agora = new Date()): number {
  if (datas.length === 0) return 0

  const unicas = [...new Set(datas)].sort().reverse()
  const umDia = 24 * 60 * 60 * 1000
  const meiaNoite = (d: string) => new Date(`${d}T00:00:00`).getTime()

  const hoje = meiaNoite(
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(agora),
  )

  const diferencaInicial = (hoje - meiaNoite(unicas[0])) / umDia
  if (diferencaInicial > 1) return 0

  let streak = 1
  for (let i = 1; i < unicas.length; i++) {
    const diff = (meiaNoite(unicas[i - 1]) - meiaNoite(unicas[i])) / umDia
    if (diff !== 1) break
    streak++
  }
  return streak
}
```

- [ ] **Passo 4: Rodar e confirmar que passa**

Rode: `npm test -- src/lib/leitura.test.ts`
Esperado: PASS, 8 testes.

- [ ] **Passo 5: Commit**

```bash
git add src/lib/leitura.ts src/lib/leitura.test.ts
git commit -m "feat: calcularStreak derivado das datas, sem contador no banco"
```

---

### Tarefa 3: Migration do progresso de leitura e do catálogo

**Files:**
- Create: `supabase/migrations/002_progresso_e_catalogo.sql`

- [ ] **Passo 1: Escrever a migration**

Crie `supabase/migrations/002_progresso_e_catalogo.sql`:

```sql
-- ── Progresso de leitura ──────────────────────────────────────────────────────
alter table public.readings
  add column if not exists titulo               text,
  add column if not exists traco_origem         text,
  add column if not exists ultimo_capitulo_lido int  not null default 0,
  add column if not exists aberta_em            timestamptz,
  add column if not exists data_carta           date;

-- Uma carta diaria por pessoa por dia. A coluna data_carta existe em vez de
-- indexar created_at::date porque o corte do dia precisa ser no fuso de Sao
-- Paulo, e `at time zone` e STABLE (nao IMMUTABLE), logo nao entra em indice.
create unique index if not exists readings_uma_carta_por_dia
  on public.readings (user_id, data_carta)
  where reading_type = 'daily';

-- O cliente precisa gravar progresso, mas nao pode reescrever o conteudo da
-- propria leitura. RLS decide a linha; GRANT por coluna decide o campo.
drop policy if exists "users can update own reading progress" on public.readings;
create policy "users can update own reading progress" on public.readings
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

revoke update on public.readings from authenticated;
grant update (aberta_em, ultimo_capitulo_lido) on public.readings to authenticated;

-- ── Catalogo de produtos ──────────────────────────────────────────────────────
create table if not exists public.produtos_catalogo (
  produto      text primary key,
  nome         text not null,
  descricao    text,
  preco_brl    numeric,
  checkout_url text,
  ordem        int  not null default 0,
  ativo        boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.produtos_catalogo enable row level security;

drop policy if exists "catalogo legivel por autenticados" on public.produtos_catalogo;
create policy "catalogo legivel por autenticados" on public.produtos_catalogo
  for select to authenticated using (ativo);

drop policy if exists "catalogo escrito por service role" on public.produtos_catalogo;
create policy "catalogo escrito por service role" on public.produtos_catalogo
  for all using (auth.role() = 'service_role');

-- Seed. checkout_url fica nulo ate os links da Hotmart chegarem; a Estante
-- esconde o botao Comprar enquanto for nulo.
insert into public.produtos_catalogo (produto, nome, preco_brl, ordem) values
  ('mestra',          'Leitura Mestra',      97, 1),
  ('quem_ama',        'Quem Você Ama',       67, 2),
  ('12meses',         'O Seu Ano Interior',  37, 3),
  ('compatibilidade', 'Compatibilidade',     27, 4),
  ('outra_mao',       'A Outra Mão',       null, 5),
  ('audio',           'Áudio',               14, 6),
  ('ritual',          'O Ritual',          null, 7),
  ('downsell',        'Capítulo da Marca',   39, 8),
  ('sentenca',        'A Sentença',        null, 9)
on conflict (produto) do nothing;
```

Os nomes seguem a tabela do `CLAUDE.md`, que é a fonte de verdade declarada do
produto. A divergência com o `PRODUTOS_ESTANTE` está registrada como item aberto
do spec; se o dono do produto decidir outra lista, é um UPDATE nesta tabela.

- [ ] **Passo 2: Aplicar no Supabase**

Aplique via MCP (`apply_migration`, nome `progresso_e_catalogo`) ou pelo SQL
Editor do projeto `pwlzmpzhschxtwnitbpk`.

- [ ] **Passo 3: Verificar**

Rode no SQL Editor:

```sql
select count(*) as produtos from public.produtos_catalogo;
select column_name from information_schema.columns
 where table_name='readings' and column_name in
   ('titulo','traco_origem','ultimo_capitulo_lido','aberta_em','data_carta');
select policyname, cmd from pg_policies
 where tablename='readings' and cmd='UPDATE';
```

Esperado: `produtos = 9`; as 5 colunas listadas; uma policy de UPDATE.

- [ ] **Passo 4: Commit**

```bash
git add supabase/migrations/002_progresso_e_catalogo.sql
git commit -m "feat(db): progresso de leitura, indice da carta diaria e catalogo de produtos"
```

---

### Tarefa 4: Tipos do catálogo

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Passo 1: Acrescentar o tipo**

Depois da definição de `Compra` em `src/types/index.ts`:

```ts
export interface ProdutoCatalogo {
  produto: ProdutoAlma
  nome: string
  descricao?: string
  preco_brl?: number
  checkout_url?: string
  ordem: number
  ativo: boolean
}

/** Um produto da esteira com o estado da pessoa cruzado. */
export interface ItemBiblioteca {
  produto: ProdutoAlma
  nome: string
  preco_brl?: number
  checkout_url?: string
  comprado: boolean
  pronto: boolean
  precisaAcao: boolean
  reading?: Reading
}
```

Acrescente também os campos novos à interface `Reading`, junto de `audio_url`:

```ts
  titulo?: string
  traco_origem?: string
  ultimo_capitulo_lido?: number
  aberta_em?: string
  data_carta?: string
```

- [ ] **Passo 2: Verificar a compilação**

Rode: `npx tsc -b`
Esperado: sem erros.

- [ ] **Passo 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(types): ProdutoCatalogo, ItemBiblioteca e campos novos de Reading"
```

---

### Tarefa 5: Hook `useBiblioteca`

Centraliza as três queries que hoje só a Estante faz, e que Hoje e Leituras
também precisam. Tira do componente a regra de `comprado` / `pronto`.

**Files:**
- Create: `src/hooks/useBiblioteca.ts`, `src/hooks/useBiblioteca.test.ts`

- [ ] **Passo 1: Escrever o teste que falha**

Crie `src/hooks/useBiblioteca.test.ts`. Ele testa a função pura de cruzamento,
não o hook inteiro — é onde mora a regra:

```ts
import { describe, it, expect } from 'vitest'
import { cruzarBiblioteca } from './useBiblioteca'
import type { Compra, Reading, ProdutoCatalogo } from '@/types'

const catalogo: ProdutoCatalogo[] = [
  { produto: 'mestra', nome: 'Leitura Mestra', ordem: 1, ativo: true, checkout_url: 'https://pay/mestra' },
  { produto: 'quem_ama', nome: 'Quem Você Ama', ordem: 2, ativo: true },
  { produto: 'audio', nome: 'Áudio', ordem: 3, ativo: true },
]

const compra = (produto: string): Compra => ({
  id: `c-${produto}`, user_id: 'u1', produto: produto as Compra['produto'],
  status: 'aprovado', created_at: '2026-08-01T00:00:00Z',
})

const leitura = (produto: string, extra: Partial<Reading> = {}): Reading => ({
  id: `r-${produto}`, user_id: 'u1', reading_type: 'mestra' as Reading['reading_type'],
  produto: produto as Reading['produto'], created_at: '2026-08-02T00:00:00Z', ...extra,
})

describe('cruzarBiblioteca', () => {
  it('marca comprado e pronto quando ha compra e leitura', () => {
    const itens = cruzarBiblioteca(catalogo, [compra('mestra')], [leitura('mestra')])
    const mestra = itens.find((i) => i.produto === 'mestra')!
    expect(mestra.comprado).toBe(true)
    expect(mestra.pronto).toBe(true)
    expect(mestra.reading?.id).toBe('r-mestra')
  })

  it('marca comprado sem pronto quando a leitura ainda nao existe', () => {
    const itens = cruzarBiblioteca(catalogo, [compra('mestra')], [])
    expect(itens.find((i) => i.produto === 'mestra')!.pronto).toBe(false)
  })

  it('nao marca comprado quando nao ha compra', () => {
    const itens = cruzarBiblioteca(catalogo, [], [])
    expect(itens.every((i) => !i.comprado)).toBe(true)
  })

  it('trata o audio como pronto pelo audio_url da leitura core', () => {
    const core = leitura('leitura_core', { audio_url: 'https://cdn/a.mp3' })
    const itens = cruzarBiblioteca(catalogo, [compra('audio')], [core])
    expect(itens.find((i) => i.produto === 'audio')!.pronto).toBe(true)
  })

  it('marca precisaAcao para quem_ama comprado e nao gerado', () => {
    const itens = cruzarBiblioteca(catalogo, [compra('quem_ama')], [])
    expect(itens.find((i) => i.produto === 'quem_ama')!.precisaAcao).toBe(true)
  })

  it('nao marca precisaAcao para mestra, que gera sozinha', () => {
    const itens = cruzarBiblioteca(catalogo, [compra('mestra')], [])
    expect(itens.find((i) => i.produto === 'mestra')!.precisaAcao).toBe(false)
  })

  it('respeita a ordem do catalogo', () => {
    const itens = cruzarBiblioteca(catalogo, [], [])
    expect(itens.map((i) => i.produto)).toEqual(['mestra', 'quem_ama', 'audio'])
  })
})
```

- [ ] **Passo 2: Rodar e confirmar que falha**

Rode: `npm test -- src/hooks/useBiblioteca.test.ts`
Esperado: FAIL, `Failed to resolve import "./useBiblioteca"`.

- [ ] **Passo 3: Implementar**

Crie `src/hooks/useBiblioteca.ts`:

```ts
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Assinatura, Compra, ItemBiblioteca, ProdutoCatalogo, Reading } from '@/types'

/** Produtos que so ficam prontos depois de uma acao da propria pessoa. */
const EXIGEM_ACAO = new Set(['compatibilidade', 'quem_ama', 'outra_mao'])

/**
 * Cruza catalogo, compras e leituras num unico estado por produto.
 * Funcao pura, separada do hook para poder ser testada sem Supabase.
 */
export function cruzarBiblioteca(
  catalogo: ProdutoCatalogo[],
  compras: Compra[],
  readings: Reading[],
): ItemBiblioteca[] {
  const compradas = new Set(compras.map((c) => c.produto))

  const porProduto: Record<string, Reading> = {}
  for (const r of readings) if (r.produto) porProduto[r.produto] = r

  // O audio nao vira uma leitura propria: ele e anexado a leitura core.
  const coreTemAudio = !!porProduto['leitura_core']?.audio_url

  return [...catalogo]
    .sort((a, b) => a.ordem - b.ordem)
    .map(({ produto, nome, preco_brl, checkout_url }) => {
      const comprado = compradas.has(produto)
      const pronto = produto === 'audio' ? coreTemAudio : produto in porProduto
      return {
        produto,
        nome,
        preco_brl,
        checkout_url,
        comprado,
        pronto,
        precisaAcao: comprado && !pronto && EXIGEM_ACAO.has(produto),
        reading: porProduto[produto],
      }
    })
}

export function useBiblioteca(userId: string | null) {
  const [itens, setItens] = useState<ItemBiblioteca[]>([])
  const [readings, setReadings] = useState<Reading[]>([])
  const [compras, setCompras] = useState<Compra[]>([])
  const [assinatura, setAssinatura] = useState<Assinatura | null>(null)
  const [loading, setLoading] = useState(true)

  const recarregar = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setLoading(true)

    const [catalogoRes, comprasRes, readingsRes, assinaturaRes] = await Promise.all([
      supabase.from('produtos_catalogo').select('*').eq('ativo', true),
      supabase.from('compras').select('*').eq('user_id', userId).eq('status', 'aprovado'),
      supabase.from('readings').select('*').eq('user_id', userId).eq('qualidade_aprovada', true),
      supabase.from('assinaturas').select('*').eq('user_id', userId).eq('status', 'ativa').maybeSingle(),
    ])

    if (catalogoRes.error) console.error('useBiblioteca: catalogo', catalogoRes.error.message)
    if (comprasRes.error) console.error('useBiblioteca: compras', comprasRes.error.message)
    if (readingsRes.error) console.error('useBiblioteca: readings', readingsRes.error.message)

    const catalogo = (catalogoRes.data as ProdutoCatalogo[] | null) ?? []
    const listaCompras = (comprasRes.data as Compra[] | null) ?? []
    const listaReadings = (readingsRes.data as Reading[] | null) ?? []

    setCompras(listaCompras)
    setReadings(listaReadings)
    setAssinatura(assinaturaRes.data as Assinatura | null)
    setItens(cruzarBiblioteca(catalogo, listaCompras, listaReadings))
    setLoading(false)
  }, [userId])

  useEffect(() => { void recarregar() }, [recarregar])

  return { itens, readings, compras, assinatura, loading, recarregar }
}
```

- [ ] **Passo 4: Rodar e confirmar que passa**

Rode: `npm test -- src/hooks/useBiblioteca.test.ts`
Esperado: PASS, 7 testes.

- [ ] **Passo 5: Commit**

```bash
git add src/hooks/useBiblioteca.ts src/hooks/useBiblioteca.test.ts
git commit -m "feat: hook useBiblioteca com o cruzamento catalogo x compras x leituras"
```

---

### Tarefa 6: Estante com botão Comprar

**Files:**
- Modify: `src/components/screens/app/Estante.tsx`

- [ ] **Passo 1: Substituir o componente inteiro**

O componente deixa de fazer as próprias queries e passa a receber os itens do
hook. O rótulo "Em breve" com botão desabilitado sai; entra o botão Comprar.

Substitua todo o conteúdo de `src/components/screens/app/Estante.tsx`:

```tsx
import type { Assinatura, ItemBiblioteca, Reading } from '@/types'

interface Props {
  itens: ItemBiblioteca[]
  assinatura: Assinatura | null
  onOpenReading: (reading: Reading) => void
  onOpenDespertar: () => void
  onPreencherTerceiro: (produto: 'compatibilidade' | 'quem_ama') => void
  onEscanearOutraMao: () => void
  onRecarregar: () => void
}

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A961" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12l5 5L20 6" />
  </svg>
)

function labelStatus(item: ItemBiblioteca): string {
  if (!item.comprado) return item.checkout_url ? 'Comprar' : 'Indisponível'
  if (item.produto === 'audio') return item.pronto ? 'Ouça na leitura ↑' : 'Preparando…'
  if (item.pronto) return 'Ver'
  if (item.produto === 'compatibilidade' || item.produto === 'quem_ama') return 'Preencher dados →'
  if (item.produto === 'outra_mao') return 'Escanear mão →'
  return 'Preparando…'
}

function precoFormatado(preco?: number): string | null {
  if (preco == null) return null
  return `R$ ${preco.toFixed(0)}`
}

export function Estante({
  itens, assinatura, onOpenReading, onOpenDespertar,
  onPreencherTerceiro, onEscanearOutraMao, onRecarregar,
}: Props) {
  const handleClick = (item: ItemBiblioteca) => {
    if (!item.comprado) {
      if (item.checkout_url) window.open(item.checkout_url, '_blank', 'noopener')
      return
    }
    if (item.produto === 'audio') return
    if (item.pronto) {
      if (item.reading) onOpenReading(item.reading)
      return
    }
    if (item.produto === 'compatibilidade' || item.produto === 'quem_ama') {
      onPreencherTerceiro(item.produto)
      return
    }
    if (item.produto === 'outra_mao') {
      onEscanearOutraMao()
      return
    }
    // Mestra/Ritual/12meses/Downsell/Sentenca geram sozinhos apos a compra.
    // Se ainda nao ficou pronto, so recarrega para checar de novo.
    onRecarregar()
  }

  return (
    <div className="h-full scroll-area px-6 pt-12 pb-28">
      <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', marginBottom: 12 }}>
        Sua Estante
      </p>

      <div className="flex flex-col gap-2">
        <button
          onClick={onOpenDespertar}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderRadius: 8, width: '100%', textAlign: 'left',
            border: `1px solid ${assinatura ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
            background: assinatura ? 'rgba(201,169,97,0.06)' : 'var(--bg-surface)',
          }}
        >
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-primary)' }}>O Despertar</span>
          <span style={{ fontSize: 12, color: assinatura ? 'var(--accent-gold)' : 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
            {assinatura ? 'Ativo' : 'Ver'}
          </span>
        </button>

        {itens.map((item) => {
          const vendavel = !item.comprado && !!item.checkout_url
          const destacado = item.pronto || item.precisaAcao || vendavel
          const preco = precoFormatado(item.preco_brl)
          return (
            <button
              key={item.produto}
              onClick={() => handleClick(item)}
              disabled={!item.comprado && !vendavel}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', borderRadius: 8, width: '100%', textAlign: 'left',
                border: `1px solid ${destacado ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
                background: item.pronto ? 'rgba(201,169,97,0.06)' : 'var(--bg-surface)',
                opacity: item.comprado || vendavel ? 1 : 0.4,
                cursor: item.comprado || vendavel ? 'pointer' : 'default',
              }}
            >
              <span className="flex items-center gap-2">
                {item.pronto && <CheckIcon />}
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-primary)' }}>{item.nome}</span>
                {vendavel && preco && (
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>{preco}</span>
                )}
              </span>
              <span style={{ fontSize: 12, color: destacado ? 'var(--accent-gold)' : 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
                {labelStatus(item)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Passo 2: Verificar a compilação**

Rode: `npx tsc -b`
Esperado: erros apenas em `LeituraCompleta.tsx`, que ainda passa as props
antigas. Serão resolvidos na Tarefa 7.

- [ ] **Passo 3: Commit**

```bash
git add src/components/screens/app/Estante.tsx
git commit -m "feat(estante): botao Comprar por produto e estado vindo do useBiblioteca"
```

---

### Tarefa 7: `AppShell` com 5 abas e os overlays

**Files:**
- Modify: `src/components/screens/AppShell.tsx`

- [ ] **Passo 1: Reescrever o `AppShell`**

Substitua todo o conteúdo de `src/components/screens/AppShell.tsx`:

```tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TabBar, TabBarIcons, type TabDef } from '@/components/ui'
import { useAppStore } from '@/store/app'
import { useBiblioteca } from '@/hooks/useBiblioteca'
import { supabase } from '@/lib/supabase'
import { Today } from './app/Today'
import { Readings } from './app/Readings'
import { AuroraChat } from './app/AuroraChat'
import { Estante } from './app/Estante'
import { Profile } from './app/Profile'
import { AddonReadingView } from './app/AddonReadingView'
import { SentencaView } from './app/SentencaView'
import { DespertarView } from './app/DespertarView'
import { TerceiroForm } from './app/TerceiroForm'
import { OutraMaoFlow } from './app/OutraMaoFlow'
import { LeituraCompleta } from './LeituraCompleta'
import { PalmScan } from './onboarding/PalmScan'
import { Scanning } from './onboarding/Scanning'
import { IntentionScreen } from './onboarding/Intention'
import type { Reading, Intention } from '@/types'

type Tab = 'today' | 'readings' | 'aurora' | 'estante' | 'you'

type Overlay =
  | { type: 'leitura'; reading: Reading }
  | { type: 'leitura-core' }
  | { type: 'sentenca'; reading: Reading }
  | { type: 'despertar' }
  | { type: 'terceiro'; produto: 'compatibilidade' | 'quem_ama' }
  | { type: 'outra-mao' }
  | { type: 'rescan' }
  | { type: 'scanning'; imageDataUrl: string }
  | { type: 'intencao' }
  | null

interface Props {
  onSignOut: () => void
}

const TABS: TabDef[] = [
  { id: 'today', label: 'Hoje', icon: TabBarIcons.today },
  { id: 'readings', label: 'Leituras', icon: TabBarIcons.readings },
  { id: 'aurora', label: 'Aurora', icon: TabBarIcons.aurora },
  { id: 'estante', label: 'Estante', icon: TabBarIcons.grid },
  { id: 'you', label: 'Você', icon: TabBarIcons.you },
]

export function AppShell({ onSignOut }: Props) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<Tab>('today')
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [temaFiltro, setTemaFiltro] = useState<string | null>(null)
  const profile = useAppStore((s) => s.profile)
  const setProfile = useAppStore((s) => s.setProfile)
  const biblioteca = useBiblioteca(profile?.id ?? null)

  if (!profile) return null

  const fecharOverlay = () => setOverlay(null)

  const abrirLeitura = (reading: Reading) => {
    setOverlay(reading.produto === 'sentenca' ? { type: 'sentenca', reading } : { type: 'leitura', reading })
  }

  const irParaTema = (tema: string) => {
    setTemaFiltro(tema)
    setActiveTab('readings')
  }

  const handleChangeIntention = async (intention: Intention) => {
    const { error } = await supabase.from('profiles').update({ intention }).eq('id', profile.id)
    if (error) { console.error('Falha ao salvar intencao:', error.message); return }
    setProfile({ ...profile, intention })
    fecharOverlay()
  }

  if (overlay) {
    switch (overlay.type) {
      case 'leitura':
        return <AddonReadingView reading={overlay.reading} onBack={fecharOverlay} />
      case 'leitura-core':
        return <LeituraCompleta onBack={fecharOverlay} />
      case 'sentenca':
        return <SentencaView reading={overlay.reading} onBack={fecharOverlay} />
      case 'despertar':
        return <DespertarView userId={profile.id} onBack={fecharOverlay} />
      case 'terceiro':
        return (
          <TerceiroForm
            userId={profile.id}
            produto={overlay.produto}
            onBack={fecharOverlay}
            onConcluido={() => { void biblioteca.recarregar(); fecharOverlay() }}
          />
        )
      case 'outra-mao':
        return (
          <OutraMaoFlow
            userId={profile.id}
            onBack={fecharOverlay}
            onConcluido={() => { void biblioteca.recarregar(); fecharOverlay() }}
          />
        )
      case 'rescan':
        return (
          <PalmScan
            onCapture={(imageDataUrl) => setOverlay({ type: 'scanning', imageDataUrl })}
            onBack={fecharOverlay}
          />
        )
      case 'scanning':
        return (
          <Scanning
            imageDataUrl={overlay.imageDataUrl}
            userId={profile.id}
            onComplete={() => { void biblioteca.recarregar(); fecharOverlay() }}
            onBack={() => setOverlay({ type: 'rescan' })}
          />
        )
      case 'intencao':
        return (
          <div className="h-full flex flex-col relative">
            <button onClick={fecharOverlay} className="absolute top-14 left-5 z-10 p-2" style={{ color: 'var(--text-muted)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
            <IntentionScreen
              initialValue={profile.intention ?? undefined}
              eyebrow={t('profile.yourIntention')}
              onContinue={handleChangeIntention}
            />
          </div>
        )
    }
  }

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex-1 overflow-hidden">
        {activeTab === 'today' && (
          <Today
            profile={profile}
            biblioteca={biblioteca}
            onAbrirLeituraCore={() => setOverlay({ type: 'leitura-core' })}
            onAbrirLeitura={abrirLeitura}
            onIrParaTema={irParaTema}
            onAbrirAurora={() => setActiveTab('aurora')}
            onReScan={() => setOverlay({ type: 'rescan' })}
          />
        )}
        {activeTab === 'readings' && (
          <Readings
            biblioteca={biblioteca}
            temaFiltro={temaFiltro}
            onLimparTema={() => setTemaFiltro(null)}
            onAbrirLeituraCore={() => setOverlay({ type: 'leitura-core' })}
            onAbrirLeitura={abrirLeitura}
          />
        )}
        {activeTab === 'aurora' && <AuroraChat profile={profile} />}
        {activeTab === 'estante' && (
          <Estante
            itens={biblioteca.itens}
            assinatura={biblioteca.assinatura}
            onOpenReading={abrirLeitura}
            onOpenDespertar={() => setOverlay({ type: 'despertar' })}
            onPreencherTerceiro={(produto) => setOverlay({ type: 'terceiro', produto })}
            onEscanearOutraMao={() => setOverlay({ type: 'outra-mao' })}
            onRecarregar={() => void biblioteca.recarregar()}
          />
        )}
        {activeTab === 'you' && (
          <Profile
            profile={profile}
            biblioteca={biblioteca}
            onReScan={() => setOverlay({ type: 'rescan' })}
            onSignOut={onSignOut}
            onChangeIntention={() => setOverlay({ type: 'intencao' })}
            onAbrirDespertar={() => setOverlay({ type: 'despertar' })}
          />
        )}
      </div>

      <TabBar active={activeTab} onChange={(tab) => setActiveTab(tab as Tab)} tabs={TABS} />
    </div>
  )
}
```

- [ ] **Passo 2: Conferir as assinaturas reais dos componentes de overlay**

As props de `AddonReadingView`, `SentencaView`, `DespertarView`, `TerceiroForm`,
`OutraMaoFlow` e `LeituraCompleta` acima foram inferidas do uso atual dentro da
`LeituraCompleta`. Abra cada arquivo e ajuste os nomes de prop para os reais:

```bash
grep -n "^interface Props" -A 10 \
  src/components/screens/app/AddonReadingView.tsx \
  src/components/screens/app/SentencaView.tsx \
  src/components/screens/app/DespertarView.tsx \
  src/components/screens/app/TerceiroForm.tsx \
  src/components/screens/app/OutraMaoFlow.tsx
```

Onde divergir, corrija a chamada no `AppShell` — não o componente.

- [ ] **Passo 3: Adicionar a prop `onBack` à `LeituraCompleta`**

Em `src/components/screens/LeituraCompleta.tsx`, a `LeituraCompleta` hoje não
recebe props. Adicione a interface e o botão de voltar, e **remova** o `TabBar`
interno e o roteamento para Estante/Sentença/Despertar/Terceiro/OutraMão, que
agora vivem no `AppShell`:

```tsx
interface Props {
  onBack: () => void
}

export function LeituraCompleta({ onBack }: Props) {
```

Substitua o `SignOutButton` no topo por um botão de voltar que chama `onBack`.

- [ ] **Passo 4: Verificar a compilação**

Rode: `npx tsc -b`
Esperado: sem erros. Se sobrar erro em `Today`, `Readings` ou `Profile`, é
esperado — as props novas entram nas Tarefas 8, 9 e 10. Faça o commit apenas
quando essas três estiverem prontas, ou empilhe as tarefas 7-10 num commit só.

- [ ] **Passo 5: Commit**

```bash
git add src/components/screens/AppShell.tsx src/components/screens/LeituraCompleta.tsx
git commit -m "feat(shell): AppShell com 5 abas e todos os overlays centralizados"
```

---

### Tarefa 8: Aba Você adaptada ao ALMA

**Files:**
- Modify: `src/components/screens/app/Profile.tsx`

- [ ] **Passo 1: Trocar a assinatura e os contadores**

Em `src/components/screens/app/Profile.tsx`, substitua a interface `Props` e o
bloco de contadores.

Interface nova:

```tsx
import type { useBiblioteca } from '@/hooks/useBiblioteca'
import { calcularStreak } from '@/lib/leitura'

interface Props {
  profile: ProfileType
  biblioteca: ReturnType<typeof useBiblioteca>
  onReScan: () => void
  onSignOut: () => void
  onChangeIntention: () => void
  onAbrirDespertar: () => void
}
```

Remova o `useState`/`useEffect` de `readingCount` — o dado vem do hook.

- [ ] **Passo 2: Corrigir os dois defeitos dos contadores**

O bloco atual usa `readingCount` para "Leituras" **e** para "Capítulos", e o
`.map` devolve um fragmento curto `<>` com `key` nos filhos, que o React
recusa. Substitua o bloco inteiro por:

```tsx
      {(() => {
        const leituras = biblioteca.readings.length
        const capitulos = biblioteca.readings.reduce((soma, r) => soma + (r.capitulos?.length ?? 0), 0)
        const dias = calcularStreak(
          biblioteca.readings
            .filter((r) => r.reading_type === 'daily' && r.aberta_em)
            .map((r) => (r.data_carta ?? r.created_at).slice(0, 10)),
        )
        const stats = [
          { valor: leituras, label: t('profile.readings') },
          { valor: capitulos, label: t('profile.chapters') },
          { valor: dias, label: t('profile.days') },
        ]
        return (
          <div className="flex mx-5 mb-4 py-4" style={{ borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
            {stats.map(({ valor, label }, i) => (
              <React.Fragment key={label}>
                {i > 0 && <div style={{ width: 1, background: 'var(--border-subtle)' }} />}
                <div className="flex-1 text-center">
                  <p style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1 }}>{valor}</p>
                  <p className="text-[10px] text-text-muted uppercase tracking-widest mt-1.5">{label}</p>
                </div>
              </React.Fragment>
            ))}
          </div>
        )
      })()}
```

Garanta que `React` está importado: `import React, { useState } from 'react'`.

- [ ] **Passo 3: Adicionar a linha de identidade e o plano**

Logo abaixo do `<h1>` do nome, substitua a linha do signo por:

```tsx
        <p className="text-xs text-text-muted tracking-wider uppercase mt-1">
          {[zodiac, maoLabel, profile.city_of_birth].filter(Boolean).join(' · ')}
        </p>
        <p className="text-[11px] text-text-muted mt-1">
          {t('profile.memberSince', { mes: mesEntrada })}{plano ? ` · ${plano}` : ''}
        </p>
```

E, antes do `return`, calcule os três valores:

```tsx
  // O tipo de mao ("mao de fogo") vem de palm_scans.analysis.hand_shape, que o
  // useBiblioteca ainda nao carrega. Entra no Plano 2, junto com a miniatura da
  // palma. Ate la a linha mostra so signo e cidade.
  const maoLabel: string | null = null
  const mesEntrada = new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' })
    .format(new Date(profile.created_at))
  const plano = biblioteca.assinatura ? t('profile.planoDespertar') : null
```

- [ ] **Passo 4: Adicionar a linha Assinatura em Configurações**

Antes do botão "Exportar dados", acrescente:

```tsx
          <button onClick={onAbrirDespertar} className="flex items-center justify-between px-4 py-3.5 rounded-md text-sm text-text-secondary text-left" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            {t('profile.subscription')}
            <span className="text-xs text-text-muted">
              {biblioteca.assinatura ? t('profile.subscriptionActive') : t('profile.subscriptionNone')}
            </span>
          </button>
```

- [ ] **Passo 5: Adicionar as chaves de tradução**

Em `src/locales/pt-BR.ts`, dentro de `profile`:

```ts
    memberSince: 'Membro desde {{mes}}',
    planoDespertar: 'Despertar ativo',
    subscription: 'Assinatura',
    subscriptionActive: 'Ativa',
    subscriptionNone: 'Nenhuma',
```

Em `en.ts`:

```ts
    memberSince: 'Member since {{mes}}',
    planoDespertar: 'Despertar active',
    subscription: 'Subscription',
    subscriptionActive: 'Active',
    subscriptionNone: 'None',
```

Em `es.ts`:

```ts
    memberSince: 'Miembro desde {{mes}}',
    planoDespertar: 'Despertar activo',
    subscription: 'Suscripción',
    subscriptionActive: 'Activa',
    subscriptionNone: 'Ninguna',
```

- [ ] **Passo 6: Verificar a compilação**

Rode: `npx tsc -b`
Esperado: sem erros em `Profile.tsx`.

- [ ] **Passo 7: Commit**

```bash
git add src/components/screens/app/Profile.tsx src/locales/
git commit -m "feat(voce): perfil ALMA com assinatura e contadores corretos"
```

---

### Tarefa 9: Aba Leituras reescrita

**Files:**
- Modify: `src/components/screens/app/Readings.tsx`

- [ ] **Passo 1: Substituir o componente inteiro**

Some o vocabulário legado (`master`, `daily`, `themed`, `compatibility`). Neste
plano a lista mostra só os produtos; as diárias e temáticas entram no Plano 2,
mas os filtros já ficam prontos para elas.

Substitua todo o conteúdo de `src/components/screens/app/Readings.tsx`:

```tsx
import { useMemo, useState } from 'react'
import type { useBiblioteca } from '@/hooks/useBiblioteca'
import { calcularStreak, tempoDeLeitura } from '@/lib/leitura'
import type { Reading } from '@/types'

type Filtro = 'todas' | 'diarias' | 'tematicas' | 'produtos'

interface Props {
  biblioteca: ReturnType<typeof useBiblioteca>
  temaFiltro: string | null
  onLimparTema: () => void
  onAbrirLeituraCore: () => void
  onAbrirLeitura: (reading: Reading) => void
}

const FILTROS: { key: Filtro; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'diarias', label: 'Diárias' },
  { key: 'tematicas', label: 'Temáticas' },
  { key: 'produtos', label: 'Produtos' },
]

const NOMES: Record<string, string> = {
  leitura_core: 'Leitura Completa',
  mestra: 'Leitura Mestra',
  ritual: 'O Ritual',
  compatibilidade: 'Compatibilidade',
  quem_ama: 'Quem Você Ama',
  '12meses': 'O Seu Ano Interior',
  outra_mao: 'A Outra Mão',
  downsell: 'Capítulo da Marca',
  sentenca: 'A Sentença',
  daily: 'Diária',
  themed: 'Temática',
}

function pertence(reading: Reading, filtro: Filtro): boolean {
  if (filtro === 'todas') return true
  if (filtro === 'diarias') return reading.reading_type === 'daily'
  if (filtro === 'tematicas') return reading.reading_type === 'themed'
  return reading.reading_type !== 'daily' && reading.reading_type !== 'themed'
}

function dataCurta(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(iso))
}

export function Readings({ biblioteca, temaFiltro, onLimparTema, onAbrirLeituraCore, onAbrirLeitura }: Props) {
  const [filtro, setFiltro] = useState<Filtro>(temaFiltro ? 'tematicas' : 'todas')

  const lista = useMemo(() => {
    return [...biblioteca.readings]
      .filter((r) => pertence(r, filtro))
      .filter((r) => !temaFiltro || r.theme === temaFiltro)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [biblioteca.readings, filtro, temaFiltro])

  const capitulos = biblioteca.readings.reduce((s, r) => s + (r.capitulos?.length ?? 0), 0)
  const streak = calcularStreak(
    biblioteca.readings.filter((r) => r.reading_type === 'daily' && r.aberta_em)
      .map((r) => (r.data_carta ?? r.created_at).slice(0, 10)),
  )

  return (
    <div className="h-full scroll-area px-6 pt-12 pb-28">
      <p style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
        Leituras · {biblioteca.readings.length}
      </p>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 34, fontWeight: 300, color: 'var(--text-primary)', marginTop: 6 }}>
        Suas <em style={{ color: 'var(--accent-gold)', fontStyle: 'italic' }}>leituras</em>.
      </h1>
      <p className="text-xs text-text-muted mt-1">
        {capitulos} capítulos{streak > 0 ? ` · ${streak} dias seguidos` : ''}
      </p>

      <div className="flex gap-2 mt-5 overflow-x-auto scroll-area">
        {FILTROS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFiltro(key)}
            style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: 999, fontSize: 13,
              fontFamily: 'var(--font-sans)',
              border: `1px solid ${filtro === key ? 'var(--accent-gold)' : 'var(--border-subtle)'}`,
              background: filtro === key ? 'var(--accent-gold)' : 'transparent',
              color: filtro === key ? 'var(--bg-primary)' : 'var(--text-secondary)',
            }}
          >
            {label}
          </button>
        ))}
        {temaFiltro && (
          <button
            onClick={onLimparTema}
            style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: 999, fontSize: 13,
              fontFamily: 'var(--font-sans)', border: '1px solid var(--accent-gold)',
              background: 'rgba(201,169,97,0.1)', color: 'var(--accent-gold)',
            }}
          >
            {temaFiltro} ×
          </button>
        )}
      </div>

      {lista.length === 0 ? (
        <p className="text-sm text-text-muted mt-10">
          Nada por aqui ainda. O que você comprar na Estante aparece nesta lista.
        </p>
      ) : (
        <div className="flex flex-col gap-2 mt-6">
          {lista.map((reading, i) => (
            <button
              key={reading.id}
              onClick={() => (reading.produto === 'leitura_core' ? onAbrirLeituraCore() : onAbrirLeitura(reading))}
              className="text-left"
              style={{ display: 'flex', gap: 14, padding: '14px 16px', borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
            >
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 300, color: 'var(--accent-gold)', lineHeight: 1.2, minWidth: 28 }}>
                {String(lista.length - i).padStart(2, '0')}
              </span>
              <span className="flex-1">
                <span className="flex items-center justify-between">
                  <span style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-gold)', fontFamily: 'var(--font-sans)' }}>
                    {NOMES[reading.produto ?? reading.reading_type] ?? reading.reading_type}
                  </span>
                  <span className="text-[10px] text-text-muted">{dataCurta(reading.created_at)}</span>
                </span>
                <span style={{ display: 'block', fontFamily: 'var(--font-serif)', fontSize: 16, color: 'var(--text-primary)', marginTop: 4 }}>
                  {reading.titulo ?? NOMES[reading.produto ?? ''] ?? 'Leitura'}
                </span>
                <span className="block text-[11px] text-text-muted mt-1">
                  {[reading.traco_origem, `${tempoDeLeitura(reading.word_count)} min`].filter(Boolean).join(' · ')}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Passo 2: Verificar a compilação**

Rode: `npx tsc -b`
Esperado: sem erros em `Readings.tsx`.

- [ ] **Passo 3: Commit**

```bash
git add src/components/screens/app/Readings.tsx
git commit -m "feat(leituras): biblioteca no vocabulario ALMA, alimentada pelo useBiblioteca"
```

---

### Tarefa 10: Aba Hoje, versão sem carta diária

A carta do dia entra no Plano 2. Esta versão já entrega o "continue de onde
parou", as pendências e o atalho da Aurora — e nunca aparece vazia.

**Files:**
- Modify: `src/components/screens/app/Today.tsx`

- [ ] **Passo 1: Substituir o componente inteiro**

Substitua todo o conteúdo de `src/components/screens/app/Today.tsx`:

```tsx
import type { useBiblioteca } from '@/hooks/useBiblioteca'
import { faseDaLua } from '@/lib/leitura'
import type { Profile, Reading } from '@/types'

interface Props {
  profile: Profile
  biblioteca: ReturnType<typeof useBiblioteca>
  onAbrirLeituraCore: () => void
  onAbrirLeitura: (reading: Reading) => void
  onIrParaTema: (tema: string) => void
  onAbrirAurora: () => void
  onReScan: () => void
}

const TEMAS = [
  { key: 'amor', label: 'Amor' },
  { key: 'carreira', label: 'Carreira' },
  { key: 'familia', label: 'Família' },
  { key: 'decisao', label: 'Decisão' },
]

function saudacao(agora = new Date()): string {
  const h = agora.getHours()
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}

export function Today({
  profile, biblioteca, onAbrirLeituraCore, onAbrirLeitura,
  onIrParaTema, onAbrirAurora, onReScan,
}: Props) {
  const primeiroNome = profile.name.trim().split(' ')[0]
  const agora = new Date()
  const dataLabel = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })
    .format(agora).toUpperCase()

  const mestra = biblioteca.itens.find((i) => i.produto === 'mestra' && i.pronto)?.reading
  const core = biblioteca.readings.find((r) => r.produto === 'leitura_core')
  const principal = mestra ?? core
  const pendencias = biblioteca.itens.filter((i) => i.precisaAcao)

  return (
    <div className="h-full scroll-area px-6 pt-12 pb-28">
      <div className="flex items-center justify-between">
        <p style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
          {dataLabel}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
          {faseDaLua(agora)}
        </p>
      </div>

      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, fontStyle: 'italic', color: 'var(--text-secondary)', marginTop: 18 }}>
        {saudacao(agora)}, {primeiroNome}.
      </p>

      {profile.marca_adormecida && (
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 300, lineHeight: 1.15, color: 'var(--text-primary)', marginTop: 6 }}>
          {profile.marca_adormecida}
        </h1>
      )}

      <div className="flex gap-2 mt-6 overflow-x-auto scroll-area">
        {TEMAS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onIrParaTema(key)}
            style={{
              flexShrink: 0, padding: '6px 14px', borderRadius: 999, fontSize: 13,
              fontFamily: 'var(--font-sans)', border: '1px solid var(--border-subtle)',
              background: 'transparent', color: 'var(--text-secondary)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {principal && (
        <button
          onClick={() => (principal === core ? onAbrirLeituraCore() : onAbrirLeitura(principal))}
          className="text-left w-full mt-6"
          style={{ padding: 18, borderRadius: 10, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <p style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-gold)', fontFamily: 'var(--font-sans)' }}>
            {mestra ? 'Sua Leitura Mestra' : 'Sua Leitura Completa'}
          </p>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 300, color: 'var(--text-primary)', marginTop: 8, lineHeight: 1.3 }}>
            <em style={{ color: 'var(--accent-gold)', fontStyle: 'italic' }}>continue de onde parou.</em>
          </p>
          <p className="text-xs text-text-muted mt-2">
            Capítulo {String((principal.ultimo_capitulo_lido ?? 0) + 1).padStart(2, '0')} de{' '}
            {String(principal.capitulos?.length ?? 6).padStart(2, '0')}
          </p>
        </button>
      )}

      {pendencias.length > 0 && (
        <div className="mt-6">
          <p style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', marginBottom: 8 }}>
            Precisa de você
          </p>
          {pendencias.map((item) => (
            <p key={item.produto} className="text-sm text-text-secondary">
              {item.nome} — abra a Estante para concluir
            </p>
          ))}
        </div>
      )}

      <button
        onClick={onAbrirAurora}
        className="text-left w-full mt-6"
        style={{ padding: 18, borderRadius: 10, background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
      >
        <p style={{ fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-gold)', fontFamily: 'var(--font-sans)' }}>
          Pergunte à Aurora
        </p>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontStyle: 'italic', color: 'var(--text-primary)', marginTop: 8 }}>
          "Por que esse padrão volta sempre?"
        </p>
      </button>

      {!core && (
        <button
          onClick={onReScan}
          className="text-left w-full mt-6"
          style={{ padding: 18, borderRadius: 10, background: 'var(--bg-surface)', border: '1px solid var(--accent-gold)' }}
        >
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--text-primary)' }}>
            Complete o scan da sua palma
          </p>
          <p className="text-xs text-text-muted mt-1">
            Sem ele a Madame Aurora não consegue ler suas linhas.
          </p>
        </button>
      )}
    </div>
  )
}
```

- [ ] **Passo 2: Implementar `faseDaLua`**

Acrescente a `src/lib/leitura.ts`:

```ts
const FASES = [
  'Lua nova', 'Lua crescente', 'Quarto crescente', 'Crescente gibosa',
  'Lua cheia', 'Minguante gibosa', 'Quarto minguante', 'Lua minguante',
]

/** Fase da lua por idade sinodica. Precisao de ~1 dia, suficiente para exibicao. */
export function faseDaLua(data = new Date()): string {
  const SINODICO = 29.530588853
  const NOVA_CONHECIDA = Date.UTC(2000, 0, 6, 18, 14) // 2000-01-06 18:14 UTC
  const dias = (data.getTime() - NOVA_CONHECIDA) / 86400000
  const idade = ((dias % SINODICO) + SINODICO) % SINODICO
  const indice = Math.floor((idade / SINODICO) * 8 + 0.5) % 8
  return FASES[indice]
}
```

- [ ] **Passo 3: Escrever o teste da fase da lua**

Acrescente a `src/lib/leitura.test.ts`:

Acrescente o import de `faseDaLua` à linha de import já existente no topo do
arquivo (`import { tempoDeLeitura, calcularStreak, faseDaLua } from './leitura'`)
e o bloco abaixo ao fim:

```ts
const TODAS_AS_FASES = [
  'Lua nova', 'Lua crescente', 'Quarto crescente', 'Crescente gibosa',
  'Lua cheia', 'Minguante gibosa', 'Quarto minguante', 'Lua minguante',
]

describe('faseDaLua', () => {
  it('calcula lua nova na data de referencia do ciclo medio', () => {
    expect(faseDaLua(new Date('2026-01-18T12:00:00Z'))).toBe('Lua nova')
  })

  it('calcula lua cheia meio ciclo depois', () => {
    expect(faseDaLua(new Date('2026-02-01T12:00:00Z'))).toBe('Lua cheia')
  })

  it('devolve sempre uma das oito fases ao longo de um mes', () => {
    for (let d = 0; d < 30; d++) {
      expect(TODAS_AS_FASES).toContain(faseDaLua(new Date(2026, 5, 1 + d)))
    }
  })
})
```

As duas primeiras datas foram conferidas contra a fórmula do ciclo sinódico
médio (lua nova de referência em 2000-01-06 18:14 UTC): dão idade 29,4 e 13,9
dias, que caem em "Lua nova" e "Lua cheia". Os nomes descrevem o ciclo médio, não
a efeméride astronômica exata — a diferença é de até um dia e não afeta a
exibição.

- [ ] **Passo 4: Rodar os testes**

Rode: `npm test`
Esperado: PASS em todos os arquivos, 14 testes.

- [ ] **Passo 5: Commit**

```bash
git add src/components/screens/app/Today.tsx src/lib/leitura.ts src/lib/leitura.test.ts
git commit -m "feat(hoje): continue de onde parou, pendencias, temas e fase da lua"
```

---

### Tarefa 11: Gravar o progresso de leitura

Sem isto o card "continue de onde parou" fica travado no Capítulo 01 para sempre,
e a Aurora nunca sabe quando a pessoa abriu a leitura.

**Files:**
- Create: `src/lib/progresso.ts`
- Modify: `src/components/screens/app/AddonReadingView.tsx`, `src/components/screens/LeituraCompleta.tsx`

- [ ] **Passo 1: Criar o módulo de progresso**

Crie `src/lib/progresso.ts`:

```ts
import { supabase } from '@/lib/supabase'

/**
 * Marca a leitura como aberta agora. Falha em silencio de proposito: e um dado
 * de conveniencia, nao pode interromper a leitura de quem esta lendo.
 */
export async function marcarAberta(readingId: string): Promise<void> {
  const { error } = await supabase
    .from('readings')
    .update({ aberta_em: new Date().toISOString() })
    .eq('id', readingId)
  if (error) console.error('marcarAberta falhou:', error.message)
}

/**
 * Guarda o capitulo mais avancado que a pessoa ja alcancou. Nunca retrocede:
 * voltar para reler o capitulo 1 nao deve zerar o progresso.
 */
export async function salvarCapitulo(
  readingId: string,
  indice: number,
  atual: number,
): Promise<number> {
  if (indice <= atual) return atual
  const { error } = await supabase
    .from('readings')
    .update({ ultimo_capitulo_lido: indice })
    .eq('id', readingId)
  if (error) {
    console.error('salvarCapitulo falhou:', error.message)
    return atual
  }
  return indice
}
```

- [ ] **Passo 2: Escrever o teste do "nunca retrocede"**

Crie `src/lib/progresso.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

const update = vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) }))
vi.mock('@/lib/supabase', () => ({
  supabase: { from: () => ({ update }) },
}))

import { salvarCapitulo } from './progresso'

describe('salvarCapitulo', () => {
  beforeEach(() => update.mockClear())

  it('grava quando o capitulo avanca', async () => {
    expect(await salvarCapitulo('r1', 3, 2)).toBe(3)
    expect(update).toHaveBeenCalledWith({ ultimo_capitulo_lido: 3 })
  })

  it('nao grava quando a pessoa volta para reler', async () => {
    expect(await salvarCapitulo('r1', 1, 4)).toBe(4)
    expect(update).not.toHaveBeenCalled()
  })

  it('nao grava quando o capitulo e o mesmo', async () => {
    expect(await salvarCapitulo('r1', 2, 2)).toBe(2)
    expect(update).not.toHaveBeenCalled()
  })
})
```

- [ ] **Passo 3: Rodar e confirmar que passa**

Rode: `npm test -- src/lib/progresso.test.ts`
Esperado: PASS, 3 testes.

- [ ] **Passo 4: Chamar da `AddonReadingView`**

Abra `src/components/screens/app/AddonReadingView.tsx`. Logo após os hooks de
estado existentes, acrescente:

```tsx
import { useEffect, useRef } from 'react'
import { marcarAberta, salvarCapitulo } from '@/lib/progresso'

  // dentro do componente, `reading` e a prop existente:
  const progressoRef = useRef(reading.ultimo_capitulo_lido ?? 0)

  useEffect(() => {
    void marcarAberta(reading.id)
  }, [reading.id])
```

E, onde o componente troca de capítulo (o handler que altera o índice atual),
acrescente ao fim do handler:

```tsx
    void salvarCapitulo(reading.id, novoIndice, progressoRef.current)
      .then((valor) => { progressoRef.current = valor })
```

Substitua `novoIndice` pelo nome real da variável de índice usada no arquivo.

- [ ] **Passo 5: Chamar da `LeituraCompleta`**

Repita o mesmo padrão em `src/components/screens/LeituraCompleta.tsx`, usando o
`reading_id` da leitura core carregada no estado `leitura`:

```tsx
  useEffect(() => {
    if (leitura?.reading_id) void marcarAberta(leitura.reading_id)
  }, [leitura?.reading_id])
```

- [ ] **Passo 6: Verificar a compilação**

Rode: `npx tsc -b && npm test`
Esperado: sem erros, todos os testes passando.

- [ ] **Passo 7: Commit**

```bash
git add src/lib/progresso.ts src/lib/progresso.test.ts src/components/screens/app/AddonReadingView.tsx src/components/screens/LeituraCompleta.tsx
git commit -m "feat: grava aberta_em e ultimo_capitulo_lido, sem retroceder o progresso"
```

---

### Tarefa 12: Unificar as rotas no `App.tsx`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Passo 1: Trocar o bloco de decisão**

Em `src/App.tsx`, substitua os três blocos finais (`if (compraStatus ===
'aprovado')`, `if (isAdmin)`, `return <SemAcesso />`) por:

```tsx
  if (compraStatus === 'aprovado' || isAdmin) {
    return (
      <AppShell
        onSignOut={() => {
          // reset() em Profile.tsx ja limpa a store (profile -> null),
          // o que re-renderiza o App e mostra o Onboarding. Sem reload.
        }}
      />
    )
  }

  return <SemAcesso />
```

Remova o import de `LeituraCompleta` do `App.tsx` — ela agora só é usada pelo
`AppShell`.

- [ ] **Passo 2: Verificar a compilação e os testes**

Rode: `npx tsc -b && npm test`
Esperado: build sem erros, todos os testes passando.

- [ ] **Passo 3: Rodar o app e conferir as 5 abas**

Rode: `npm run dev` e abra `http://localhost:5173`.

Faça login com uma conta que tenha compra aprovada. Confirme:
- a tab bar mostra Hoje · Leituras · Aurora · Estante · Você
- a Estante lista os 9 produtos e o Despertar
- um produto não comprado com `checkout_url` nulo aparece esmaecido sem botão
- a aba Você mostra três contadores **diferentes**

- [ ] **Passo 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: cliente e admin passam a ver a mesma casca de 5 abas"
```

---

### Tarefa 13: Verificação final e integração

- [ ] **Passo 1: Rodar tudo**

```bash
npm test
npx tsc -b
npm run build
```

Esperado: testes passando, zero erro de tipo, build concluído.

- [ ] **Passo 2: Testar um link de compra de ponta a ponta**

No SQL Editor do Supabase, preencha um link de teste:

```sql
update public.produtos_catalogo
   set checkout_url = 'https://example.com/checkout-teste'
 where produto = 'mestra';
```

Recarregue o app. O item "Leitura Mestra" deve mostrar preço e o botão
**Comprar**, e o clique deve abrir o link numa aba nova. Depois, reverta:

```sql
update public.produtos_catalogo set checkout_url = null where produto = 'mestra';
```

- [ ] **Passo 3: Conferir que o progresso grava**

Abra a leitura core, role até o segundo capítulo, volte e reabra a aba Hoje. O
card deve dizer "Capítulo 02". Se continuar em 01, ou a policy de UPDATE da
Tarefa 3 não foi aplicada, ou o `salvarCapitulo` da Tarefa 11 não foi ligado ao
handler certo. Confira a policy com:

```sql
select policyname from pg_policies where tablename='readings' and cmd='UPDATE';
```

- [ ] **Passo 4: Integrar**

```bash
git checkout main
git merge --no-ff frente-a-navegacao -m "feat: navegacao de 5 abas e Estante vendendo (Frente A, Plano 1)"
git push origin main
```

O push dispara o deploy do Vercel. Confirme em `almaurora.com` que as 5 abas
aparecem, e lembre do service worker: force o reload antes de concluir que algo
não subiu.

- [ ] **Passo 5: Limpar a worktree**

```bash
git worktree remove ../app-linhas-navegacao
git branch -d frente-a-navegacao
```

---

## Notas de execução

**Ordem das tarefas 7 a 10.** A Tarefa 7 reescreve o `AppShell` chamando `Today`,
`Readings` e `Profile` com props que só existem depois das Tarefas 8, 9 e 10. O
`npx tsc -b` vai acusar erro nesse intervalo. Isso é esperado; complete as
quatro antes de considerar o bloco pronto.

**Assinaturas inferidas.** As props de `AddonReadingView`, `SentencaView`,
`DespertarView`, `TerceiroForm` e `OutraMaoFlow` usadas na Tarefa 7 foram
inferidas do uso atual dentro da `LeituraCompleta`. O Passo 2 daquela tarefa
manda conferir os arquivos reais e ajustar a chamada. Não altere os componentes
para caber na chamada — o contrário.

**Nada de código técnico na tela.** Vale a regra estabelecida na correção da tela
de scan: toda falha mostra texto humano e um caminho de saída; o detalhe técnico
vai para o `console.error` e para o log da edge function.
