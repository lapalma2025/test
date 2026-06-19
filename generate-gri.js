// Generate enriched gdzierodzic-data.ts
const fs = require('fs');

const hospitals = JSON.parse(fs.readFileSync('C:/Users/User/Desktop/kidelo-pregna/gri-hosp-full.json','utf8'));
const schools = JSON.parse(fs.readFileSync('C:/Users/User/Desktop/kidelo-pregna/gri-schools-enriched.json','utf8'));

// ─── PHP unserializer (buffer-based, UTF-8 safe) ──────────────────────────
function phpUnserialize(str) {
  if (!str) return null;
  const buf = Buffer.from(str, 'utf8');
  let pos = 0;
  function readUntil(ch) {
    const start = pos;
    while (pos < buf.length && buf[pos] !== ch.charCodeAt(0)) pos++;
    return buf.slice(start, pos).toString('utf8');
  }
  function parse() {
    if (pos >= buf.length) return null;
    const type = String.fromCharCode(buf[pos]); pos += 2;
    if (type === 'i') { const val = parseInt(readUntil(';')); pos++; return val; }
    if (type === 'd') { const val = parseFloat(readUntil(';')); pos++; return val; }
    if (type === 'b') { const val = buf[pos] === 49; pos += 2; return val; }
    if (type === 'N') { pos++; return null; }
    if (type === 's') {
      const len = parseInt(readUntil(':')); pos++;
      pos++; // opening "
      const val = buf.slice(pos, pos + len).toString('utf8');
      pos += len + 2; // closing " and ;
      return val;
    }
    if (type === 'a') {
      const count = parseInt(readUntil(':')); pos++;
      pos++; // {
      const result = {};
      for (let i = 0; i < count; i++) { const key = parse(); const val = parse(); result[key] = val; }
      pos++; // }
      return result;
    }
    return null;
  }
  try { return parse(); } catch(e) { return null; }
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function yn(v) { return v === 'Tak' || v === 'tak' || v === '1' || v === true; }
function cleanStr(v) {
  if (!v) return null;
  return String(v).replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').trim();
}
function shortStr(v, max) {
  if (!max) max = 250;
  v = cleanStr(v);
  if (!v) return null;
  if (v.length <= max) return v;
  return v.substring(0, max).replace(/\s+\S*$/, '...');
}

// ─── Build hospital description ───────────────────────────────────────────
function buildHospitalDescription(h, d) {
  const parts = [];
  const src = d || h;

  const refPol = d && d.referencyjnosc_pol ? d.referencyjnosc_pol : h.referencyjnosc_pol;
  const refNeo = d && d.referencyjnosc_neonat ? d.referencyjnosc_neonat : h.referencyjnosc_neonat;
  if (refPol) parts.push('Poziom referencyjny: ' + refPol);
  if (refNeo) parts.push('Neonatologia poziom: ' + refNeo);

  if (d && d.ileporodow && parseInt(d.ileporodow) > 0) {
    parts.push('Liczba porodów rocznie: ' + parseInt(d.ileporodow).toLocaleString('pl-PL'));
  }

  const metF = (d && d.metodyfarmakologiczne) ? d.metodyfarmakologiczne : h.metodyfarmakologiczne;
  if (metF) parts.push('Znieczulenie: ' + shortStr(metF, 200));

  const metNF = (d && d.metodyniefarmakologiczne) ? d.metodyniefarmakologiczne : h.metodyniefarmakologiczne;
  if (metNF) parts.push('Metody niefarmakologiczne: ' + shortStr(metNF, 200));

  const vbac = d ? d.vbac : h.vbac;
  if (vbac !== undefined && vbac !== null && vbac !== '') {
    parts.push('VBAC (poród po cesarskim): ' + (yn(vbac) ? 'dostępny' : 'niedostępny'));
  }

  const wodny = d ? d.poroddowody : h.poroddowody;
  if (wodny !== undefined && wodny !== null && wodny !== '') {
    parts.push('Poród w wodzie: ' + (yn(wodny) ? 'dostępny' : 'niedostępny'));
  }

  const cs = (d && d.odsetekcesarskich) ? d.odsetekcesarskich : h.odsetekcesarskich;
  if (cs && parseFloat(cs) > 0) parts.push('Odsetek cięć cesarskich: ' + cs + '%');

  const nac = (d && d.odseteknacieckrocza) ? d.odseteknacieckrocza : h.odseteknacieckrocza;
  if (nac && parseFloat(nac) > 0) parts.push('Odsetek nacięć krocza: ' + nac + '%');

  if (d) {
    // Rooms
    const singl = parseInt(d.saljednoosobowych || d.salepo_jeden || '0') || 0;
    const singlB = parseInt(d.saljednoosobowychsanit || '0') || 0;
    const multi = parseInt(d.salwieloosobowych || d.salepo_wiele || '0') || 0;
    if (singl > 0 || multi > 0) {
      const rp = [];
      if (singl > 0) rp.push('jednoosobowe: ' + singl + (singlB > 0 ? ' (z łazienką: ' + singlB + ')' : ''));
      if (multi > 0) rp.push('wieloosobowe: ' + multi);
      parts.push('Sale porodowe: ' + rp.join(', '));
    }

    // Birth partner
    if (d.osobabliska) parts.push('Osoba bliska przy porodzie: ' + (yn(d.osobabliska) ? 'Tak' : 'Nie'));

    // Doula
    if (d.doula && d.doula !== 'Nie') {
      const doulaInfo = typeof d.doula === 'string' && d.doula.length > 3 ? shortStr(d.doula, 120) : 'Tak';
      parts.push('Doula: ' + doulaInfo);
    } else if (d.doula === 'Nie') {
      parts.push('Doula: Nie');
    }

    // Birth school
    if (d.szkolarodzenia) {
      const srFree = yn(d.szkolarodzeniabezplatna) ? ' (bezpłatna)' : '';
      parts.push('Szkoła rodzenia: ' + shortStr(d.szkolarodzenia, 100) + srFree);
    }

    // Lactation support
    if (d.pomoclaktacyjna && d.pomoclaktacyjna !== 'Nie') {
      if (typeof d.pomoclaktacyjna === 'string' && d.pomoclaktacyjna.length > 5) {
        parts.push('Wsparcie laktacyjne: ' + shortStr(d.pomoclaktacyjna, 150));
      } else {
        parts.push('Wsparcie laktacyjne: Tak');
      }
    }

    // Psychologist
    if (d.psycholog && d.psycholog !== 'Nie') {
      parts.push('Psycholog: ' + shortStr(d.psycholog, 120));
    }

    // Visiting hours
    if (d.godzinyodziwedzin) parts.push('Godziny odwiedzin: ' + shortStr(d.godzinyodziwedzin, 120));

    // Equipment
    if (d.sprzetyjednoosobowe) parts.push('Wyposażenie sali: ' + shortStr(d.sprzetyjednoosobowe, 150));

    // Accessibility
    const acc = [];
    if (yn(d.trudnosciwporuszaniu)) acc.push('osoby z ograniczoną mobilnością');
    if (yn(d.migowy)) acc.push('tłumacz języka migowego');
    if (yn(d.slabowidzacy)) acc.push('osoby słabowidzące');
    if (acc.length > 0) parts.push('Dostępność: ' + acc.join(', '));

    // Can visit ward
    if (yn(d.mozliwoscobejrzenia)) parts.push('Możliwość obejrzenia oddziału: Tak');

    // Fees
    if (d.oplaty) parts.push('Opłaty dodatkowe: ' + shortStr(d.oplaty, 200));

    // Certificates
    if (d.certyfikaty) parts.push('Certyfikaty: ' + shortStr(cleanStr(d.certyfikaty), 200));

    // Important info
    if (d.innewazne) parts.push('Ważne informacje: ' + shortStr(cleanStr(d.innewazne), 200));
  }

  return parts.length > 0 ? parts.join('\n') : null;
}

// ─── Build school description ──────────────────────────────────────────────
function buildSchoolDescription(s) {
  const sc = s.scraped || {};
  const parts = [];

  if (s.szkolyrodzenia_szpital) parts.push('Szpital: ' + cleanStr(s.szkolyrodzenia_szpital));
  if (sc.platna_html) parts.push('Bezpłatna: ' + (yn(sc.platna_html) ? 'Tak' : 'Nie'));
  if (sc.prowadzacy_html) parts.push('Prowadzący: ' + shortStr(sc.prowadzacy_html, 150));
  if (sc.dodatkoweinformacje_html) parts.push(shortStr(sc.dodatkoweinformacje_html, 300));
  if (sc.program_html && !sc.dodatkoweinformacje_html) {
    parts.push('Program: ' + shortStr(sc.program_html, 250));
  }
  if (sc.cennik_html) parts.push('Cennik: ' + shortStr(sc.cennik_html, 120));

  return parts.length > 0 ? parts.join('\n') : null;
}

// ─── Voivodeship normalization (returns proper Polish name) ───────────────
function polishVoiv(v) {
  if (!v) return '';
  const norm = v.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[-\s]+/g,'');
  const map = {
    dolnoslaskie: 'dolnośląskie',
    kujawskopomorskie: 'kujawsko-pomorskie',
    lubelskie: 'lubelskie',
    lubuskie: 'lubuskie',
    lodzkie: 'łódzkie',
    malopolskie: 'małopolskie',
    mazowieckie: 'mazowieckie',
    opolskie: 'opolskie',
    podkarpackie: 'podkarpackie',
    podlaskie: 'podlaskie',
    pomorskie: 'pomorskie',
    slaskie: 'śląskie',
    swietokrzyskie: 'świętokrzyskie',
    warminskomazurskie: 'warmińsko-mazurskie',
    wielkopolskie: 'wielkopolskie',
    zachodniopomorskie: 'zachodniopomorskie',
  };
  return map[norm] || v.toLowerCase();
}

