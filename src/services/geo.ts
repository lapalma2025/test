import {
  VOIVODESHIP_CAPITAL_COORDS,
  type Voivodeship,
} from '@/constants/voivodeships';

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  warszawa: { lat: 52.2297, lng: 21.0122 },
  wrocław: { lat: 51.1079, lng: 17.0385 },
  kraków: { lat: 50.0647, lng: 19.945 },
  łódź: { lat: 51.7592, lng: 19.456 },
  poznań: { lat: 52.4064, lng: 16.9252 },
  gdańsk: { lat: 54.352, lng: 18.6466 },
  szczecin: { lat: 53.4285, lng: 14.5528 },
  bydgoszcz: { lat: 53.0138, lng: 18.5984 },
  lublin: { lat: 51.2465, lng: 22.5684 },
  katowice: { lat: 50.2649, lng: 19.0238 },
  białystok: { lat: 53.1325, lng: 23.1688 },
  rzeszów: { lat: 50.0412, lng: 21.999 },
  kielce: { lat: 50.8661, lng: 20.6286 },
  olsztyn: { lat: 53.7784, lng: 20.4801 },
  opole: { lat: 50.6751, lng: 17.9213 },
  toruń: { lat: 53.0138, lng: 18.5984 },
  radom: { lat: 51.4027, lng: 21.1471 },
  sosnowiec: { lat: 50.2863, lng: 19.1041 },
  gdynia: { lat: 54.5189, lng: 18.5305 },
  częstochowa: { lat: 50.8118, lng: 19.1203 },
};

function normalizeKey(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function hashOffset(id: string): { lat: number; lng: number } {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 1000;
  }
  return {
    lat: ((hash % 17) - 8) * 0.004,
    lng: (((hash / 17) | 0) % 17 - 8) * 0.004,
  };
}

export function resolveCoords(
  id: string,
  lat: number | null | undefined,
  lng: number | null | undefined,
  city?: string | null,
  voivodeship?: string | null
): { lat: number; lng: number } | null {
  if (typeof lat === 'number' && typeof lng === 'number') {
    return { lat, lng };
  }

  const cityKey = city ? normalizeKey(city) : '';
  const base =
    (cityKey && CITY_COORDS[cityKey]) ||
    (voivodeship && VOIVODESHIP_CAPITAL_COORDS[voivodeship as Voivodeship]) ||
    null;

  if (!base) return null;

  const offset = hashOffset(id);
  return {
    lat: base.lat + offset.lat,
    lng: base.lng + offset.lng,
  };
}
