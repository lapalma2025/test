/**
 * fetch-nfz.ts — ETL: pobiera placówki medyczne z NFZ Otwarte Dane, filtruje położnictwo,
 * geocoduje przez Nominatim (OpenStreetMap) i wstawia do Supabase.
 *
 * Uruchomienie:
 *   pnpm tsx scripts/fetch-nfz.ts --voivodeship 02 --benefit POŁOŻNICTWO
 *   pnpm tsx scripts/fetch-nfz.ts --all
 *
 * Wymaga:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY w .env
 *
 * Limity:
 *   - NFZ API: brak twardych limitów, ale bądź przyzwoity — 25 wyników/strona, paginuj
 *   - Nominatim: 1 req/sekundę (twarda zasada policy) — używamy delay
 */

import { createClient } from '@supabase/supabase-js';
import { parseArgs } from 'node:util';

// ============ TYPY ============

interface NfzQueueItem {
  attributes: {
    case: number;
    benefit: string;
    'many-places': string;
    provider: string;
    'provider-code': string;
    'regon-provider': string;
    'nip-provider': string;
    'teryt-provider': string;
    place: string;
    address: string;
    locality: string;
    phone: string;
    statistics: {
      'provider-data': {
        'awaiting': number;
        'removed': number;
        'average-period': number;
        update: string;
      };
    };
    dates: {
      applicable: boolean;
      date: string | null;
      'date-situation-as-at': string;
    };
    'benefits-for-children': string;
    'covid-19': string;
    'toilet': boolean;
    'ramp': boolean;
    'car-park': boolean;
    'elevator': boolean;
  };
  type: string;
  id: string;
}

interface NfzResponse {
  data: NfzQueueItem[];
  links: {
    first: string;
    prev: string | null;
    self: string;
    next: string | null;
    last: string;
  };
  meta: {
    context: string;
    count: number;
    page: number;
    limit: number;
    'provider-branch': string;
    title: string;
    'date-published': string;
    'date-modified': string;
    description: string;
    keywords: string;
    language: string;
    'content-type': string;
    'is-part-of': string;
    message: string | null;
  };
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  importance: number;
}

interface HospitalRecord {
  external_id: string;          // NFZ provider-code
  name: string;
  address_full: string;
  city: string;
  voivodeship: string;
  teryt: string;
  regon: string;
  nip: string;
  phone: string | null;
  lat: number | null;
  lng: number | null;
  has_maternity: boolean;
  has_anesthesia: boolean | null;
  waiting_avg_days: number | null;
  nfz_contract: boolean;
  source: 'nfz';
  raw_benefit: string;
  updated_at: string;
}

// ============ NFZ — pobieranie placówek ============

const NFZ_BASE = 'https://api.nfz.gov.pl/app-itl-api';

const VOIVODESHIPS = {
  '01': 'dolnośląskie',
  '02': 'kujawsko-pomorskie',
  '03': 'lubelskie',
  '04': 'lubuskie',
  '05': 'łódzkie',
  '06': 'małopolskie',
  '07': 'mazowieckie',
  '08': 'opolskie',
  '09': 'podkarpackie',
  '10': 'podlaskie',
  '11': 'pomorskie',
  '12': 'śląskie',
  '13': 'świętokrzyskie',
  '14': 'warmińsko-mazurskie',
  '15': 'wielkopolskie',
  '16': 'zachodniopomorskie',
} as const;

// Kody świadczeń NFZ zwracające REALNE wyniki z API kolejek (zweryfikowane 2026-06).
// ODDZIAŁ POŁOŻNICZO-GINEKOLOGICZNY / EDUKACJA PRZEDPORODOWA → zawsze 0 wyników
// (porody nie mają kolejek ambulatoryjnych w systemie NFZ).
const MATERNITY_BENEFITS = [
  'PORADNIA NEONATOLOGICZNA',       // placówki fizycznie w szpitalach z oddziałem porodowym
  'PORADNIA GINEKOLOGICZNA',        // opieka prenatalna, pokrycie wszystkich 16 województw
];

const EDUCATION_BENEFITS = [
  'PORADNIA GINEKOLOGICZNA',        // NFZ-kontraktowane poradnie realizujące edukację przedporodową
];

