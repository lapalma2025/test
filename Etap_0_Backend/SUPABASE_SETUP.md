# Kidelo — Setup Supabase krok po kroku

> Dokładna instrukcja: co wkleić, gdzie kliknąć, jak zweryfikować.
> Czas: ~30 minut od zera do działającego backendu.

## Wymagania wstępne

- Konto na **supabase.com** (free tier wystarczy do startu — 50k MAU, 500 MB DB)
- Edytor SQL (Supabase ma wbudowany, nic nie musisz instalować)
- Node.js 18+ (do uruchomienia `fetch-nfz.ts` w kroku 6)

---

## KROK 1 — Stwórz projekt Supabase

1. Wejdź na **supabase.com** → "Start your project" → zaloguj się przez GitHub
2. Kliknij **"New project"**
3. Wypełnij:
   - **Name:** `kidelo`
   - **Database password:** wygeneruj silne hasło → **ZAPISZ W BEZPIECZNYM MIEJSCU** (Bitwarden/1Password). Potrzebne do bezpośrednich połączeń z DB.
   - **Region:** `Frankfurt (eu-central-1)` — KLUCZOWE dla RODO
   - **Pricing Plan:** `Free`
4. Kliknij **"Create new project"**. Czekaj ~2 minuty na provisioning.

---

## KROK 2 — Wklej schemat bazy

1. W lewym menu wybierz **SQL Editor** (ikona terminala)
2. Kliknij **"New query"**
3. Otwórz plik `Etap_0/schema.sql` z tego pakietu
4. **Skopiuj CAŁĄ zawartość pliku** (Ctrl+A, Ctrl+C)
5. **Wklej do edytora SQL** w Supabase (Ctrl+V)
6. Kliknij **"Run"** (lub Ctrl+Enter)

**Weryfikacja:** w lewym menu kliknij **Table Editor**. Powinieneś zobaczyć 9 tabel:
- `hospitals`
- `birth_schools`
- `midwives`
- `benefits`
- `user_profiles`
- `user_progress`
- `user_benefits_state`
- `user_favorites`
- `user_push_tokens`

Jeżeli widzisz wszystkie 9 — sukces, idź dalej.

---

## KROK 3 — Wklej dane świadczeń

1. Wróć do **SQL Editor** → "New query"
2. Otwórz plik `Etap_0/seed-benefits.sql`
3. **Skopiuj całą zawartość** i wklej do edytora
4. Kliknij **"Run"**

**Weryfikacja:** dolna część odpowie `benefits_count: 8`. Albo wejdź w **Table Editor → benefits** i sprawdź, czy widzisz 8 wierszy:
- becikowe
- 800plus
- macierzynski
- kosiniakowe
- aktywni-rodzice-w-pracy
- aktywnie-w-zlobku
- aktywnie-w-domu
- rko

---

## KROK 4 — Skonfiguruj Auth (logowanie)

### 4.1. Email magic link (najprostsze, zacznij od tego)

1. Lewe menu → **Authentication** → **Providers**
2. Znajdź **Email** → upewnij się, że jest **Enabled**
3. Zaznacz **"Enable email confirmations"** — `OFF` na start (szybciej testować)
4. **Templates** → **Magic Link** — opcjonalnie spolszcz email

### 4.2. Google OAuth (opcjonalnie, ale rekomendowane)

1. **Authentication → Providers → Google** → toggle ON
2. Potrzebujesz **Client ID** i **Client Secret** z Google Cloud Console:
   - Wejdź na console.cloud.google.com
   - Stwórz projekt "Kidelo Mobile"
   - APIs & Services → Credentials → Create OAuth 2.0 Client ID
   - Application type: **Web application**
   - Authorized redirect URI: skopiuj z Supabase (jest pokazane w tym samym widoku, format: `https://[twój-projekt].supabase.co/auth/v1/callback`)
   - Skopiuj Client ID i Secret do Supabase
3. **Save**

### 4.3. Apple OAuth (opcjonalnie, wymagane dla App Store)

Pomiń ten krok, jeśli celujesz tylko w Google Play. Dla iOS wymagane konto Apple Developer ($99/rok).

### 4.4. URL Configuration

