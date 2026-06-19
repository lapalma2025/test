/**
 * Publiczne API NFZ — kolejki / terminy leczenia.
 * Uwaga: ODDZIAŁ POŁOŻNICZO-GINEKOLOGICZNY / EDUKACJA PRZEDPORODOWA zwracają 0 wyników
 * (porody nie mają kolejek ambulatoryjnych). Działają: PORADNIA GINEKOLOGICZNA, PORADNIA NEONATOLOGICZNA.
 */

import type { BirthSchool, Hospital, HospitalFilters, SchoolFilters } from '@/types/places';
import { VOIVODESHIPS } from '@/constants/voivodeships';

const NFZ_QUEUES_BASE = 'https://api.nfz.gov.pl/app-itl-api/queues';
const REQUEST_TIMEOUT_MS = 12000;
const MAX_PAGES_PER_BENEFIT = 80;
const PROVINCE_CONCURRENCY = 2;

export const VOIVODESHIP_TO_NFZ_PROVINCE: Record<string, string> = {
  dolnośląskie: '01',
  'kujawsko-pomorskie': '02',
  lubelskie: '03',
  lubuskie: '04',
  łódzkie: '05',
  małopolskie: '06',
  mazowieckie: '07',
  opolskie: '08',
  podkarpackie: '09',
  podlaskie: '10',
  pomorskie: '11',
  śląskie: '12',
  świętokrzyskie: '13',
  'warmińsko-mazurskie': '14',
  wielkopolskie: '15',
  zachodniopomorskie: '16',
};

const NFZ_PROVINCE_TO_VOIVODESHIP = Object.fromEntries(
  Object.entries(VOIVODESHIP_TO_NFZ_PROVINCE).map(([name, code]) => [code, name])
) as Record<string, string>;

/**
 * Świadczenia, które FAKTYCZNIE zwracają dane z API kolejek NFZ (zweryfikowane).
 *
 * Uwaga: ODDZIAŁ POŁOŻNICZO-GINEKOLOGICZNY / EDUKACJA PRZEDPORODOWA zwracają 0 wyników
 * — porody nie mają kolejek w sensie ambulatoryjnym. Używamy świadczeń ambulatoryjnych:
 *   • PORADNIA NEONATOLOGICZNA — fizycznie w szpitalach z oddziałem porodowym
 *   • PORADNIA GINEKOLOGICZNA — opieka prenatalna, szerokie pokrycie (1–59 wyników/woj.)
 */
const MATERNITY_BENEFITS = [
  'PORADNIA NEONATOLOGICZNA',
  'PORADNIA GINEKOLOGICZNA',
];

const BIRTH_EDUCATION_BENEFITS = [
  'PORADNIA GINEKOLOGICZNA',
];

interface NfzQueueItem {
  id: string;
  attributes: {
    benefit: string;
    provider: string;
    'provider-code': string;
    place?: string;
    address?: string;
    locality?: string;
    phone?: string;
    latitude?: number;   // API zwraca współrzędne bezpośrednio — nie trzeba geocodować
    longitude?: number;
    statistics?: {
      'provider-data'?: {
        'average-period'?: number;
      };
    };
  };
}

interface NfzQueueResponse {
  data?: NfzQueueItem[];
  links?: {
    next: string | null;
  };
}

const entityCache = new Map<string, Hospital | BirthSchool>();

export function getCachedNfzEntity(id: string): Hospital | BirthSchool | null {
  return entityCache.get(id) ?? null;
}

export async function fetchNfzHospitals(filters: HospitalFilters = {}): Promise<Hospital[]> {
  const provinces = resolveProvinceCodes(filters.voivodeship);
  const items = await fetchNfzQueuesForProvinces(provinces, MATERNITY_BENEFITS);
  const hospitals = dedupeByExternalId(items.map((item) => mapQueueItemToHospital(item)));
  return hospitals.filter((hospital) => matchesHospitalFilters(hospital, filters));
}

export async function fetchNfzBirthSchools(filters: SchoolFilters = {}): Promise<BirthSchool[]> {
  const provinces = resolveProvinceCodes(filters.voivodeship);
  const items = await fetchNfzQueuesForProvinces(provinces, BIRTH_EDUCATION_BENEFITS);
  const schools = dedupeByExternalId(items.map((item) => mapQueueItemToBirthSchool(item)));
  return schools.filter((school) => matchesSchoolFilters(school, filters));
}

function resolveProvinceCodes(voivodeship?: string): string[] {
  if (voivodeship) {
    const code = VOIVODESHIP_TO_NFZ_PROVINCE[voivodeship.toLowerCase()];
    return code ? [code] : [];
  }
  return VOIVODESHIPS.map((v) => VOIVODESHIP_TO_NFZ_PROVINCE[v]).filter((c): c is string => Boolean(c));
}

async function fetchNfzQueuesForProvinces(
  provinces: string[],
  benefits: string[]
): Promise<Array<NfzQueueItem & { _province: string }>> {
  const allItems: Array<NfzQueueItem & { _province: string }> = [];

  for (let i = 0; i < provinces.length; i += PROVINCE_CONCURRENCY) {
    const batch = provinces.slice(i, i + PROVINCE_CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (province) => {
        const items = await fetchNfzQueues(province, benefits);
        return items.map((item) => ({ ...item, _province: province }));
      })
    );
    allItems.push(...batchResults.flat());
    if (i + PROVINCE_CONCURRENCY < provinces.length) {
      await sleep(250);
    }
  }

  return allItems;
}

