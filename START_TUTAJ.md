# Kidelo — START TUTAJ 🎯

> Aplikacja dla rodziców w Polsce: ciąża + pierwsze 3 lata.
> Świadczenia, dokumenty, terminy, szkoły rodzenia, szpitale.

## Co jest w tym pakiecie

```
kidelo-complete/
├── START_TUTAJ.md              ← TY JESTEŚ TUTAJ
│
├── Etap_0_Backend/             ← Backend, dane, dokumentacja
│   ├── README.md               ← Przeglądowy README Etapu 0
│   ├── ROADMAP.md              ← Pełen plan 6 etapów wdrożenia
│   ├── STACK.md                ← Decyzje technologiczne + uzasadnienie
│   ├── AUDIT.md                ← Audyt nieścisłości w prototypie
│   ├── SUPABASE_SETUP.md       ⭐ Co wkleić do Supabase (PRZECZYTAJ!)
│   ├── benefits.json           ← Zweryfikowana baza 8 świadczeń
│   ├── schema.sql              ⭐ Schemat Postgres do wklejenia
│   ├── seed-benefits.sql       ⭐ Świadczenia do wklejenia
│   ├── eligibility-engine.ts   ← Silnik wyliczania uprawnień (standalone)
│   └── fetch-nfz.ts            ⭐ Skrypt do pobrania szpitali z NFZ
│
└── kidelo-app/                 ← Aplikacja mobilna React Native
    ├── README.md               ← Setup i uruchomienie
    ├── PRIVACY_POLICY.md       ← Polityka prywatności RODO
    ├── TERMS_OF_SERVICE.md     ← Regulamin
    ├── PLAY_STORE_ASSETS.md    ← Instrukcja generowania ikonek
    ├── package.json
    ├── app/                    ← Expo Router (file-based)
    ├── src/                    ← Komponenty, ekrany, silniki
    └── ... (config files)
```

## Co zrobić KROK PO KROKU

### 🟢 Etap 1 — Najpierw poznaj projekt (15 min)

1. Przeczytaj `Etap_0_Backend/README.md` (overview Etapu 0)
2. Przeczytaj `Etap_0_Backend/ROADMAP.md` (cały plan)
3. Otwórz `kidelo-app/README.md` (status aplikacji)

### 🟡 Etap 2 — Uruchom aplikację lokalnie BEZ Supabase (15 min)

Aplikacja działa offline z mock data — wystarczy do zobaczenia jak wygląda.

```bash
cd kidelo-app
npm install         # ~3 minuty
npx expo start      # uruchom dev server
```

Telefon: zainstaluj **Expo Go** ze sklepu → zeskanuj QR → ciesz się aplikacją.

W trybie offline zobaczysz: pełen onboarding, Trasę z personalizacją, Pieniądze, Szczegóły świadczeń, 4 mock szkoły, 3 mock szpitale, Compare, Listę z 6 checkliszami, Profil.

### 🔴 Etap 3 — Setup Supabase (30 min) ⭐

To kluczowy krok do produkcji. **Przeczytaj `Etap_0_Backend/SUPABASE_SETUP.md`** — jest tam wszystko krok po kroku z screenshotami.

W skrócie:
1. Stwórz konto na supabase.com → nowy projekt w regionie Frankfurt
2. Wklej `schema.sql` w SQL Editor → Run
3. Wklej `seed-benefits.sql` w SQL Editor → Run (wstawi 8 świadczeń)
4. Skonfiguruj Auth (Email + opcjonalnie Google)
5. Skopiuj URL i anon key do `kidelo-app/.env`
6. Uruchom `fetch-nfz.ts --all` żeby pobrać ~500 szpitali z NFZ Otwarte Dane
7. Restart `npx expo start` — aplikacja zobaczy Supabase i pokaże realne dane

### ⚪ Etap 4 — Production launch (1-2 tygodnie kalendarzowe)

Te rzeczy są **poza kodem** — wymagają Twoich kont i decyzji:

1. **Domena `kidelo.pl`** — sprawdź dostępność w home.pl, kup (~120 zł/rok)
2. **Konto Google Play Developer** — 25 USD jednorazowo (play.google.com/console). Weryfikacja KYC ~5 dni — zacznij **TERAZ**.
3. **Ikony graficzne** — 5 plików PNG. Instrukcja w `kidelo-app/PLAY_STORE_ASSETS.md`. Możesz to zlecić projektantowi na Figmie za ~500 zł lub zrobić sam.
4. **Hosting Privacy Policy i Regulaminu** — wrzuć `PRIVACY_POLICY.md` i `TERMS_OF_SERVICE.md` jako HTML pod `kidelo.pl/prywatnosc` (Netlify free tier).
5. **EAS Build production** — `eas build --platform android --profile production` (~15 min w cloud Expo)
6. **Submit do Play Store** — wgrywasz `.aab` przez Play Console
7. **Internal Testing** — 10 testerów (rodzina, znajomi)
8. **Closed Beta** — 50 testerów z grup mam na FB (Twoja sieć)
9. **Production rollout** — 10% → 50% → 100%