1. **Authentication → URL Configuration**
2. **Site URL:** `kidelo://` (deep link aplikacji mobilnej)
3. **Redirect URLs** (dodaj wszystkie):
   - `kidelo://auth/callback`
   - `kidelo://`
   - `exp://*` (dla developmentu w Expo Go)

---

## KROK 5 — Skopiuj klucze do aplikacji

1. **Project Settings** (ikona koła zębatego) → **API**
2. Zobaczysz dwa klucze:
   - **`Project URL`** — np. `https://abcxyz.supabase.co`
   - **`anon public`** — długi JWT (klucz publiczny — bezpieczny w aplikacji mobilnej)
   - **`service_role`** — DRUGI długi JWT — **NIGDY nie umieszczaj w aplikacji**, tylko w skryptach serwerowych

3. Otwórz w aplikacji `kidelo-app/.env.example`, skopiuj jako `.env`:
   ```bash
   cd kidelo-app
   cp .env.example .env
   ```

4. Edytuj `.env`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://abcxyz.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...długi.JWT...
   ```

5. **NIE commituj** `.env` do gita — `.gitignore` to wyłapie.

---

## KROK 6 — Pobierz szpitale z NFZ Otwarte Dane

To zaseed bazę ~500 szpitalami położniczymi z całej Polski.

### 6.1. Setup skryptu

```bash
cd Etap_0
npm init -y
npm install @supabase/supabase-js tsx dotenv
```

### 6.2. Stwórz `.env` dla skryptu (NIE w katalogu aplikacji)

```bash
cat > .env << EOF
SUPABASE_URL=https://abcxyz.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...SERVICE_ROLE_JWT...
EOF
```

**Service role key**, nie anon key! Pobierasz z Supabase Project Settings → API.

### 6.3. Test pojedynczym województwem (dry run)

```bash
npx tsx fetch-nfz.ts --voivodeship 02 --dry-run
```

Powinieneś zobaczyć JSON z 2-3 placówkami z kujawsko-pomorskiego. Jeśli widzisz dane — wszystko działa.

### 6.4. Pełne pobranie (wszystkie 16 województw)

```bash
npx tsx fetch-nfz.ts --all
```

To trwa ~5-10 minut. Pobiera ~500 placówek z położnictwa + neonatologii.

**Weryfikacja:** w Supabase → Table Editor → `hospitals` → powinno być ~500 wierszy.

### 6.5. Geocoding (uzupełnienie współrzędnych)

Nominatim ma rate limit 1 zapytanie/sekundę, więc to potrwa ~10 minut.

```bash
npx tsx fetch-nfz.ts --geocode
```

**Weryfikacja:** w tabeli `hospitals` kolumny `lat`/`lng` powinny być wypełnione dla >80% wierszy.

---

## KROK 7 — Uruchom aplikację z Supabase

```bash
cd kidelo-app
npm install      # ~3 minuty, ~600 paczek
npx expo start
```

W telefonie: zainstaluj **Expo Go** ze sklepu → otwórz aplikację → zeskanuj QR code z terminala.

**Co powinieneś zobaczyć:**

1. **Splash screen** (cream + logo Kidelo)
2. **Onboarding** 5 kroków
3. Po onboardingu **Trasa** — pełna personalizacja z silnika
4. **Pieniądze** — 8 świadczeń z poprawnymi statusami
5. **Szkoły** → kliknij tab → **TERAZ powinieneś zobaczyć REALNE szpitale z bazy NFZ** (zamiast 3 mock danych)
6. **Szczegóły szpitala** → kliknij w dowolny → telefon, adres, opcja "Otwórz w Mapach" (z prawdziwymi koordynatami)

---

## KROK 8 — (Opcjonalnie) Włącz Sentry i analytics

### Sentry (error tracking)

1. Wejdź na **sentry.io** → załóż projekt React Native
2. Skopiuj **DSN** (format: `https://xxx@yyy.ingest.sentry.io/zzz`)
3. Dodaj do `.env`:
   ```
   EXPO_PUBLIC_SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz
   ```

### PostHog (analytics)