async function fetchNfzPage(
  voivodeshipCode: string,
  benefit: string,
  page: number = 1
): Promise<NfzResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: '25',
    format: 'json',
    case: '1',
    province: voivodeshipCode,
    benefit,
    benefitForChildren: 'false',
    api_version: '1.3',
  });

  const url = `${NFZ_BASE}/queues?${params.toString()}`;
  console.log(`[NFZ] GET ${url}`);

  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`NFZ API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<NfzResponse>;
}

async function fetchAllForVoivodeshipAndBenefit(
  voivodeshipCode: string,
  benefit: string
): Promise<NfzQueueItem[]> {
  const items: NfzQueueItem[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetchNfzPage(voivodeshipCode, benefit, page);
    items.push(...response.data);

    hasMore = response.links.next !== null;
    page++;

    // Bezpiecznik na pętlę
    if (page > 200) {
      console.warn(`[NFZ] page > 200 — przerywam dla bezpieczeństwa`);
      break;
    }

    // Drobny delay, żeby nie hammerować
    await sleep(200);
  }

  console.log(`[NFZ] ${benefit} / ${voivodeshipCode}: ${items.length} placówek`);
  return items;
}

// ============ Nominatim — geocoding ============

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';

async function geocode(address: string, city: string): Promise<{ lat: number; lng: number } | null> {
  const query = `${address}, ${city}, Poland`;
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1',
    countrycodes: 'pl',
    addressdetails: '0',
  });

  const url = `${NOMINATIM_BASE}?${params.toString()}`;

  // Nominatim wymaga user-agent identyfikującego app
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Kidelo/1.0 (contact: kontakt@kidelo.pl)',
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    console.warn(`[Geocode] error ${res.status} dla "${query}"`);
    return null;
  }

  const data = (await res.json()) as NominatimResult[];
  if (!data || data.length === 0) {
    console.warn(`[Geocode] no result dla "${query}"`);
    return null;
  }

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
  };
}

// ============ Pomocnicze ============

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function deduplicateByProviderCode(items: NfzQueueItem[]): NfzQueueItem[] {
  const seen = new Map<string, NfzQueueItem>();
  for (const item of items) {
    const code = item.attributes['provider-code'];
    if (!seen.has(code)) {
      seen.set(code, item);
    }
  }
  return Array.from(seen.values());
}

function nfzItemToRecord(item: NfzQueueItem, voivodeshipName: string): HospitalRecord {
  const a = item.attributes;
  return {
    external_id: a['provider-code'],
    name: a.provider,
    address_full: `${a.place}, ${a.address}, ${a.locality}`,
    city: a.locality,
    voivodeship: voivodeshipName,
    teryt: a['teryt-provider'],
    regon: a['regon-provider'],
    nip: a['nip-provider'],
    phone: a.phone || null,
    lat: null,    // wypełnimy w kolejnym kroku
    lng: null,
    has_maternity: true,    // bo filtrowaliśmy po MATERNITY_BENEFITS
    has_anesthesia: null,   // brak w API, dorzucamy manual w Etapie 4
    waiting_avg_days: a.statistics?.['provider-data']?.['average-period'] ?? null,
    nfz_contract: true,
    source: 'nfz',
    raw_benefit: a.benefit,
    updated_at: new Date().toISOString(),
  };
}

// ============ Supabase upsert ============

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Brak SUPABASE_URL lub SUPABASE_SERVICE_ROLE_KEY w env');
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function upsertHospitals(records: HospitalRecord[]): Promise<void> {
  const supabase = getSupabase();

  // Batch po 100, żeby nie palić limitu request body
  for (let i = 0; i < records.length; i += 100) {
    const batch = records.slice(i, i + 100);
    const { error } = await supabase
      .from('hospitals')
      .upsert(batch, { onConflict: 'external_id' });

    if (error) {
      console.error(`[Supabase] upsert error:`, error);
      throw error;
    }
    console.log(`[Supabase] upserted ${i + batch.length}/${records.length}`);
  }
}

async function backfillGeocoding(): Promise<void> {
  const supabase = getSupabase();

  // Pobierz placówki bez geo
  const { data: needGeo, error } = await supabase
    .from('hospitals')
    .select('external_id, address_full, city')
    .is('lat', null)
    .limit(1000);

  if (error) throw error;
  if (!needGeo || needGeo.length === 0) {
    console.log('[Geocode] wszystko już zgeocodowane');
    return;
  }

  console.log(`[Geocode] backfill dla ${needGeo.length} placówek`);

  for (const h of needGeo) {
    const result = await geocode(h.address_full, h.city);
    if (result) {
      await supabase
        .from('hospitals')
        .update({ lat: result.lat, lng: result.lng })
        .eq('external_id', h.external_id);
    }
    // Nominatim policy: 1 req/s
    await sleep(1100);
  }
}

// ============ MAIN ============

async function main() {
  const { values } = parseArgs({
    options: {
      voivodeship: { type: 'string', short: 'v' },
      benefit: { type: 'string', short: 'b' },
      all: { type: 'boolean' },
      geocode: { type: 'boolean' },
      'dry-run': { type: 'boolean' },
    },
  });

  const dryRun = values['dry-run'] ?? false;

  if (values.geocode) {
    await backfillGeocoding();
    return;
  }

  const targetVoivodeships = values.all
    ? Object.entries(VOIVODESHIPS)
    : values.voivodeship
    ? [[values.voivodeship, VOIVODESHIPS[values.voivodeship as keyof typeof VOIVODESHIPS]] as const]
    : null;

  if (!targetVoivodeships) {
    console.error('Użyj --voivodeship XX lub --all');
    process.exit(1);
  }

  const targetBenefits = values.benefit ? [values.benefit] : MATERNITY_BENEFITS;

  const allRecords: HospitalRecord[] = [];

  for (const [code, name] of targetVoivodeships) {
    for (const benefit of targetBenefits) {
      try {
        const items = await fetchAllForVoivodeshipAndBenefit(code, benefit);
        const deduped = deduplicateByProviderCode(items);
        const records = deduped.map((item) => nfzItemToRecord(item, name));
        allRecords.push(...records);
      } catch (err) {
        console.error(`[ERROR] ${code}/${benefit}:`, err);
      }
    }
  }

  // Final dedup po external_id (cross-benefit dla tej samej placówki)
  const finalMap = new Map<string, HospitalRecord>();
  for (const r of allRecords) {
    if (!finalMap.has(r.external_id)) {
      finalMap.set(r.external_id, r);
    }
  }
  const final = Array.from(finalMap.values());

  console.log(`\n[SUMMARY] Zebrano ${final.length} unikalnych placówek`);

  if (dryRun) {
    console.log('[DRY RUN] Pokazuję pierwsze 3:');
    console.log(JSON.stringify(final.slice(0, 3), null, 2));
    return;
  }

  await upsertHospitals(final);
  console.log('[DONE] Wszystko zapisane. Uruchom z --geocode by uzupełnić koordynaty.');
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