## Co ZOSTAŁO ZROBIONE (49 plików, 60+ KB kodu)

✅ **Etap 0 (fundament prawny i dane)**
- Zweryfikowana baza 8 świadczeń z cytatami z gov.pl, podstawą prawną, deadline'ami
- Audyt 12 nieścisłości w prototypie do naprawy
- Schema bazy Postgres (9 tabel, RLS, RODO functions)
- Skrypt ETL do pobierania szpitali z NFZ Open API
- Decyzje technologiczne z uzasadnieniem
- Pełen plan 6 etapów

✅ **Etap 2 (setup mobile)**
- Expo SDK 51 + TypeScript strict + NativeWind 4
- Google Fonts (Newsreader, Geist, Geist Mono)
- React Query 5
- Design system: tokens + 11 komponentów UI

✅ **Etap 3 (personalizacja)**
- Onboarding 5-krokowy z walidacją
- Silnik eligibility (pure function, 8 świadczeń)
- Timeline generator (8 etapów z konkretnymi datami)
- **25 testów Jest** dla silnika

✅ **Etap 4 (moduły)**
- Trasa (hero + następne 30 dni)
- Pieniądze (lista świadczeń z statusami)
- Szczegóły świadczenia (kryteria, kroki, podstawa prawna, deep linki)
- Szkoły/Szpitale (search, filter, compare)
- Szczegóły placówki (mapa, telefon, opis)
- Porównywarka (tabela z highlightem)
- Lista (6 checklist z auto-aktywacją)
- Profil (dane, partner, dziecko)

✅ **Etap 5 (auth + privacy + polish)**
- Auth screen (email magic link + Google + Apple + tryb gość)
- Supabase integration (z secure storage)
- Privacy Policy + ToS po polsku, RODO-compliant
- Sentry error tracking
- PostHog analytics hooks
- Play Store assets guide + szablon listingu

## Czego NIE ZROBIŁEM (i nie mogłem)

Te rzeczy wymagają Twoich akcji **w realnym świecie**:

❌ Założenie konta Google Play Developer (25 USD, weryfikacja KYC)
❌ Stworzenie projektu Supabase (Twoje konto, Twoje hasło)
❌ Wygenerowanie ikonek graficznych (PNG 1024x1024 — wymagana praca projektanta)
❌ Hosting Privacy Policy pod kidelo.pl (Twoja domena, Twoje konto Netlify)
❌ Pobranie szpitali z NFZ (musisz uruchomić `fetch-nfz.ts` z Twoim Supabase service key)
❌ EAS Build production (Twoje konto expo.dev)
❌ Submit do Play Store (Twoje konto developer)
❌ Beta testing (Twoja sieć kontaktów rodzicielskich)

Wszystko inne — gotowe.

## Ile to kosztuje na start

| Pozycja | Cena |
|---|---|
| Google Play Developer | 25 USD (~100 zł) jednorazowo |
| Domena kidelo.pl | ~120 zł/rok |
| Supabase Free | 0 zł |
| Expo EAS Free | 0 zł (30 buildów/mies) |
| Sentry Free | 0 zł (5k errors/mies) |
| Hosting Netlify Free | 0 zł |
| Ikony graficzne | 0-500 zł (sam/projektant) |
| **RAZEM start** | **~220-720 zł** |

Skala (10k MAU): ~300 zł/miesiąc (Supabase Pro + EAS + Sentry Team).

## Jak utrzymywać aplikację po wydaniu

Świadczenia zmieniają się w PL **minimum raz w roku** (okresy świadczeniowe, kwoty limitów). Plan:

1. **Aktualizacja co kwartał:** sprawdź `Etap_0_Backend/benefits.json` pod kątem nowych kwot
2. **Edytuj benefits.json** → zaktualizuj `_meta.version` i `last_verified`
3. **Regeneruj `seed-benefits.sql`** → wklej do Supabase → `on conflict do update` zaktualizuje
4. **Aplikacja pobierze nowe dane** przy następnym uruchomieniu (React Query staleTime 30 min)
5. **OTA update kodu** — `eas update --branch production` (bez czekania na Play Store review)

## Następny krok dla Ciebie

**TERAZ:** Przeczytaj `Etap_0_Backend/SUPABASE_SETUP.md` i wykonaj **KROK 1** (stworzenie projektu Supabase). To wszystko, czego potrzebujesz żeby ruszyć — zajmie 5 minut.

Powodzenia! 🚀

---

*Wygenerowane: 11 czerwca 2026*
*Wszystkie dane prawne zweryfikowane na podstawie oficjalnych źródeł gov.pl i zus.pl*