1. **eu.posthog.com** → załóż projekt
2. Skopiuj **Project API Key**
3. Dodaj do `.env`:
   ```
   EXPO_PUBLIC_POSTHOG_KEY=phc_xxxxxxxx
   EXPO_PUBLIC_POSTHOG_HOST=https://eu.posthog.com
   ```

---

## Sprawdzenie końcowe — co działa

| Funkcja | Bez Supabase | Z Supabase |
|---|---|---|
| Onboarding + Trasa | ✓ | ✓ |
| Pieniądze + szczegóły | ✓ | ✓ |
| Szkoły (mock 4) | ✓ | ✓ Real ~500 |
| Szpitale (mock 3) | ✓ | ✓ Real ~500 |
| Compare | ✓ | ✓ |
| Lista checklist | ✓ | ✓ |
| Notyfikacje lokalne | ✓ | ✓ |
| Auth (email/Google) | ✗ | ✓ |
| Sync między urządzeniami | ✗ | ✓ |
| Push z serwera | ✗ | Wymaga Etap 6 |

---

## Częste problemy

**"Network request failed" w aplikacji:**
- Sprawdź `EXPO_PUBLIC_SUPABASE_URL` w `.env`
- Restart `npx expo start` (env zmienne ładują się przy starcie)

**Pusta tabela `hospitals` po fetch-nfz:**
- Sprawdź czy `SUPABASE_SERVICE_ROLE_KEY` (NIE anon) w `.env` skryptu
- NFZ API czasem ma chwilowe outage — spróbuj ponownie za 5 min

**Geocoding zwraca null dla wielu placówek:**
- Nominatim nie zna niektórych adresów. To OK — w aplikacji pokażesz "Otwórz w Mapach" z samym adresem (bez koordynatów)

**Auth nie działa po Google OAuth:**
- Sprawdź **Redirect URLs** w Supabase Authentication → URL Configuration
- Musi być `kidelo://auth/callback` + `kidelo://`

**RLS blokuje insert do user_profiles:**
- To znaczy że user jest NULL (nie zalogowany). Sprawdź czy `auth.uid()` jest dostępne — sesja musi być aktywna.

---

## Co zostało po stronie Twojej (poza kodem)

Te rzeczy musisz zrobić **ręcznie**, bo wymagają Twoich kont i decyzji biznesowych:

1. **Konto Google Play Developer** — 25 USD jednorazowo na play.google.com/console
2. **Generowanie ikon graficznych** — 5 plików PNG (instrukcja w `PLAY_STORE_ASSETS.md`)
3. **Hosting Privacy Policy i Regulamin** — wrzuć `PRIVACY_POLICY.md` i `TERMS_OF_SERVICE.md` jako HTML pod `kidelo.pl/prywatnosc` i `kidelo.pl/regulamin` (Netlify/Vercel, ~15 min)
4. **Domena `kidelo.pl`** — sprawdź dostępność, kup w home.pl/nazwa.pl (~120 zł/rok)
5. **EAS Build production** — `eas build --platform android --profile production` (login do expo.dev, ~15 min build w cloud)
6. **Submit do Play Store** — wgranie .aab przez Play Console + wypełnienie listingu (~1 godzina)
7. **Beta testing** — Internal Testing track w Play Console, zaproszenie 10-50 osób

To są zadania na 1-2 tygodnie kalendarzowe, ale każde indywidualnie nie zajmuje więcej niż 30-60 minut.

---

## Jak utrzymywać aplikację po wydaniu

**Aktualizacja kwot świadczeń (raz/rok lub po nowelizacji):**
1. Edytuj `Etap_0/benefits.json` z nowymi kwotami
2. Aktualizuj `seed-benefits.sql` (lub regeneruj go ze JSON-a)
3. Wklej do Supabase SQL Editor → upsert (`on conflict do update`) zaktualizuje rekordy
4. Aplikacja automatycznie pobierze nowe dane przy następnym uruchomieniu (React Query staleTime 30 min)

**OTA updates (Expo Updates):**
```bash
eas update --branch production --message "Aktualizacja kwot becikowego 2027"
```
Wszyscy userzy dostają update bez konieczności pobierania z Play Store.

**Aktualizacja kodu aplikacji (nowe funkcje, fixy):**
```bash
# Bump version w app.json
eas build --platform android --profile production
eas submit --platform android
```