// ─── Garbage school filter ────────────────────────────────────────────────
function isGarbageSchool(s) {
  const n = (s.nickname || '').trim();
  return /^[0-9]+_/.test(n) || n.length < 3 || /^(aaa|mp)$/i.test(n);
}

// ─── JS escape for template ───────────────────────────────────────────────
function esc(s) {
  if (s === null || s === undefined) return 'null';
  return JSON.stringify(String(s));
}
function escBool(v) { return v ? 'true' : 'false'; }
function escNum(v) { return v === null || v === undefined ? 'null' : Number(v); }

// ─── Generate hospitals ────────────────────────────────────────────────────
function generateHospitals() {
  return hospitals.map(h => {
    const d = phpUnserialize(h.daneankiety);
    const description = buildHospitalDescription(h, d);

    const rating = h.ranking_all && parseFloat(h.ranking_all) > 0
      ? Math.round(parseFloat(h.ranking_all) / 20 * 10) / 10
      : null;

    const metF = (d && d.metodyfarmakologiczne) ? d.metodyfarmakologiczne : (h.metodyfarmakologiczne || '');
    const hasAnesthesia = metF.toLowerCase().includes('zewn');

    const phone = h.tel || null;
    const voiv = polishVoiv(h.voivodeship || '');
    const reviewCount = parseInt(h.people || '0') || 0;
    const lat = h.lat ? parseFloat(h.lat) : null;
    const lng = h.lng ? parseFloat(h.lng) : null;

    return {
      id: 'gri-hospital-' + (h.user_id || h.ID),
      external_id: 'gri/hospital/' + (h.user_id || h.ID),
      name: h.name,
      address_full: [h.street, h.postalcode, h.city].filter(Boolean).join(', '),
      city: h.city,
      voivodeship: voiv,
      phone,
      lat,
      lng,
      has_maternity: true,
      has_anesthesia: hasAnesthesia,
      waiting_avg_days: null,
      rating,
      reviews_count: reviewCount,
      description,
      source: 'gdzierodzic',
      is_nfz: h.nfz === 'Tak' || h.nfz === '1',
    };
  });
}

