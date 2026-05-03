-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_cron";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  name                text not null,
  date_of_birth       date,
  time_of_birth       text,
  city_of_birth       text,
  intention           text,
  subscription_status text not null default 'none' check (subscription_status in ('none','trial','active','expired')),
  trial_ends_at       timestamptz,
  deleted_at          timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

alter table public.profiles enable row level security;
create policy "users can read own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "users can update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- ============================================================
-- PALM SCANS
-- ============================================================
create table if not exists public.palm_scans (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  image_url   text not null,
  hand_type   text not null default 'dominant' check (hand_type in ('dominant','non_dominant')),
  analysis    jsonb,
  created_at  timestamptz not null default now()
);

alter table public.palm_scans enable row level security;
create policy "users can manage own scans" on public.palm_scans
  for all using (auth.uid() = user_id);

-- Storage bucket for palm images
insert into storage.buckets (id, name, public)
values ('palms', 'palms', true)
on conflict do nothing;

create policy "users can upload own palms" on storage.objects
  for insert with check (bucket_id = 'palms' and auth.uid()::text = (storage.foldername(name))[2]);
create policy "palms are publicly readable" on storage.objects
  for select using (bucket_id = 'palms');

-- ============================================================
-- READINGS
-- ============================================================
create table if not exists public.readings (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  scan_id         uuid references public.palm_scans(id),
  reading_type    text not null check (reading_type in ('master','daily','themed','compatibility')),
  full_content    text,
  preview_content text,
  theme           text,
  word_count      int,
  created_at      timestamptz not null default now()
);

alter table public.readings enable row level security;
create policy "users can read own readings" on public.readings
  for select using (auth.uid() = user_id);
create policy "service role can insert readings" on public.readings
  for insert with check (true);

-- ============================================================
-- DAILY INSIGHTS
-- ============================================================
create table if not exists public.daily_insights (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  insight_text  text not null,
  focused_line  text,
  scheduled_for date not null,
  delivered_at  timestamptz,
  created_at    timestamptz not null default now(),
  unique (user_id, scheduled_for)
);

alter table public.daily_insights enable row level security;
create policy "users can read own insights" on public.daily_insights
  for select using (auth.uid() = user_id);
create policy "service role can manage insights" on public.daily_insights
  for all with check (true);

-- ============================================================
-- CHAT MESSAGES
-- ============================================================
create table if not exists public.chat_messages (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        text not null check (role in ('user','assistant')),
  content     text not null,
  created_at  timestamptz not null default now()
);

alter table public.chat_messages enable row level security;
create policy "users can manage own messages" on public.chat_messages
  for all using (auth.uid() = user_id);
create policy "service role can insert messages" on public.chat_messages
  for insert with check (true);

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
