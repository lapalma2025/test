import type { BirthSchool, Hospital } from '@/types/places';

type Mergeable = Hospital | BirthSchool;

const SOURCE_PRIORITY: Record<string, number> = {
  master: 5,
  nfz: 4,
  supabase: 3,
  curated: 2,
  osm: 2,
  manual: 1,
  mock: 0,
};

function normalizeKey(name: string, city?: string | null): string {
  const n = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  const c = (city ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  return `${n}|${c}`;
}

function isHospital(item: Mergeable): item is Hospital {
  return 'has_maternity' in item;
}

function mergeRecord<T extends Mergeable>(existing: T, incoming: T): T {
  const existingPriority = SOURCE_PRIORITY[existing.source ?? 'mock'] ?? 0;
  const incomingPriority = SOURCE_PRIORITY[incoming.source ?? 'mock'] ?? 0;
  const winner = incomingPriority >= existingPriority ? incoming : existing;
  const loser = winner === incoming ? existing : incoming;

  if (isHospital(winner) && isHospital(loser)) {
    return {
      ...winner,
      lat: winner.lat ?? loser.lat,
      lng: winner.lng ?? loser.lng,
      phone: winner.phone ?? loser.phone,
      rating: winner.rating ?? loser.rating,
      reviews_count: Math.max(winner.reviews_count, loser.reviews_count),
      has_anesthesia: winner.has_anesthesia ?? loser.has_anesthesia,
      waiting_avg_days: winner.waiting_avg_days ?? loser.waiting_avg_days,
      address_full: winner.address_full || loser.address_full,
      description: winner.description ?? loser.description,
      email: winner.email ?? loser.email,
      www: winner.www ?? loser.www,
      tags: (winner.tags?.length ? winner.tags : loser.tags) ?? [],
      notes: winner.notes ?? loser.notes,
      ref_level: winner.ref_level ?? loser.ref_level,
      neonatal_level: winner.neonatal_level ?? loser.neonatal_level,
      all_phones: (winner.all_phones?.length ? winner.all_phones : loser.all_phones) ?? [],
    } as T;
  }

  const w = winner as BirthSchool;
  const l = loser as BirthSchool;
  return {
    ...w,
    lat: w.lat ?? l.lat,
    lng: w.lng ?? l.lng,
    phone: w.phone ?? l.phone,
    rating: w.rating ?? l.rating,
    reviews_count: Math.max(w.reviews_count, l.reviews_count),
    price_pln: w.price_pln ?? l.price_pln,
    schedule: w.schedule ?? l.schedule,
    description: w.description ?? l.description,
    address_full: w.address_full ?? l.address_full,
    email: w.email ?? l.email,
    www: w.www ?? l.www,
    tags: (w.tags?.length ? w.tags : l.tags) ?? [],
    notes: w.notes ?? l.notes,
    payment: w.payment ?? l.payment,
    all_phones: (w.all_phones?.length ? w.all_phones : l.all_phones) ?? [],
  } as T;
}

export function mergeHospitals(sources: Hospital[][]): Hospital[] {
  const map = new Map<string, Hospital>();
  for (const list of sources) {
    for (const item of list) {
      const key = normalizeKey(item.name, item.city);
      const prev = map.get(key);
      map.set(key, prev ? mergeRecord(prev, item) : item);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'pl'));
}

export function mergeSchools(sources: BirthSchool[][]): BirthSchool[] {
  const map = new Map<string, BirthSchool>();
  for (const list of sources) {
    for (const item of list) {
      const key = normalizeKey(item.name, item.city);
      const prev = map.get(key);
      map.set(key, prev ? mergeRecord(prev, item) : item);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'pl'));
}

export function applyHospitalFilters(hospitals: Hospital[], filters: {
  city?: string;
  voivodeship?: string;
  search?: string;
  hasAnesthesia?: boolean;
}): Hospital[] {
  return hospitals.filter((h) => {
    if (filters.city && !h.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
    if (filters.voivodeship && h.voivodeship && h.voivodeship !== filters.voivodeship) return false;
    if (filters.search && !h.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.hasAnesthesia && !h.has_anesthesia) return false;
    return true;
  });
}

export function applySchoolFilters(schools: BirthSchool[], filters: {
  city?: string;
  voivodeship?: string;
  type?: 'stationary' | 'online' | 'hybrid' | 'all';
  freeOnly?: boolean;
  search?: string;
}): BirthSchool[] {
  return schools.filter((s) => {
    if (filters.city && s.city && !s.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
    if (filters.voivodeship && s.voivodeship && s.voivodeship !== filters.voivodeship) return false;
    if (filters.type && filters.type !== 'all' && s.type !== filters.type) return false;
    if (filters.freeOnly && !s.is_nfz_free) return false;
    if (filters.search && !s.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });
}
