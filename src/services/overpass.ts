/**
 * OpenStreetMap / Overpass — darmowe dane o szpitalach i szkołach rodzenia (także prywatne).
 */

import {
  VOIVODESHIP_BBOX,
  VOIVODESHIPS,
  type Voivodeship,
} from '@/constants/voivodeships';
import type { BirthSchool, Hospital, HospitalFilters, SchoolFilters } from '@/types/places';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const REQUEST_TIMEOUT_MS = 20000;

interface OverpassElement {
  id: number;
  type: 'node' | 'way' | 'relation';
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

export async function fetchOsmHospitals(filters: HospitalFilters = {}): Promise<Hospital[]> {
  const bbox = resolveBbox(filters.voivodeship);
  if (!bbox) return [];

  const query = buildHospitalQuery(bbox);
  const elements = await runOverpass(query);
  const hospitals = elements
    .map((el) => mapOsmToHospital(el, filters.voivodeship))
    .filter((h): h is Hospital => h !== null);

  return hospitals.filter((h) => matchesHospitalFilters(h, filters));
}

export async function fetchOsmBirthSchools(filters: SchoolFilters = {}): Promise<BirthSchool[]> {
  const bbox = resolveBbox(filters.voivodeship);
  if (!bbox) return [];

  const query = buildBirthSchoolQuery(bbox);
  const elements = await runOverpass(query);
  const schools = elements
    .map((el) => mapOsmToBirthSchool(el, filters.voivodeship))
    .filter((s): s is BirthSchool => s !== null);

  return schools.filter((s) => matchesSchoolFilters(s, filters));
}

function resolveBbox(voivodeship?: string): [number, number, number, number] | null {
  if (voivodeship && VOIVODESHIP_BBOX[voivodeship as Voivodeship]) {
    return VOIVODESHIP_BBOX[voivodeship as Voivodeship];
  }
  if (!voivodeship) {
    return [49.0, 14.1, 54.9, 24.2];
  }
  return null;
}

function buildHospitalQuery(bbox: [number, number, number, number]): string {
  const [south, west, north, east] = bbox;
  return `
    [out:json][timeout:30];
    (
      node["amenity"="hospital"]["name"~"po.o.n|gineko|matern|neonat|rodzin",i](${south},${west},${north},${east});
      way["amenity"="hospital"]["name"~"po.o.n|gineko|matern|neonat|rodzin",i](${south},${west},${north},${east});
      relation["amenity"="hospital"]["name"~"po.o.n|gineko|matern|neonat|rodzin",i](${south},${west},${north},${east});
      node["healthcare:speciality"~"obstetrics|gynaecology|midwifery|neonatology",i](${south},${west},${north},${east});
      way["healthcare:speciality"~"obstetrics|gynaecology|midwifery|neonatology",i](${south},${west},${north},${east});
      node["maternity"="yes"](${south},${west},${north},${east});
      way["maternity"="yes"](${south},${west},${north},${east});
    );
    out center 400;
  `;
}

function buildBirthSchoolQuery(bbox: [number, number, number, number]): string {
  const [south, west, north, east] = bbox;
  return `
    [out:json][timeout:30];
    (
      node["healthcare"="birthing_centre"](${south},${west},${north},${east});
      way["healthcare"="birthing_centre"](${south},${west},${north},${east});
      node["name"~"szko.a rodzenia|rodzenia|birth school|edukacja przedporodowa|prenatal",i](${south},${west},${north},${east});
      way["name"~"szko.a rodzenia|rodzenia|birth school|edukacja przedporodowa|prenatal",i](${south},${west},${north},${east});
      node["amenity"~"clinic|school"]["name"~"rodzen|porod|po.o.n|prenatal|maternit",i](${south},${west},${north},${east});
      way["amenity"~"clinic|school"]["name"~"rodzen|porod|po.o.n|prenatal|maternit",i](${south},${west},${north},${east});
    );
    out center 200;
  `;
}

async function runOverpass(query: string): Promise<OverpassElement[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`Overpass error ${res.status}`);
    }

    const json = (await res.json()) as OverpassResponse;
    return json.elements ?? [];
  } finally {
    clearTimeout(timeout);
  }
}

