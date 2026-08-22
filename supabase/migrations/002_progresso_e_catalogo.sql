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

-- service_role tem UPDATE proprio e nao e afetado: as edge functions
-- gerar-leitura e gerar-produto continuam gravando normalmente.
revoke update on public.readings from authenticated;
revoke update on public.readings from anon;
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
