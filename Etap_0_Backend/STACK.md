# Kidelo — stos technologiczny

> Decyzje architektoniczne z uzasadnieniem. Dostosowane do Twojego doświadczenia (React, TypeScript, React Native, Next.js, Supabase, Node) i równoległej pracy na 4-5 projektach.

## Decyzje główne

| Warstwa | Wybór | Alternatywa odrzucona |
|---|---|---|
| Mobile framework | **React Native + Expo SDK 50+** | Flutter, Native Android (Kotlin) |
| Język | **TypeScript (strict)** | JS |
| Styling | **NativeWind 4** (Tailwind dla RN) | StyleSheet, styled-components |
| State (client) | **Zustand** | Redux, Jotai |
| State (server) | **TanStack Query (React Query) 5** | SWR, Apollo |
| Navigation | **React Navigation 7** | Expo Router |
| Backend | **Supabase** (Postgres + Auth + Storage + Edge Functions) | Firebase, custom Node+Postgres |
| Hosting backend | **Supabase managed** (region: eu-central-1) | Self-hosted Postgres |
| Storage local | **react-native-mmkv** | AsyncStorage |
| Push | **Expo Notifications** (FCM under) | OneSignal |
| Analytics | **PostHog** (self-hostable, GDPR-friendly) | Mixpanel, Amplitude |
| Errors | **Sentry** | Bugsnag |
| Build / CI | **EAS Build + EAS Submit** | GitHub Actions + custom |
| Maps | **react-native-maps** (Google Maps Android, Apple Maps iOS) | Mapbox |
| Geocoding | **Nominatim** (OpenStreetMap, free) | Google Geocoding API |
| Testing E2E | **Maestro** | Detox |
| Testing unit | **Jest + React Native Testing Library** | Vitest |
| Forms | **react-hook-form + zod** | Formik |
| Date logic | **date-fns** | dayjs, moment |

## Dlaczego React Native + Expo (nie Flutter, nie Native)

**Plusy dla Ciebie konkretnie:**
- Już znasz React Native (BNS, projekty klienckie wg memory)
- Cross-platform: jeden codebase = Android i iOS (Apple Developer w drugim kroku za $99/rok)
- Expo SDK ma w bibliotece wszystko czego potrzebujesz out-of-box: Push, Maps, Notifications, Auth, Camera, FileSystem
- EAS Build = nie potrzebujesz Maca do buildów (Apple cloud build w cenie)
- Hot reload + over-the-air updates (Expo Updates) — możesz wypchnąć fix bez przechodzenia przez review Google Play

**Minusy do świadomego zaakceptowania:**
- Cold start ~1.5-2x wolniejszy niż natywny (akceptowalne dla aplikacji rodzicielskiej, nie gry)
- Niektóre niszowe natywne moduły wymagają "prebuild" (wyjście z Expo managed). Dla MVP nie potrzebujemy.

**Czemu nie Flutter:**
- Dart to dodatkowy język do utrzymania na Twojej długiej liście
- Mniejszy ecosystem polskich bibliotek (np. polski PESEL validator, słowniki adresów)
- Większe binary size (~25MB vs ~15MB RN)

**Czemu nie Native Android (Kotlin):**
- Zablokowałbyś sobie iOS na 6+ miesięcy (przepisanie wszystkiego)
- Twój czas frontend > Twój czas Kotlin

## Dlaczego Supabase

**Plusy:**
- Znasz go (PPLA Academy, FarmSmart, Kidelo wg memory)
- Postgres = pełna kontrola schematu, joins, indeksy, FTS po polsku
- Row Level Security (RLS) — bezpieczne dzielenie tabel między userami bez pisania backendu
- Auth out-of-box: email, magic link, Google OAuth, Apple OAuth
- Edge Functions (Deno) dla logiki eligibility-checker po stronie serwera (jeśli chcesz schować algorytm)
- Storage dla zdjęć (np. avatar dziecka, dokumenty) z CDN
- Realtime subscriptions (przyszłość: tryb partnerski — drugi rodzic widzi update zmian)
- Region eu-central-1 (Frankfurt) — RODO compliant bez wychodzenia poza EU
- Pricing: free do 50k MAU, potem $25/mies za Pro

**Minusy:**
- Vendor lock-in (ale Postgres + Auth standardy = można migrate na własną infrę gdyby co)
- Edge Functions w Deno (nie Node) — drobny mismatch z resztą Twojego stacka

## Architektura projektu — monorepo