async function fetchNfzQueues(province: string, benefits: string[]): Promise<NfzQueueItem[]> {
  const allItems: NfzQueueItem[] = [];

  for (const benefit of benefits) {
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= MAX_PAGES_PER_BENEFIT) {
      const response = await fetchNfzQueuePage(province, benefit, page);
      const pageItems = response.data ?? [];
      if (pageItems.length === 0) break;

      allItems.push(...pageItems);
      hasMore = Boolean(response.links?.next);
      page += 1;
    }
  }

  return allItems;
}

async function fetchNfzQueuePage(
  province: string,
  benefit: string,
  page: number
): Promise<NfzQueueResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: '25',
    format: 'json',
    case: '1',
    province,
    benefit,
    benefitForChildren: 'false',
    api_version: '1.3',
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${NFZ_QUEUES_BASE}?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (res.status === 429) {
      await sleep(1500);
      throw new Error('NFZ rate limit');
    }

    if (!res.ok) {
      throw new Error(`NFZ queues error ${res.status}`);
    }

    return (await res.json()) as NfzQueueResponse;
  } finally {
    clearTimeout(timeout);
  }
}

function mapQueueItemToHospital(item: NfzQueueItem & { _province?: string }): Hospital {
  const a = item.attributes;
  const province = item._province ?? '07';
  const record: Hospital = {
    id: `nfz-hospital-${a['provider-code'] || item.id}`,
    external_id: a['provider-code'] || item.id,
    name: cleanupName(a.provider),
    address_full: [a.place, a.address, a.locality].filter(Boolean).join(', '),
    city: normalizeCity(a.locality),
    voivodeship: NFZ_PROVINCE_TO_VOIVODESHIP[province] ?? '',
    phone: a.phone || null,
    lat: typeof a.latitude === 'number' ? a.latitude : null,
    lng: typeof a.longitude === 'number' ? a.longitude : null,
    has_maternity: true,
    has_anesthesia: null,
    waiting_avg_days: a.statistics?.['provider-data']?.['average-period'] ?? null,
    rating: null,
    reviews_count: 0,
    source: 'nfz',
    is_nfz: true,
  };
  entityCache.set(record.id, record);
  return record;
}

function mapQueueItemToBirthSchool(item: NfzQueueItem & { _province?: string }): BirthSchool {
  const a = item.attributes;
  const province = item._province ?? '07';
  const record: BirthSchool = {
    id: `nfz-school-${a['provider-code'] || item.id}`,
    external_id: a['provider-code'] || item.id,
    hospital_id: null,
    name: cleanupName(a.provider),
    type: 'stationary',
    address_full: [a.place, a.address, a.locality].filter(Boolean).join(', '),
    city: normalizeCity(a.locality),
    voivodeship: NFZ_PROVINCE_TO_VOIVODESHIP[province] ?? null,
    is_nfz_free: true,
    price_pln: null,
    schedule: 'Edukacja przedporodowa i opieka prenatalna finansowana przez NFZ',
    lang: ['pl'],
    description: 'Placówka ginekologiczna realizująca opiekę prenatalną i edukację przedporodową w ramach kontraktu z NFZ.',
    rating: null,
    reviews_count: 0,
    phone: a.phone || null,
    lat: typeof a.latitude === 'number' ? a.latitude : null,
    lng: typeof a.longitude === 'number' ? a.longitude : null,
    source: 'nfz',
    is_nfz: true,
  };
  entityCache.set(record.id, record);
  return record;
}

function dedupeByExternalId<T extends { external_id?: string; id: string; name?: string }>(
  records: T[]
): T[] {
  const seen = new Map<string, T>();
  for (const record of records) {
    seen.set(record.external_id || record.id, record);
  }
  return Array.from(seen.values()).sort((a, b) =>
    String(a.name ?? '').localeCompare(String(b.name ?? ''), 'pl')
  );
}

function cleanupName(value?: string): string {
  return (value || 'Placówka NFZ').replace(/\s+/g, ' ').trim();
}

function normalizeCity(value?: string): string {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function matchesHospitalFilters(hospital: Hospital, filters: HospitalFilters): boolean {
  if (filters.city && !hospital.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
  if (filters.voivodeship && hospital.voivodeship !== filters.voivodeship) return false;
  if (filters.search && !hospital.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
  if (filters.hasAnesthesia && !hospital.has_anesthesia) return false;
  return true;
}

function matchesSchoolFilters(school: BirthSchool, filters: SchoolFilters): boolean {
  if (filters.city && school.city && !school.city.toLowerCase().includes(filters.city.toLowerCase())) {
    return false;
  }
  if (filters.voivodeship && school.voivodeship !== filters.voivodeship) return false;
  if (filters.type && filters.type !== 'all' && school.type !== filters.type) return false;
  if (filters.freeOnly && !school.is_nfz_free) return false;
  if (filters.search && !school.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
  return true;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
