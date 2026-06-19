# Kidelo — Etap 0 (fundament)

> Pakiet dokumentów i kodu na start produkcyjnego wdrożenia aplikacji Kidelo.
> Wszystko zweryfikowane na dzień **9 czerwca 2026**.

## Co tu jest

| Plik | Co zawiera | Status |
|---|---|---|
| `ROADMAP.md` | Pełny plan 6 etapów wdrożenia z kryteriami zakończenia i czasem | Gotowe do realizacji |
| `STACK.md` | Decyzje technologiczne z uzasadnieniem (React Native + Expo + Supabase) | Gotowe |
| `AUDIT.md` | 12 nieścisłości w obecnym prototypie do naprawy | Lista poprawek |
| `benefits.json` | Zweryfikowana baza 8 świadczeń + 5 obowiązków + cytaty źródłowe + podstawa prawna | Produkcyjne |
| `schema.sql` | Schemat Supabase Postgres: tabele, indeksy, RLS, RODO functions | Do uruchomienia w Supabase |
| `fetch-nfz.ts` | ETL pobierający szpitale położnicze z NFZ Open API + geocoding | Do uruchomienia |
| `eligibility-engine.ts` | Silnik eligibility — czysta funkcja TypeScript dla wszystkich świadczeń | Gotowy, testowalny |

## Co robić dalej (kolejność)

### 1. Przeczytaj ROADMAP.md
Zweryfikuj założenia i timeline. Zdecyduj czy stack OK lub czy chcesz alternatywę.

### 2. Załóż konto Google Play Developer
25 USD jednorazowo, weryfikacja KYC ~5 dni. **Zrób TERAZ** żeby Cię nie spowalniało na końcu.

### 3. Uruchom Supabase
```bash
# Stwórz projekt na supabase.com w regionie eu-central-1 (Frankfurt)
# Skopiuj URL i ANON_KEY do .env

# W SQL Editor uruchom schema.sql
```

### 4. Pobierz dane NFZ
```bash
pnpm install @supabase/supabase-js date-fns
# Ustaw SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY w .env

# Najpierw dry run dla 1 województwa:
pnpm tsx fetch-nfz.ts --voivodeship 02 --dry-run

# Pełne pobieranie:
pnpm tsx fetch-nfz.ts --all

# Geocoding (Nominatim ma rate limit 1 req/s — to potrwa ~30 minut):
pnpm tsx fetch-nfz.ts --geocode
```

### 5. Załaduj benefits.json do tabeli `benefits`
Stwórz `scripts/seed-benefits.ts`:
```ts
import benefits from './benefits.json';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
await supabase.from('benefits').upsert(benefits.benefits.map(b => ({
  id: b.id, slug: b.slug, name: b.name, official_name: b.official_name,
  amount_pln: b.amount_pln, amount_display: b.amount_display,
  unit: b.unit, unit_display: b.unit_display,
  income_means_tested: b.income_means_tested ?? false,
  income_limit_pln: b.income_limit_per_capita_pln ?? null,
  channel: b.channel, deadline_rule: b.deadline_rule,
  criteria: b.criteria, required_docs: b.required_documents ?? [],
  steps: b.steps, legal_basis: b.legal_basis,
  source_citations: b.source_citations,
  common_mistakes: b.common_mistakes ?? [],
})));
```

### 6. Przetestuj eligibility-engine
```bash
pnpm tsx eligibility-engine.ts
```
Zobaczysz output dla persony Anny — powinno wyświetlić poprawne statusy dla wszystkich 8 świadczeń.

### 7. Setup Expo
```bash
npx create-expo-app kidelo --template default
cd kidelo
npx expo install nativewind tailwindcss react-native-svg @supabase/supabase-js
npx expo install expo-notifications expo-secure-store react-native-mmkv
# ... reszta z STACK.md
```

### 8. Migracja prototypu HTML → React Native
Komponenty z `ui.jsx`, `main.jsx`, `details.jsx`, `auth.jsx` mapują się 1:1 na RN.
Co się zmienia:
- `<div>` → `<View>`
- `<button>` → `<Pressable>` lub `<TouchableOpacity>`
- `<span>` w listach → `<Text>`
- `onClick` → `onPress`
- `className` zostaje (NativeWind)
- SVG ikony — `react-native-svg` (dokładnie taki sam markup)
- inline styles → `style={{ ... }}` jak w RN

## Dlaczego dokładnie ten setup?

Czyste podejście pod **Twoje konkretne ograniczenia**: 4-5 paralelnych projektów, doświadczenie React/TypeScript/Supabase, potrzeba szybkiego deploymentu bez zatrudniania zespołu. Każda decyzja maksymalizuje Twoją osobistą prędkość, nie teoretyczną wydajność.

## Co jest poza scope tego pakietu

- Polityka prywatności + ToS (etap 5)
- Asset generation (ikony, screenshots) — etap 5
- Setup CI/CD pipeline — etap 2
- UI ekranów w React Native — etap 2/3

## Wsparcie aktualizacji prawnych

Świadczenia w PL zmieniają się minimum raz w roku (przede wszystkim okresy świadczeniowe i kwoty limitów). Sugerowane:

1. **Mechanizm aktualizacji `benefits.json`:** Hostuj plik w Supabase Storage lub jako static asset na CDN. Aplikacja sprawdza wersję przy każdym uruchomieniu (`_meta.version`), pobiera nową gdy jest dostępna. Bez konieczności release'u do Google Play.

2. **Subskrypcja na zmiany prawne:** Setup Google Alerts na "becikowe", "Aktywny Rodzic", "kosiniakowe", "rodzinny kapitał opiekuńczy". Setup RSS z gov.pl/web/rodzina.

3. **Roczna weryfikacja:** Każdego stycznia przejrzyj benefits.json pod kątem nowych kwot, terminów, ustaw nowelizacyjnych. Update `valid_to`, `last_verified`, `version`.

## Kontakt z infrastrukturą prawną

Jeżeli będziesz miał wątpliwości co do interpretacji któregoś świadczenia, są oficjalne źródła konsultacji:
- ZUS infolinia: 22 560 16 00 (dla świadczeń wypłacanych przez ZUS)
- Helpdesk PUE/eZUS: pomoc.pue@zus.pl
- Ministerstwo Rodziny: kancelaria@mrips.gov.pl
- Dla becikowego: bezpośrednio urząd gminy właściwy dla zameldowania

W bazie świadczeń każde ma `source_citations` z linkiem do najbardziej aktualnej oficjalnej strony — jak coś się zmienia, idź tam.

---

**Następny krok dla Ciebie:** Powiedz mi, czy chcesz teraz przejść do Etapu 1 (setup Supabase + uruchomienie fetch-nfz), czy najpierw chcesz omówić któryś element tego pakietu.