```
kidelo/
├── apps/
│   └── mobile/                  # Expo app (React Native)
│       ├── app/                 # Ekrany (jeśli używasz Expo Router)
│       ├── src/
│       │   ├── screens/         # Trasa, Szkoly, Pieniadze, Lista, Profil
│       │   ├── components/      # Komponenty UI (port z prototypu)
│       │   ├── engine/          # eligibility-engine, timeline-generator
│       │   ├── hooks/           # useBenefits, useTimeline, useHospitals
│       │   ├── services/        # supabase client, deep-links
│       │   ├── stores/          # Zustand stores (profile, ui)
│       │   └── i18n/            # PL, EN, UK (post-MVP)
│       ├── assets/              # ikona, splash, fonty
│       ├── app.json             # Expo config
│       └── eas.json             # EAS build profiles
├── packages/
│   ├── data/                    # benefits.json, timeline-rules.ts (źródło prawdy)
│   ├── ui/                      # Design system (Button, Card, etc.)
│   └── types/                   # Shared TypeScript types (UserProfile, Benefit, ...)
├── supabase/
│   ├── migrations/              # SQL migrations
│   ├── functions/               # Edge Functions
│   └── seed/                    # Skrypty seedujące (fetch-nfz.ts)
├── scripts/                     # ETL: fetch-nfz, geocode, verify-benefits
└── docs/                        # ROADMAP, AUDIT, STACK, this
```

**Czemu monorepo:** współdzielenie `benefits.json` i `types/` między mobile, edge functions i seed scripts. Jeden commit aktualizuje wszędzie.

**Tooling monorepo:** Turborepo + pnpm workspaces. Lekki, znany Ci.

## Bezpieczeństwo i RODO

**Co MUSIMY zrobić (twarde wymagania):**
- Region eu-central-1 dla Supabase (PASS)
- RLS na wszystkich tabelach z danymi użytkownika
- Privacy Policy + ToS po polsku, dostępne przed rejestracją
- "Data safety form" w Google Play Console — uczciwie wypełniony
- Eksport danych użytkownika (RODO art. 20) — Edge Function generująca JSON ze wszystkimi danymi usera
- Usunięcie danych (RODO art. 17) — soft delete + hard delete po 30 dniach
- Brak third-party trackerów bez zgody (no Facebook SDK, no Google Analytics bez consent banner)
- Audit log: kto i kiedy widział czyje dane (post-MVP)

**Czego NIE robimy w MVP:**
- Nie przechowujemy PESEL dziecka na serwerze (tylko local MMKV) — odpada ryzyko wycieku danych szczególnie wrażliwych
- Nie przechowujemy danych zdrowotnych (typu szczepienia, wyniki badań) — ryzyko zaklasyfikowania jako wyrób medyczny i wymogi UDI/MDR
- Nie integrujemy z mObywatel / IKP (Internetowe Konto Pacjenta) — wymaga audytu Centrum e-Zdrowia

## Środowiska

- **Dev** — Supabase local CLI + Expo Go (development build)
- **Preview** — Supabase preview project + EAS preview builds (TestFlight dla iOS, Internal Sharing dla Android)
- **Production** — Supabase production project + EAS production + Play Store + App Store

**Sekrety** — `expo-secure-store` dla on-device, GitHub Actions secrets + EAS secrets dla CI.

## Koszty miesięczne (estymacja)

**MVP startup (0-1000 MAU):**
- Supabase Free: 0 zł
- Expo EAS Free (30 builds/mies): 0 zł
- Sentry Free (5k errors/mies): 0 zł
- PostHog Free (1M events/mies): 0 zł
- Domena kidelo.pl: ~120 zł/rok
- Google Play Developer: 25 USD jednorazowo (~100 zł)
- **Razem: ~10 zł/miesiąc**

**Skala (10k MAU):**
- Supabase Pro: $25/mies (~100 zł)
- EAS Production: $29/mies (~120 zł)
- Sentry Team: $26/mies (~105 zł)
- PostHog scale: $0 (free do 1M events)
- Domeny + DNS: ~10 zł/mies
- **Razem: ~335 zł/miesiąc**

**Skala (50k MAU):**
- Supabase Team: $599/mies (~2 400 zł) — alternatywnie zmigrować na self-hosted Postgres na Hetzner za ~200 zł/mies
- Reszta proporcjonalnie
- **Razem: ~3 000 zł/miesiąc** lub **~800 zł** przy self-hosted

## Co montujemy gdzie

**Critical path do MVP:**
1. Expo TypeScript starter
2. NativeWind config + design tokens
3. Supabase setup + migracje
4. Auth flow
5. Onboarding wizard
6. eligibility-engine.ts (testowalny, pure function)
7. timeline-generator.ts
8. 5 ekranów głównych
9. 4 ekrany detali
10. Push notifications
11. Deep linki
12. E2E test happy path
13. EAS production build
14. Play Console submission

Każdy z tych kroków to 1-3 dni pracy fokusowej. Razem ~10-12 tygodni dla soloprenera z paralelnymi projektami.
