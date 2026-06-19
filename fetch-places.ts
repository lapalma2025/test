/**
 * fetch-places.ts — ETL: Google Places + CEIDG → Supabase (birth_schools + prywatne szpitale)
 *
 * Uruchomienie:
 *   npx tsx fetch-places.ts --google --city Warszawa
 *   npx tsx fetch-places.ts --google --all-cities
 *   npx tsx fetch-places.ts --ceidg
 *   npx tsx fetch-places.ts --all
 *   npx tsx fetch-places.ts --dry-run --google --city Kraków
 *
 * Wymaga w .env (root lub kidelo-app):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   GOOGLE_PLACES_API_KEY  (opcjonalnie — bez klucza pomija Google)
 *
 * Uwaga ToS Google: trzymaj place_id + własne pola; pełne dane Google odświeżaj cyklicznie.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { parseArgs } from 'node:util';

// ============ TYPY ============

interface BirthSchoolRecord {
  external_id: string;
  name: string;
  type: 'stationary' | 'online' | 'hybrid';
  address_full: string | null;
  city: string | null;
  voivodeship: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  is_nfz_free: boolean;
  price_pln: number | null;
  schedule: string | null;
  description: string | null;
  source: string;
  provider_nip: string | null;
  api_last_seen_at: string;
  api_payload: Record<string, unknown>;
}

interface GooglePlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  geometry?: { location: { lat: number; lng: number } };
  business_status?: string;
  types?: string[];
}

interface GoogleTextSearchResponse {
  results?: GooglePlaceResult[];
  next_page_token?: string;
  status: string;
  error_message?: string;
}

interface CeidgFirma {
  nazwa?: string;
  nip?: string;
  adres?: {
    miasto?: string;
    ulica?: string;
    budynek?: string;
    wojewodztwo?: string;
  };
  status?: string;
  pkd?: Array<{ kod?: string; nazwa?: string }>;
}

interface CeidgResponse {
  firmy?: CeidgFirma[];
  count?: number;
}

// ============ KONFIGURACJA ============

const GOOGLE_QUERIES = [
  'szkoła rodzenia',
  'edukacja przedporodowa',
  'kurs przedporodowy',
  'przygotowanie do porodu',
];

const CEIDG_PKD = ['86.90.D', '86.90.E'];
const CEIDG_KEYWORDS = /rodzen|porod|położ|poloz|prenatal|macierzyń/i;

const SEARCH_CITIES: Array<{ city: string; voivodeship: string }> = [
  { city: 'Warszawa', voivodeship: 'mazowieckie' },
  { city: 'Kraków', voivodeship: 'małopolskie' },
  { city: 'Wrocław', voivodeship: 'dolnośląskie' },
  { city: 'Poznań', voivodeship: 'wielkopolskie' },
  { city: 'Gdańsk', voivodeship: 'pomorskie' },
  { city: 'Szczecin', voivodeship: 'zachodniopomorskie' },
  { city: 'Bydgoszcz', voivodeship: 'kujawsko-pomorskie' },
  { city: 'Lublin', voivodeship: 'lubelskie' },
  { city: 'Katowice', voivodeship: 'śląskie' },
  { city: 'Białystok', voivodeship: 'podlaskie' },
  { city: 'Gdynia', voivodeship: 'pomorskie' },
  { city: 'Częstochowa', voivodeship: 'śląskie' },
  { city: 'Radom', voivodeship: 'mazowieckie' },
  { city: 'Sosnowiec', voivodeship: 'śląskie' },
  { city: 'Toruń', voivodeship: 'kujawsko-pomorskie' },
  { city: 'Kielce', voivodeship: 'świętokrzyskie' },
  { city: 'Rzeszów', voivodeship: 'podkarpackie' },
  { city: 'Gliwice', voivodeship: 'śląskie' },
  { city: 'Olsztyn', voivodeship: 'warmińsko-mazurskie' },
  { city: 'Opole', voivodeship: 'opolskie' },
  { city: 'Zielona Góra', voivodeship: 'lubuskie' },
  { city: 'Łódź', voivodeship: 'łódzkie' },
];

const VOIVODESHIP_NORMALIZE: Record<string, string> = {
  mazowieckie: 'mazowieckie',
  malopolskie: 'małopolskie',
  'małopolskie': 'małopolskie',
  dolnoslaskie: 'dolnośląskie',
  'dolnośląskie': 'dolnośląskie',
  wielkopolskie: 'wielkopolskie',
  pomorskie: 'pomorskie',
  zachodniopomorskie: 'zachodniopomorskie',
  'kujawsko-pomorskie': 'kujawsko-pomorskie',
  lubelskie: 'lubelskie',
  slaskie: 'śląskie',
  'śląskie': 'śląskie',
  podlaskie: 'podlaskie',
  'swietokrzyskie': 'świętokrzyskie',
  'świętokrzyskie': 'świętokrzyskie',
  podkarpackie: 'podkarpackie',
  'warminsko-mazurskie': 'warmińsko-mazurskie',
  'warmińsko-mazurskie': 'warmińsko-mazurskie',
  opolskie: 'opolskie',
  lubuskie: 'lubuskie',
  lodzkie: 'łódzkie',
  'łódzkie': 'łódzkie',
};

// ============ HELPERS ============

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeVoivodeship(value?: string | null): string | null {
  if (!value) return null;
  const key = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  for (const [k, v] of Object.entries(VOIVODESHIP_NORMALIZE)) {
    if (k.normalize('NFD').replace(/[\u0300-\u036f]/g, '') === key) return v;
  }
  return value.toLowerCase();
}

function guessSchoolType(name: string, address?: string): 'stationary' | 'online' | 'hybrid' {
  const hay = `${name} ${address ?? ''}`.toLowerCase();
  if (/online|zdaln|webinar|e-learning/.test(hay)) return 'online';
  if (/hybryd|hybrid|część online/.test(hay)) return 'hybrid';
  return 'stationary';
}

function getSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL ?? process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Brak SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY w .env');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function startImportRun(
  supabase: SupabaseClient,
  source: string,
  entityType: 'birth_school' | 'hospital'
): Promise<string | null> {
  const { data, error } = await supabase
    .from('api_import_runs')
    .insert({ source, entity_type: entityType, status: 'running' })
    .select('id')
    .single();

  if (error) {
    console.warn('[import_runs] pomijam log (tabela może nie istnieć):', error.message);
    return null;
  }
  return data.id;
}

async function finishImportRun(
  supabase: SupabaseClient,
  runId: string | null,
  status: 'success' | 'error',
  fetched: number,
  upserted: number,
  errorMessage?: string
) {
  if (!runId) return;
  await supabase
    .from('api_import_runs')
    .update({
      status,
      finished_at: new Date().toISOString(),
      fetched_count: fetched,
      upserted_count: upserted,
      error_message: errorMessage ?? null,
    })
    .eq('id', runId);
}

// ============ GOOGLE PLACES ============

async function fetchGoogleTextSearch(
  query: string,
  apiKey: string,
  pageToken?: string
): Promise<GoogleTextSearchResponse> {
  const params = new URLSearchParams({
    query,
    key: apiKey,
    language: 'pl',
    region: 'pl',
  });
  if (pageToken) params.set('pagetoken', pageToken);

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Google Places HTTP ${res.status}`);
  return res.json() as Promise<GoogleTextSearchResponse>;
}

function mapGooglePlace(
  place: GooglePlaceResult,
  city: string,
  voivodeship: string
): BirthSchoolRecord {
  const now = new Date().toISOString();
  return {
    external_id: `google/${place.place_id}`,
    name: place.name,
    type: guessSchoolType(place.name, place.formatted_address),
    address_full: place.formatted_address ?? null,
    city,
    voivodeship,
    lat: place.geometry?.location.lat ?? null,
    lng: place.geometry?.location.lng ?? null,
    phone: null,
    is_nfz_free: false,
    price_pln: null,
    schedule: null,
    description: 'Placówka z Google Places (wymaga weryfikacji ceny i harmonogramu).',
    source: 'google_places',
    provider_nip: null,
    api_last_seen_at: now,
    api_payload: { place },
  };
}

async function fetchGoogleForCity(
  city: string,
  voivodeship: string,
  apiKey: string
): Promise<BirthSchoolRecord[]> {
  const records: BirthSchoolRecord[] = [];
  const seen = new Set<string>();

  for (const baseQuery of GOOGLE_QUERIES) {
    const query = `${baseQuery} ${city}`;
    let pageToken: string | undefined;
    let pages = 0;

    do {
      const response = await fetchGoogleTextSearch(query, apiKey, pageToken);

      if (response.status === 'REQUEST_DENIED') {
        throw new Error(`Google Places: ${response.error_message ?? response.status}`);
      }
      if (response.status !== 'OK' && response.status !== 'ZERO_RESULTS') {
        console.warn(`[Google] ${city} / ${baseQuery}: ${response.status}`);
        break;
      }

      for (const place of response.results ?? []) {
        if (seen.has(place.place_id)) continue;
        seen.add(place.place_id);
        records.push(mapGooglePlace(place, city, voivodeship));
      }

      pageToken = response.next_page_token;
      pages += 1;
      if (pageToken) await sleep(2200); // Google wymaga opóźnienia przed next_page_token
    } while (pageToken && pages < 3);
  }

  console.log(`[Google] ${city}: ${records.length} placówek`);
  return records;
}

// ============ CEIDG ============

async function fetchCeidgPage(pkd: string, page: number): Promise<CeidgResponse> {
  const params = new URLSearchParams({
    pkd,
    status: 'AKTYWNY',
    limit: '25',
    page: String(page),
  });

  const url = `https://dane.biznes.gov.pl/api/ceidg/v3/firmy?${params}`;
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Kidelo-ETL/1.0 (kontakt@kidelo.pl)',
    },
  });

  if (!res.ok) {
    throw new Error(`CEIDG HTTP ${res.status} — API może wymagać rejestracji na dane.biznes.gov.pl`);
  }

  return res.json() as Promise<CeidgResponse>;
}

function mapCeidgFirma(firma: CeidgFirma): BirthSchoolRecord | null {
  const name = firma.nazwa?.trim();
  if (!name || !CEIDG_KEYWORDS.test(name)) return null;

  const city = firma.adres?.miasto ?? null;
  const voivodeship = normalizeVoivodeship(firma.adres?.wojewodztwo);
  const street = [firma.adres?.ulica, firma.adres?.budynek].filter(Boolean).join(' ');
  const now = new Date().toISOString();

  return {
    external_id: firma.nip ? `ceidg/${firma.nip}` : `ceidg/${name.slice(0, 40)}`,
    name,
    type: guessSchoolType(name),
    address_full: street ? `${street}, ${city ?? ''}` : city,
    city,
    voivodeship,
    lat: null,
    lng: null,
    phone: null,
    is_nfz_free: false,
    price_pln: null,
    schedule: null,
    description: 'Firma z CEIDG (PKD położna/edukacja) — wymaga weryfikacji oferty.',
    source: 'manual',
    provider_nip: firma.nip ?? null,
    api_last_seen_at: now,
    api_payload: { ceidg: firma, origin: 'ceidg' },
  };
}

async function fetchAllCeidg(): Promise<BirthSchoolRecord[]> {
  const records: BirthSchoolRecord[] = [];
  const seen = new Set<string>();

  for (const pkd of CEIDG_PKD) {
    for (let page = 0; page < 40; page += 1) {
      try {
        const response = await fetchCeidgPage(pkd, page);
        const firmy = response.firmy ?? [];
        if (firmy.length === 0) break;

        for (const firma of firmy) {
          const mapped = mapCeidgFirma(firma);
          if (!mapped || seen.has(mapped.external_id)) continue;
          seen.add(mapped.external_id);
          records.push(mapped);
        }

        await sleep(400);
      } catch (err) {
        console.error(`[CEIDG] pkd=${pkd} page=${page}:`, err);
        break;
      }
    }
  }

  console.log(`[CEIDG] ${records.length} firm po filtrze słów kluczowych`);
  return records;
}

// ============ SUPABASE ============

async function upsertBirthSchools(records: BirthSchoolRecord[]): Promise<number> {
  if (records.length === 0) return 0;
  const supabase = getSupabase();
  let upserted = 0;

  for (let i = 0; i < records.length; i += 50) {
    const batch = records.slice(i, i + 50);
    const { error } = await supabase.from('birth_schools').upsert(batch, { onConflict: 'external_id' });
    if (error) {
      console.error('[Supabase] upsert error:', error.message);
      throw error;
    }
    upserted += batch.length;
    console.log(`[Supabase] birth_schools ${upserted}/${records.length}`);
  }

  return upserted;
}

// ============ MAIN ============

async function main() {
  const { values } = parseArgs({
    options: {
      google: { type: 'boolean' },
      ceidg: { type: 'boolean' },
      'all-cities': { type: 'boolean' },
      all: { type: 'boolean' },
      city: { type: 'string', short: 'c' },
      'dry-run': { type: 'boolean' },
    },
  });

  const dryRun = values['dry-run'] ?? false;
  const runGoogle = values.all || values.google;
  const runCeidg = values.all || values.ceidg;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY ?? '';

  if (!runGoogle && !runCeidg) {
    console.error('Użyj: --google, --ceidg lub --all');
    process.exit(1);
  }

  const allRecords: BirthSchoolRecord[] = [];
  const supabase = dryRun ? null : getSupabase();

  if (runGoogle) {
    if (!apiKey) {
      console.warn('[Google] Brak GOOGLE_PLACES_API_KEY — pomijam Google Places.');
    } else {
      const runId = supabase ? await startImportRun(supabase, 'google_places', 'birth_school') : null;
      try {
        const cities = values['all-cities'] || values.all
          ? SEARCH_CITIES
          : values.city
          ? [{ city: values.city, voivodeship: 'mazowieckie' }]
          : [SEARCH_CITIES[0]];

        for (const { city, voivodeship } of cities) {
          const batch = await fetchGoogleForCity(city, voivodeship, apiKey);
          allRecords.push(...batch);
          await sleep(500);
        }

        if (supabase) {
          await finishImportRun(supabase, runId, 'success', allRecords.length, allRecords.length);
        }
      } catch (err) {
        if (supabase) {
          await finishImportRun(
            supabase,
            runId,
            'error',
            allRecords.length,
            0,
            err instanceof Error ? err.message : String(err)
          );
        }
        throw err;
      }
    }
  }

  if (runCeidg) {
    const runId = supabase ? await startImportRun(supabase, 'manual', 'birth_school') : null;
    try {
      const ceidgRecords = await fetchAllCeidg();
      allRecords.push(...ceidgRecords);
      if (supabase) {
        await finishImportRun(supabase, runId, 'success', ceidgRecords.length, ceidgRecords.length);
      }
    } catch (err) {
      if (supabase) {
        await finishImportRun(
          supabase,
          runId,
          'error',
          0,
          0,
          err instanceof Error ? err.message : String(err)
        );
      }
      console.error('[CEIDG] failed:', err);
    }
  }

  // Dedup po external_id
  const deduped = Array.from(
    new Map(allRecords.map((r) => [r.external_id, r])).values()
  );

  console.log(`\n[SUMMARY] Zebrano ${deduped.length} unikalnych szkół/placówek`);

  if (dryRun) {
    console.log(JSON.stringify(deduped.slice(0, 5), null, 2));
    return;
  }

  const upserted = await upsertBirthSchools(deduped);
  console.log(`[DONE] Zapisano ${upserted} rekordów do birth_schools.`);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
