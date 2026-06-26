/**
 * master-data.ts — konwersja master-szpitale-szkoly-PL.json na typy aplikacji.
 *
 * Źródło: assets/master-szpitale-szkoly-PL.json — jedyne źródło listy szkół i szpitali w app.
 *   Hospital: email, www, tags, notes, ref_level, neonatal_level, all_phones
 *   BirthSchool: email, www, tags, notes, payment, all_phones
 */

// @ts-ignore – duży JSON; Metro bundler obsługuje go natywnie
import masterJson from '../../assets/master-szpitale-szkoly-PL.json';
import type { BirthSchool, Hospital } from '@/types/places';

// ============ HELPERS ============

function slug(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 45);
}

function makeId(type: 'h' | 's', voiv: string, name: string): string {
  return `master-${type}-${slug(voiv)}-${slug(name)}`;
}

function buildAddress(adres: any, cityFallback: string): string {
  if (!adres) return cityFallback;
  const parts = [adres.ulica, adres.kod, adres.miasto ?? cityFallback].filter(Boolean);
  return parts.join(', ');
}

function extractPhones(telefony: any[]): Array<{ label: string; number: string }> {
  if (!telefony?.length) return [];
  return telefony.map((t: any) => ({ label: t.opis ?? 'tel.', number: t.numer ?? '' })).filter(p => p.number);
}

function isNfzFree(platnosc: string | null | undefined): boolean {
  if (!platnosc) return false;
  const p = platnosc.toLowerCase();
  return p.startsWith('bezpłatna') || p.startsWith('zwykle bezpłatna') || p.startsWith('nfz');
}

function extractPrice(platnosc: string | null | undefined): number | null {
  if (!platnosc) return null;
  const m = platnosc.match(/(\d{3,5})\s*zł/);
  return m?.[1] ? parseInt(m[1], 10) : null;
}

function schoolType(tagi: string[] | null | undefined): 'stationary' | 'online' | 'hybrid' {
  if (!tagi?.length) return 'stationary';
  if (tagi.includes('online')) return 'online';
  if (tagi.includes('hybrydowa') || tagi.includes('hybrydowa_czesc_online')) return 'hybrid';
  return 'stationary';
}

function isNfzHospital(tagi: string[] | null | undefined): boolean {
  if (!tagi?.length) return true; // większość polskich szpitali to NFZ
  if (tagi.includes('NFZ')) return true;
  if (tagi.includes('prywatny') || tagi.includes('komercyjny')) return false;
  return true;
}

// ============ KONWERSJA (lazy — nie blokuj startu app) ============

let _hospitals: Hospital[] | null = null;
let _schools: BirthSchool[] | null = null;

function buildMasterData(): void {
  if (_hospitals) return;

  const hospitals: Hospital[] = [];
  const schools: BirthSchool[] = [];

  for (const voiv of (masterJson as any).wojewodztwa ?? []) {
  const voivodeship: string = voiv.wojewodztwo;

  for (const cityObj of voiv.miasta) {
    const cityName: string = cityObj.miasto;

    // --- SZPITALE ---
    for (const h of (cityObj.szpitale ?? [])) {
      const phones = extractPhones(h.telefony);
      const id = makeId('h', voivodeship, h.nazwa);

      hospitals.push({
        id,
        external_id: id,
        name: h.nazwa,
        address_full: buildAddress(h.adres, cityName),
        city: cityName,
        voivodeship,
        phone: phones[0]?.number ?? null,
        lat: null,
        lng: null,
        has_maternity: !((h.tagi ?? []).includes('brak_oddzialu_polozniczego') || (h.tagi ?? []).includes('brak_porodowki')),
        has_anesthesia: null,
        waiting_avg_days: null,
        rating: null,
        reviews_count: 0,
        description: h.opis ?? null,
        source: 'master',
        is_nfz: isNfzHospital(h.tagi),
        email: h.email ?? null,
        www: h.www ?? null,
        tags: h.tagi ?? [],
        notes: h.uwagi ?? null,
        ref_level: h.stopien_referencyjnosci?.polozniczy ?? null,
        neonatal_level: h.stopien_referencyjnosci?.neonatologiczny ?? null,
        all_phones: phones,
      });
    }

    // --- SZKOŁY RODZENIA ---
    for (const s of (cityObj.szkoly_rodzenia ?? [])) {
      const phones = extractPhones(s.telefony);
      const id = makeId('s', voivodeship, s.nazwa);
      const free = isNfzFree(s.platnosc);

      schools.push({
        id,
        external_id: id,
        name: s.nazwa,
        hospital_id: null,
        type: schoolType(s.tagi),
        address_full: buildAddress(s.adres, cityName),
        city: cityName,
        voivodeship,
        is_nfz_free: free,
        price_pln: free ? null : extractPrice(s.platnosc),
        schedule: null,
        lang: ['pl'],
        description: s.opis ?? null,
        rating: null,
        reviews_count: 0,
        phone: phones[0]?.number ?? null,
        lat: null,
        lng: null,
        source: 'master',
        is_nfz: free,
        email: s.email ?? null,
        www: s.www ?? null,
        tags: s.tagi ?? [],
        notes: s.uwagi ?? null,
        payment: s.platnosc ?? null,
        all_phones: phones,
      });
    }
  }
  }

  _hospitals = hospitals;
  _schools = schools;
}

export function getMasterHospitals(): Hospital[] {
  buildMasterData();
  return _hospitals ?? [];
}

export function getMasterSchools(): BirthSchool[] {
  buildMasterData();
  return _schools ?? [];
}
