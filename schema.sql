-- ============================================================================
-- Kidelo — schemat bazy danych Supabase Postgres
-- ============================================================================
-- Uruchom przez Supabase SQL Editor lub:
--   supabase db push (z lokalnego migracji w supabase/migrations/)
--
-- Konwencje:
--   * snake_case dla kolumn
--   * id jako uuid z gen_random_uuid()
--   * created_at, updated_at na każdej tabeli z user-content
--   * RLS włączone na wszystkich tabelach z danymi użytkownika
-- ============================================================================

-- ---------- EXTENSIONS ----------
create extension if not exists "pgcrypto";              -- gen_random_uuid()
create extension if not exists "pg_trgm";               -- fuzzy search dla nazw szpitali
create extension if not exists "unaccent";              -- normalizacja polskich znaków

-- ============================================================================
-- TABELE REFERENCYJNE (publiczne, read-only dla userów)
-- ============================================================================

-- ---------- hospitals ----------
create table if not exists public.hospitals (
  id              uuid primary key default gen_random_uuid(),
  external_id     text unique not null,                 -- kod świadczeniodawcy z NFZ
  name            text not null,
  address_full    text not null,
  city            text not null,
  voivodeship     text not null,
  teryt           text,
  regon           text,
  nip             text,
  phone           text,
  lat             double precision,
  lng             double precision,
  has_maternity   boolean default false,
  has_neonatology boolean default false,
  has_anesthesia  boolean,                              -- znieczulenie zewnątrzoponowe
  waiting_avg_days integer,
  nfz_contract    boolean default true,
  rating          numeric(2,1),                         -- 0.0 - 5.0
  reviews_count   integer default 0,
  source          text not null,                        -- 'nfz' | 'manual' | 'rpwdl' | 'google_places'
  raw_benefit     text,                                 -- ostatni kod świadczenia z NFZ
  metadata        jsonb default '{}'::jsonb,            -- elastycznie: zdjęcia, dodatkowe atrybuty
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index hospitals_city_idx on public.hospitals (city);
create index hospitals_voivodeship_idx on public.hospitals (voivodeship);
create index hospitals_has_maternity_idx on public.hospitals (has_maternity) where has_maternity = true;
create index hospitals_geo_idx on public.hospitals using gist (point(lng, lat));
create index hospitals_name_trgm_idx on public.hospitals using gin (name gin_trgm_ops);

-- ---------- birth_schools ----------
create table if not exists public.birth_schools (
  id              uuid primary key default gen_random_uuid(),
  external_id     text unique,                          -- jeśli z NFZ (edukacja przedporodowa)
  hospital_id     uuid references public.hospitals(id) on delete set null,
  name            text not null,
  type            text not null check (type in ('stationary', 'online', 'hybrid')),
  address_full    text,
  city            text,
  voivodeship     text,
  lat             double precision,
  lng             double precision,
  is_nfz_free     boolean default false,
  price_pln       integer,                              -- null jeśli free
  currency        text default 'PLN',
  schedule        text,                                 -- "8 spotkań · wtorki 18:00"
  lang            text[] default array['pl'],           -- ['pl', 'uk', 'en']
  capacity        integer,                              -- maks par
  description     text,
  rating          numeric(2,1),
  reviews_count   integer default 0,
  source          text not null,                        -- 'nfz' | 'manual' | 'partner'
  is_verified     boolean default false,                -- ręcznie zweryfikowane
  metadata        jsonb default '{}'::jsonb,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index birth_schools_city_idx on public.birth_schools (city);
create index birth_schools_type_idx on public.birth_schools (type);
create index birth_schools_is_nfz_free_idx on public.birth_schools (is_nfz_free);
create index birth_schools_hospital_idx on public.birth_schools (hospital_id);

-- ---------- midwives ----------
create table if not exists public.midwives (
  id              uuid primary key default gen_random_uuid(),
  registry_number text unique,                          -- numer prawa wykonywania zawodu
  name            text not null,
  city            text,
  voivodeship     text,
  services        text[] default array[]::text[],       -- ['POZ', 'edukacja_przedporodowa', 'wizyty_patronażowe']
  phone           text,
  email           text,
  source          text default 'manual',
  created_at      timestamptz default now()
);

-- ---------- benefits (referencyjna, sync z benefits.json) ----------
create table if not exists public.benefits (
  id              text primary key,                      -- 'becikowe', '800plus', ...
  slug            text unique not null,
  name            text not null,
  official_name   text,
  amount_pln      integer,                              -- null gdy variable (np. macierzyński)
  amount_display  text not null,                        -- "1 000 zł"
  unit            text not null,                        -- 'one-time' | 'monthly' | ...
  unit_display   text not null,
  income_means_tested boolean default false,
  income_limit_pln integer,
  channel         text not null,
  deadline_rule   jsonb not null,                       -- {type: 'after_birth_months', value: 12}
  criteria        text[] default array[]::text[],
  required_docs   text[] default array[]::text[],
  steps           text[] default array[]::text[],
  legal_basis     jsonb,                                -- {act, journal, article, url}
  source_citations jsonb,                               -- [{label, url, verified, key_quote}]
  common_mistakes text[] default array[]::text[],
  valid_from      date not null default '2026-06-01',
  valid_to        date,
  updated_at      timestamptz default now()
);

-- ============================================================================
-- USER DATA (RLS — każdy user widzi tylko swoje)
-- ============================================================================

-- ---------- user_profiles ----------
create table if not exists public.user_profiles (
  user_id         uuid primary key references auth.users(id) on delete cascade,
  parent_name     text,
  parent_email    text,                                 -- duplikat z auth.users dla wygody
  child_name      text,
  child_due_date  date,                                 -- jeśli przed porodem
  child_birth_date date,                                -- jeśli po porodzie
  child_pesel     text,                                 -- WRAŻLIWE: rozważyć encrypted_at_rest
  employment      text check (employment in ('uop', 'b2b', 'zlecenie', 'student', 'none', 'unemployed')),
  voivodeship     text,
  city            text,
  first_child     boolean default true,
  partner_included boolean default false,
  partner_name    text,
  partner_employment text,
  estimated_household_income_pln integer,               -- dla becikowego
  has_disability  boolean default false,                -- dla wariantu 1900 zł
  language        text default 'pl',
  consent_marketing boolean default false,
  consent_analytics boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  deleted_at      timestamptz                           -- soft delete (RODO)
);

create index user_profiles_city_idx on public.user_profiles (city);

-- ---------- user_progress ----------
-- Per-user stan zadań na osi czasu
create table if not exists public.user_progress (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  task_id         text not null,                        -- 'usc:zgloszenie', 'benefit:800plus', ...
  status          text not null check (status in ('pending', 'in_progress', 'done', 'skipped', 'not_applicable')),
  completed_at    timestamptz,
  note            text,                                 -- własna notatka usera
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (user_id, task_id)
);

create index user_progress_user_idx on public.user_progress (user_id);
create index user_progress_status_idx on public.user_progress (status);

-- ---------- user_benefits_state ----------
-- Stan świadczeń per user (wyliczany przez eligibility-engine, cache'owany)
create table if not exists public.user_benefits_state (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  benefit_id      text not null references public.benefits(id),
  eligibility     text not null check (eligibility in ('eligible', 'action', 'active', 'future', 'na')),
  amount_pln      integer,                              -- spersonalizowana kwota (np. 1500 lub 1900 dla Aktywnego)
  deadline_at     timestamptz,                          -- wyliczony deadline (np. data porodu + 3 mies. dla 800+)
  applied_at      timestamptz,                          -- gdy user oznaczy że złożył
  notes           text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (user_id, benefit_id)
);

create index user_benefits_user_idx on public.user_benefits_state (user_id);
create index user_benefits_deadline_idx on public.user_benefits_state (deadline_at) where deadline_at is not null;

-- ---------- user_favorites ----------
-- Polubione szkoły / szpitale / wnioski
create table if not exists public.user_favorites (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  entity_type     text not null check (entity_type in ('hospital', 'school', 'midwife')),
  entity_id       uuid not null,
  created_at      timestamptz default now(),
  unique (user_id, entity_type, entity_id)
);

-- ---------- user_push_tokens ----------
create table if not exists public.user_push_tokens (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  token           text not null,                        -- Expo push token
  platform        text check (platform in ('ios', 'android')),
  created_at      timestamptz default now(),
  unique (user_id, token)
);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Hospitals, schools, midwives, benefits — publiczne odczyt
alter table public.hospitals enable row level security;
create policy "hospitals_select_public" on public.hospitals for select using (true);

alter table public.birth_schools enable row level security;
create policy "birth_schools_select_public" on public.birth_schools for select using (true);

alter table public.midwives enable row level security;
create policy "midwives_select_public" on public.midwives for select using (true);

alter table public.benefits enable row level security;
create policy "benefits_select_public" on public.benefits for select using (true);

-- user_profiles — własne tylko
alter table public.user_profiles enable row level security;
create policy "user_profiles_select_own" on public.user_profiles
  for select using (auth.uid() = user_id);
create policy "user_profiles_insert_own" on public.user_profiles
  for insert with check (auth.uid() = user_id);
create policy "user_profiles_update_own" on public.user_profiles
  for update using (auth.uid() = user_id);
create policy "user_profiles_delete_own" on public.user_profiles
  for delete using (auth.uid() = user_id);

-- user_progress
alter table public.user_progress enable row level security;
create policy "user_progress_all_own" on public.user_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- user_benefits_state
alter table public.user_benefits_state enable row level security;
create policy "user_benefits_all_own" on public.user_benefits_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- user_favorites
alter table public.user_favorites enable row level security;
create policy "user_favorites_all_own" on public.user_favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- user_push_tokens
alter table public.user_push_tokens enable row level security;
create policy "user_push_tokens_all_own" on public.user_push_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS — auto-update updated_at
-- ============================================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_profiles_updated_at before update on public.user_profiles
  for each row execute function public.set_updated_at();
create trigger user_progress_updated_at before update on public.user_progress
  for each row execute function public.set_updated_at();
create trigger user_benefits_state_updated_at before update on public.user_benefits_state
  for each row execute function public.set_updated_at();
create trigger hospitals_updated_at before update on public.hospitals
  for each row execute function public.set_updated_at();
create trigger birth_schools_updated_at before update on public.birth_schools
  for each row execute function public.set_updated_at();

-- ============================================================================
-- FUNCTIONS — RODO compliance
-- ============================================================================

-- Eksport wszystkich danych użytkownika (RODO art. 20)
create or replace function public.export_user_data(p_user_id uuid)
returns jsonb language plpgsql security definer as $$
declare
  result jsonb;
begin
  if auth.uid() != p_user_id then
    raise exception 'forbidden';
  end if;

  select jsonb_build_object(
    'profile', (select to_jsonb(up) from public.user_profiles up where up.user_id = p_user_id),
    'progress', (select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb) from public.user_progress p where p.user_id = p_user_id),
    'benefits', (select coalesce(jsonb_agg(to_jsonb(b)), '[]'::jsonb) from public.user_benefits_state b where b.user_id = p_user_id),
    'favorites', (select coalesce(jsonb_agg(to_jsonb(f)), '[]'::jsonb) from public.user_favorites f where f.user_id = p_user_id),
    'exported_at', now()
  ) into result;

  return result;
end;
$$;

-- Soft delete usera (RODO art. 17) — pełne usunięcie po 30 dniach przez cron
create or replace function public.request_account_deletion()
returns void language plpgsql security definer as $$
begin
  update public.user_profiles set deleted_at = now() where user_id = auth.uid();
end;
$$;

-- ============================================================================
-- SEED danych — wstawianie świadczeń z benefits.json
-- ============================================================================
-- Zrobimy w scripts/seed-benefits.ts (czyta benefits.json, robi upsert)

-- ============================================================================
-- WIDOKI POMOCNICZE
-- ============================================================================

-- Najbliższe deadliny dla aktywnych userów
create or replace view public.upcoming_deadlines as
select
  ubs.user_id,
  b.name as benefit_name,
  ubs.amount_pln,
  ubs.deadline_at,
  extract(days from (ubs.deadline_at - now())) as days_left
from public.user_benefits_state ubs
join public.benefits b on b.id = ubs.benefit_id
where ubs.eligibility in ('eligible', 'action')
  and ubs.deadline_at is not null
  and ubs.deadline_at > now()
order by ubs.deadline_at asc;

-- ============================================================================
-- KOMENTARZE
-- ============================================================================

comment on table public.hospitals is 'Szpitale położnicze, źródło: NFZ Otwarte Dane';
comment on table public.birth_schools is 'Szkoły rodzenia: NFZ + manual + partner listings';
comment on table public.benefits is 'Świadczenia rodzinne — sync z benefits.json (single source of truth)';
comment on table public.user_profiles is 'Profile użytkowników. RODO: soft delete + hard delete po 30 dniach';
comment on column public.user_profiles.child_pesel is 'WRAŻLIWE: do encryption at rest w produkcji. Default: nie przechowujemy.';
