export const VOIVODESHIPS = [
  'dolnośląskie',
  'kujawsko-pomorskie',
  'lubelskie',
  'lubuskie',
  'łódzkie',
  'małopolskie',
  'mazowieckie',
  'opolskie',
  'podkarpackie',
  'podlaskie',
  'pomorskie',
  'śląskie',
  'świętokrzyskie',
  'warmińsko-mazurskie',
  'wielkopolskie',
  'zachodniopomorskie',
] as const;

export type Voivodeship = (typeof VOIVODESHIPS)[number];

/** [south, west, north, east] — przybliżone bbox do zapytań OSM */
export const VOIVODESHIP_BBOX: Record<Voivodeship, [number, number, number, number]> = {
  'dolnośląskie': [50.5, 14.7, 51.9, 17.6],
  'kujawsko-pomorskie': [52.3, 17.0, 53.8, 19.5],
  lubelskie: [50.0, 21.4, 52.1, 24.2],
  lubuskie: [51.2, 14.3, 52.9, 16.0],
  'łódzkie': [50.6, 18.0, 52.2, 20.5],
  'małopolskie': [49.2, 19.0, 50.3, 21.2],
  mazowieckie: [51.0, 19.4, 53.5, 23.0],
  opolskie: [50.0, 17.2, 51.0, 18.5],
  podkarpackie: [49.0, 21.0, 50.6, 23.5],
  podlaskie: [52.0, 21.8, 54.4, 24.2],
  pomorskie: [53.4, 16.4, 54.9, 19.4],
  'śląskie': [49.4, 18.0, 50.9, 19.9],
  'świętokrzyskie': [50.0, 19.8, 51.2, 21.8],
  'warmińsko-mazurskie': [53.0, 19.0, 54.5, 22.8],
  wielkopolskie: [51.0, 15.5, 53.2, 18.5],
  zachodniopomorskie: [52.5, 14.0, 54.6, 16.9],
};

export const VOIVODESHIP_CAPITAL_COORDS: Record<Voivodeship, { lat: number; lng: number; city: string }> = {
  'dolnośląskie': { lat: 51.1079, lng: 17.0385, city: 'Wrocław' },
  'kujawsko-pomorskie': { lat: 53.0138, lng: 18.5984, city: 'Bydgoszcz' },
  lubelskie: { lat: 51.2465, lng: 22.5684, city: 'Lublin' },
  lubuskie: { lat: 52.7368, lng: 15.2288, city: 'Gorzów Wielkopolski' },
  'łódzkie': { lat: 51.7592, lng: 19.456, city: 'Łódź' },
  'małopolskie': { lat: 50.0647, lng: 19.945, city: 'Kraków' },
  mazowieckie: { lat: 52.2297, lng: 21.0122, city: 'Warszawa' },
  opolskie: { lat: 50.6751, lng: 17.9213, city: 'Opole' },
  podkarpackie: { lat: 50.0412, lng: 21.999, city: 'Rzeszów' },
  podlaskie: { lat: 53.1325, lng: 23.1688, city: 'Białystok' },
  pomorskie: { lat: 54.352, lng: 18.6466, city: 'Gdańsk' },
  'śląskie': { lat: 50.2649, lng: 19.0238, city: 'Katowice' },
  'świętokrzyskie': { lat: 50.8661, lng: 20.6286, city: 'Kielce' },
  'warmińsko-mazurskie': { lat: 53.7784, lng: 20.4801, city: 'Olsztyn' },
  wielkopolskie: { lat: 52.4064, lng: 16.9252, city: 'Poznań' },
  zachodniopomorskie: { lat: 53.4285, lng: 14.5528, city: 'Szczecin' },
};