// ─── Generate schools ──────────────────────────────────────────────────────
function generateSchools() {
  return schools
    .filter(s => !isGarbageSchool(s))
    .map(s => {
      const sc = s.scraped || {};
      const description = buildSchoolDescription(s);
      const isFree = sc.platna_html ? yn(sc.platna_html) : false;
      const address = sc.adres_html || null;
      const phone = sc.tel || null;
      const city = sc.miasta_html || s.szkolyrodzenia_miasto || null;
      const voiv = polishVoiv(sc.wojewodztwa_html || s.szkolyrodzenia_wojewodztwo || '');

      return {
        id: 'gri-school-' + s.ID,
        external_id: 'gri/school/' + s.ID,
        name: s.nickname,
        hospital_id: null,
        type: 'stationary',
        address_full: address,
        city,
        voivodeship: voiv,
        is_nfz_free: isFree,
        price_pln: null,
        schedule: null,
        lang: ['pl'],
        description,
        rating: null,
        reviews_count: 0,
        phone,
        lat: null,
        lng: null,
        source: 'gdzierodzic',
        is_nfz: isFree,
      };
    });
}

// ─── Render TypeScript file ───────────────────────────────────────────────
function renderTs(hospArr, schoolArr) {
  function renderHosp(h) {
    const lines = [
      '  {',
      '    id: ' + esc(h.id) + ',',
      '    external_id: ' + esc(h.external_id) + ',',
      '    name: ' + esc(h.name) + ',',
      '    address_full: ' + esc(h.address_full) + ',',
      '    city: ' + esc(h.city) + ',',
      '    voivodeship: ' + esc(h.voivodeship) + ',',
      '    phone: ' + esc(h.phone) + ',',
      '    lat: ' + escNum(h.lat) + ',',
      '    lng: ' + escNum(h.lng) + ',',
      '    has_maternity: true,',
      '    has_anesthesia: ' + escBool(h.has_anesthesia) + ',',
      '    waiting_avg_days: null,',
      '    rating: ' + escNum(h.rating) + ',',
      '    reviews_count: ' + h.reviews_count + ',',
      '    description: ' + esc(h.description) + ',',
      '    source: \'gdzierodzic\',',
      '    is_nfz: ' + escBool(h.is_nfz) + ',',
      '  }',
    ];
    return lines.join('\n');
  }

  function renderSchool(s) {
    const lines = [
      '  {',
      '    id: ' + esc(s.id) + ',',
      '    external_id: ' + esc(s.external_id) + ',',
      '    name: ' + esc(s.name) + ',',
      '    hospital_id: null,',
      '    type: \'stationary\',',
      '    address_full: ' + esc(s.address_full) + ',',
      '    city: ' + esc(s.city) + ',',
      '    voivodeship: ' + esc(s.voivodeship) + ',',
      '    is_nfz_free: ' + escBool(s.is_nfz_free) + ',',
      '    price_pln: null,',
      '    schedule: null,',
      '    lang: [\'pl\'],',
      '    description: ' + esc(s.description) + ',',
      '    rating: null,',
      '    reviews_count: 0,',
      '    phone: ' + esc(s.phone) + ',',
      '    lat: null,',
      '    lng: null,',
      '    source: \'gdzierodzic\',',
      '    is_nfz: ' + escBool(s.is_nfz) + ',',
      '  }',
    ];
    return lines.join('\n');
  }

  const header = `/**
 * Dane z gdzierodzic.info - ${hospArr.length} szpitali z oddzialem porodowym i ${schoolArr.length} szkol rodzenia.
 * Pobrane i wzbogacone automatycznie z API oraz profili serwisu gdzierodzic.info (2026-06).
 * Szpitale: GPS, NFZ, oceny, znieczulenie, VBAC, % cesarskich, sale, osoba bliska, doula i wiecej.
 * Szkoly: adres, telefon, szpital macierzysty, bezplatnosc, program, prowadzacy.
 */

import type { BirthSchool, Hospital } from '@/hooks/useHospitals';

export const GDZIERODZIC_HOSPITALS: Hospital[] = [
${hospArr.map(renderHosp).join(',\n')}
];

export const GDZIERODZIC_SCHOOLS: BirthSchool[] = [
${schoolArr.map(renderSchool).join(',\n')}
];
`;
  return header;
}

const hospArr = generateHospitals();
const schoolArr = generateSchools();
console.log('Hospitals:', hospArr.length);
console.log('Schools:', schoolArr.length);
console.log('Hospitals with rich desc:', hospArr.filter(h => h.description && h.description.includes('\n')).length);
console.log('Schools with desc:', schoolArr.filter(s => s.description).length);

const ts = renderTs(hospArr, schoolArr);
fs.writeFileSync(
  'C:/Users/User/Desktop/kidelo-pregna/kidelo-complete/kidelo-app/src/data/gdzierodzic-data.ts',
  ts,
  'utf8'
);
console.log('Written gdzierodzic-data.ts, size:', (ts.length / 1024).toFixed(0), 'KB');

// Sample output
console.log('\nSample hospital description:');
console.log(hospArr[0].name);
console.log(hospArr[0].description && hospArr[0].description.substring(0, 400));

const sampleSchool = schoolArr.find(s => s.description && s.description.length > 80);
if (sampleSchool) {
  console.log('\nSample school description:');
  console.log(sampleSchool.name);
  console.log(sampleSchool.description.substring(0, 300));
}
