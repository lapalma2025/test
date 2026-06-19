# Kidelo — aplikacja mobilna

> Aplikacja dla rodziców w Polsce: ciąża + pierwsze 3 lata. React Native + Expo + Supabase.

## Status — co jest gotowe

### Etap 0 ✅ (osobny pakiet `Etap_0/`)
Audyt prawny, ROADMAP, benefits.json, eligibility-engine, fetch-nfz, schema.sql.

### Etap 2 ✅ — Setup mobile
- Expo SDK 51 + TypeScript strict + NativeWind 4
- Google Fonts (Newsreader serif, Geist sans, Geist Mono)
- React Query 5 z auto-refetch na focus
- React Navigation 7 + Expo Router 3 (file-based)
- Supabase client z secure storage (Keychain/EncryptedSharedPreferences)
- Design system: tokens.ts + Tailwind config

### Etap 3 ✅ — Personalizacja + testy
- **Onboarding 5-krokowy** z pełną walidacją
- **Silnik eligibility** (8 świadczeń, pure function)
- **Timeline generator** (8 etapów z konkretnymi datami)
- **25 testów Jest** dla silnika — UoP/B2B/student × pierwsze/kolejne × przed/po porodzie
- **Notifications service** — planowanie lokalnych reminders 7+1 dzień przed deadlinem

### Etap 4 ✅ — Pełne moduły
- **Trasa** — hero + następne 30 dni + projekcja finansowa
- **Pieniądze** — lista 8 świadczeń z personalizowanymi statusami
- **Szczegóły świadczenia** — kryteria, kroki, częste błędy, podstawa prawna, deep linki do mZUS/Emp@tii
- **Szkoły** — search + filtry (typ, NFZ free) + sort + compare 2-3 placówki
- **Szczegóły placówki** — info, mapa (deep link), telefon (call), opis
- **Porównywarka** — tabela z highlightem najlepszych wartości
- **Lista** — 6 checklist (USC, ZUS, NFZ POZ, mObywatel, Pediatra, Torba) z persystencją MMKV
- **Profil** — dane, edycja, dziecko, partner, reset

### Etap 5 ✅ — Auth + Privacy + Polish
- **Auth screen** — email magic link + Google OAuth + Apple OAuth + tryb gość
- **PRIVACY_POLICY.md** — RODO compliant, gotowe do publikacji
- **TERMS_OF_SERVICE.md** — Regulamin po polsku
- **Sentry integration** — error tracking z auto-stripping PII
- **PostHog hooks** — analytics events (do podłączenia w Etapie 6)
- **PLAY_STORE_ASSETS.md** — instrukcja generowania ikonek, splash, screenshots + szablon listingu

## Co jeszcze do zrobienia

### Etap 6 — Production launch
- [ ] Wygenerować ikonki (1024x1024, adaptive, splash, notification)
- [ ] Założyć konto Google Play Developer (25 USD)
- [ ] Uruchomić Supabase project + schema.sql
- [ ] Uruchomić `fetch-nfz.ts --all` żeby zaseed bazę szpitali
- [ ] Hostować PRIVACY_POLICY i TERMS na kidelo.pl
- [ ] EAS build + Internal Testing (10 osób)
- [ ] Closed Beta (50 osób z grup mam FB)
- [ ] Production rollout

## Uruchomienie

```bash
# 1. Skopiuj env
cp .env.example .env
# Wypełnij EXPO_PUBLIC_SUPABASE_URL i EXPO_PUBLIC_SUPABASE_ANON_KEY
# (opcjonalne — bez tego działa w trybie offline z mock data)

# 2. Instalacja
npm install
# albo lepiej: pnpm install

# 3. Start
npx expo start

# 4. Telefon: Expo Go + zeskanuj QR
#    LUB
#    Emulator: npx expo run:android
```

## Testy

```bash
npm test                  # uruchomienie testów Jest
npm test -- --watch       # watch mode
npm test -- --coverage    # coverage report
```

Obecnie 25 testów silnika eligibility — wszystkie kombinacje persony + edge cases.

## Struktura

```
kidelo-app/
├── app/                          # Expo Router (file-based)
│   ├── _layout.tsx              # Root: fonts, React Query, auth guard
│   ├── index.tsx                # Redirect
│   ├── onboarding.tsx
│   ├── auth.tsx
│   ├── (tabs)/                  # Bottom tabs: trasa, szkoly, pieniadze, lista, profil
│   ├── benefit/[id].tsx         # Detail świadczenia
│   ├── task/[id].tsx
│   ├── school/[id].tsx          # Detail szkoły/szpitala
│   └── compare.tsx              # Porównywarka
├── src/
│   ├── components/ui/           # Button, Card, Icon, Chip, Pill, Progress, etc.
│   ├── screens/
│   │   ├── onboarding/
│   │   ├── auth/
│   │   └── main/                # Trasa, Pieniadze, Szkoly, Lista, Profil
│   ├── engine/                  # eligibility-engine, timeline-generator (czyste funkcje)
│   │   └── __tests__/           # 25 testów Jest
│   ├── hooks/                   # useAuth, useHospitals, useSchools
│   ├── stores/                  # Zustand: profile
│   ├── services/                # supabase, auth, notifications, monitoring
│   ├── data/                    # benefits.json (single source of truth)
│   └── theme/                   # tokens.ts
├── assets/                      # ikony, splash, fonty
├── PRIVACY_POLICY.md
├── TERMS_OF_SERVICE.md
├── PLAY_STORE_ASSETS.md         # Instrukcja generowania assetów
├── README.md                    # Ten plik
├── .env.example
├── app.json                     # Expo config
├── eas.json                     # EAS build profiles
├── tailwind.config.js
└── package.json
```

## Co działa BEZ Supabase (offline mode)

Aplikacja jest zaprojektowana, by pełna funkcjonalność działała offline:
- Onboarding ✓ (persystencja w MMKV)
- Trasa ✓ (silnik + timeline lokalnie)
- Pieniądze ✓ (eligibility offline)
- Szczegóły świadczenia ✓ (benefits.json bundled w app)
- Szkoły / Szpitale ✓ (mock data 4 szkoły + 3 szpitale)
- Compare ✓
- Listy ✓ (state w MMKV)
- Profil ✓
- Notifications ✓ (lokalne)

Co wymaga Supabase:
- Logowanie / sync między urządzeniami
- Pełna baza ~500 szpitali z NFZ
- Real-time sync z partnerem
- Server-side analytics

## Konfiguracja Supabase

1. Utwórz projekt na supabase.com w regionie eu-central-1
2. SQL Editor → uruchom `Etap_0/schema.sql`
3. Authentication → Providers → włącz Email (+ opcjonalnie Google/Apple)
4. Settings → API → skopiuj URL i anon key do `.env`
5. Uruchom `tsx Etap_0/fetch-nfz.ts --all` (z service_role_key) żeby zaseed bazę

## Następny krok

Powiedz co dalej:
1. **Uruchom i pokaż błędy** — wypakuj, `npm install`, `npx expo start`
2. **Wygeneruj ikony i splash** — projekt graficzny w Figmie/SVG
3. **EAS Build pierwszy raz** — przygotujemy do submisji
4. **Setup Supabase + seed danych** — Etap 6 production