function mapOsmToHospital(el: OverpassElement, filterVoivodeship?: string): Hospital | null {
  const tags = el.tags ?? {};
  const name = tags.name || tags.operator;
  if (!name) return null;

  const coords = getCoords(el);
  const city = tags['addr:city'] || tags['addr:town'] || tags['addr:place'] || '';
  const voivodeship = guessVoivodeship(filterVoivodeship, city);

  return {
    id: `osm-hospital-${el.type}-${el.id}`,
    external_id: `osm/${el.type}/${el.id}`,
    name,
    address_full: formatAddress(tags),
    city,
    voivodeship: voivodeship ?? '',
    phone: tags.phone || tags['contact:phone'] || null,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
    has_maternity: isMaternityHospital(tags),
    has_anesthesia: null,
    waiting_avg_days: null,
    rating: null,
    reviews_count: 0,
    source: 'osm',
    is_nfz: tags['payment:nfz'] === 'yes' || tags.nfz === 'yes',
  };
}

function mapOsmToBirthSchool(el: OverpassElement, filterVoivodeship?: string): BirthSchool | null {
  const tags = el.tags ?? {};
  const name = tags.name || tags.operator;
  if (!name) return null;

  const coords = getCoords(el);
  const city = tags['addr:city'] || tags['addr:town'] || tags['addr:place'] || '';
  const voivodeship = guessVoivodeship(filterVoivodeship, city);
  const isNfz = tags['payment:nfz'] === 'yes' || tags.nfz === 'yes';
  const isOnline =
    /online|zdaln|webinar/i.test(name) ||
    /online|zdaln/i.test(tags.description ?? '');

  return {
    id: `osm-school-${el.type}-${el.id}`,
    external_id: `osm/${el.type}/${el.id}`,
    hospital_id: null,
    name,
    type: isOnline ? 'online' : 'stationary',
    address_full: formatAddress(tags),
    city: city || null,
    voivodeship,
    is_nfz_free: isNfz,
    price_pln: null,
    schedule: tags.opening_hours || null,
    lang: ['pl'],
    description: tags.description || 'Placówka z OpenStreetMap.',
    rating: null,
    reviews_count: 0,
    phone: tags.phone || tags['contact:phone'] || null,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
    source: 'osm',
    is_nfz: isNfz,
  };
}

function getCoords(el: OverpassElement): { lat: number; lng: number } | null {
  if (typeof el.lat === 'number' && typeof el.lon === 'number') {
    return { lat: el.lat, lng: el.lon };
  }
  if (el.center) {
    return { lat: el.center.lat, lng: el.center.lon };
  }
  return null;
}

function formatAddress(tags: Record<string, string>): string {
  const parts = [
    tags['addr:street'] && tags['addr:housenumber']
      ? `${tags['addr:street']} ${tags['addr:housenumber']}`
      : tags['addr:street'],
    tags['addr:postcode'],
    tags['addr:city'] || tags['addr:town'],
  ].filter(Boolean);
  return parts.join(', ');
}

function isMaternityHospital(tags: Record<string, string>): boolean {
  if (tags.maternity === 'yes') return true;
  if (/obstetrics|gynaecology|midwifery|neonatology/i.test(tags['healthcare:speciality'] ?? '')) return true;
  const haystack = [tags.name, tags.description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return /po.o.n|porod|obstet|ginek|matern|birth|rodzen|neonat/.test(haystack);
}

function guessVoivodeship(filterVoivodeship?: string, city?: string): string | null {
  if (filterVoivodeship) return filterVoivodeship;
  return null;
}

function matchesHospitalFilters(hospital: Hospital, filters: HospitalFilters): boolean {
  if (filters.city && !hospital.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
  if (filters.voivodeship && hospital.voivodeship && hospital.voivodeship !== filters.voivodeship) {
    return false;
  }
  if (filters.search && !hospital.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
  return true;
}

function matchesSchoolFilters(school: BirthSchool, filters: SchoolFilters): boolean {
  if (filters.city && school.city && !school.city.toLowerCase().includes(filters.city.toLowerCase())) {
    return false;
  }
  if (filters.voivodeship && school.voivodeship && school.voivodeship !== filters.voivodeship) {
    return false;
  }
  if (filters.type && filters.type !== 'all' && school.type !== filters.type) return false;
  if (filters.freeOnly && !school.is_nfz_free) return false;
  if (filters.search && !school.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
  return true;
}

export { VOIVODESHIPS };
