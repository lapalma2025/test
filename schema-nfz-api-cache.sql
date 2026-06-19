-- ============================================================================
-- Kidelo — cache danych z publicznych API NFZ/RPWDL
-- ============================================================================
-- Wklej w Supabase SQL Editor, jeśli masz już uruchomione główne `schema.sql`.
-- Ten plik jest idempotentny: można go odpalać wielokrotnie.
--
-- Cel:
-- - aplikacja może czytać świeże dane z publicznego API NFZ,
-- - Supabase przechowuje cache/fallback, gdy API NFZ nie odpowiada,
-- - struktura jest gotowa pod późniejszy backendowy import RPWDL/XML i Google Places.
-- ============================================================================

-- ---------- birth_schools: kolumny potrzebne dla NFZ/RPWDL/API cache ----------
alter table public.birth_schools
  add column if not exists external_id text,
  add column if not exists phone text,
  add column if not exists raw_benefit text,
  add column if not exists nfz_year integer,
  add column if not exists nfz_branch text,
  add column if not exists provider_code text,
  add column if not exists provider_regon text,
  add column if not exists provider_nip text,
  add column if not exists rpwdl_registry_number text,
  add column if not exists api_last_seen_at timestamptz,
  add column if not exists api_payload jsonb default '{}'::jsonb;

create unique index if not exists birth_schools_external_id_unique
  on public.birth_schools (external_id)
  where external_id is not null;

create index if not exists birth_schools_provider_code_idx
  on public.birth_schools (provider_code)
  where provider_code is not null;

create index if not exists birth_schools_api_last_seen_idx
  on public.birth_schools (api_last_seen_at);

-- ---------- hospitals: uzupełnienia pod API cache ----------
alter table public.hospitals
  add column if not exists provider_code text,
  add column if not exists provider_regon text,
  add column if not exists provider_nip text,
  add column if not exists rpwdl_registry_number text,
  add column if not exists nfz_year integer,
  add column if not exists nfz_branch text,
  add column if not exists api_last_seen_at timestamptz,
  add column if not exists api_payload jsonb default '{}'::jsonb;

create index if not exists hospitals_provider_code_idx
  on public.hospitals (provider_code)
  where provider_code is not null;

create index if not exists hospitals_api_last_seen_idx
  on public.hospitals (api_last_seen_at);

-- ---------- import_runs: diagnostyka późniejszych skryptów ETL ----------
create table if not exists public.api_import_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('nfz_queues', 'nfz_agreements', 'rpwdl', 'google_places', 'manual')),
  entity_type text not null check (entity_type in ('hospital', 'birth_school', 'midwife')),
  status text not null check (status in ('running', 'success', 'error')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  fetched_count integer default 0,
  upserted_count integer default 0,
  error_message text,
  metadata jsonb default '{}'::jsonb
);

alter table public.api_import_runs enable row level security;

drop policy if exists "api_import_runs_select_public" on public.api_import_runs;
create policy "api_import_runs_select_public"
  on public.api_import_runs for select
  using (true);

comment on table public.api_import_runs is
  'Historia importów/cache z NFZ, RPWDL i innych publicznych źródeł.';

comment on column public.birth_schools.api_payload is
  'Surowy rekord z API NFZ/RPWDL/Google Places do debugowania mapowania.';

comment on column public.hospitals.api_payload is
  'Surowy rekord z API NFZ/RPWDL do debugowania mapowania.';
