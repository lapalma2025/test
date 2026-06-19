# Kidelo — roadmapa wdrożenia produkcyjnego

> Aplikacja dla rodziców w Polsce (ciąża + pierwsze 3 lata): oś czasu, świadczenia, szkoły rodzenia, szpitale, checklisty.
> Cel: publikacja w Google Play (Android first, iOS w kolejnym etapie).

## Założenia strategiczne

**Co budujemy w MVP:**
- Personalizowana oś czasu od ciąży do 3 r.ż. (8 etapów)
- Eligibility checker świadczeń (becikowe, 800+, Aktywny Rodzic, kosiniakowe, macierzyński)
- Wyszukiwarka i porównywarka szkół rodzenia + szpitali położniczych z bazy NFZ
- Checklisty kontekstowe (USC, NFZ, mObywatel, pracodawca, pediatra)
- Push notifications dla deadline'ów
- Deep linki do mZUS, bankowości elektronicznej, Google Maps

**Czego NIE budujemy w MVP:**
- Czat z położną (B2B problem — Pregna Navigator już to ma)
- Marketplace usług (poza scope)
- Tracker ciąży tygodnia po tygodniu (Ciąża+ to robi lepiej; my dajemy unikalną wartość biurokratyczną)
- Społeczność / forum

**Stack technologiczny (uzasadnienie w STACK.md):**
- React Native + Expo SDK 50+ (TypeScript)
- NativeWind (Tailwind dla RN) — Michał zna stack z BNS
- Zustand (state) + React Query (server state)
- Supabase (Postgres + Auth + Storage + Edge Functions)
- EAS Build dla CI/CD i publikacji
- Sentry + PostHog dla monitoringu

**Koszt operacyjny startowy:** ~140 zł/rok (domena + Google Play Developer 25 USD jednorazowo). Skala: ~200-500 zł/mies przy 10k+ MAU (Supabase Pro, EAS Production).

---

## Etap 0 — Audyt i fundament prawny [TERAZ — 3-5 dni]

**Cel:** Mieć ZWERYFIKOWANE dane prawne i decyzje architektoniczne przed pisaniem jakiegokolwiek kodu produkcyjnego.

**Dostawy:**
- [x] `benefits.json` — zweryfikowana baza świadczeń z cytatami źródłowymi i datami obowiązywania
- [x] `AUDIT.md` — lista 12 nieścisłości w obecnym prototypie do naprawy
- [x] `STACK.md` — pełne uzasadnienie wyboru stosu z alternatywami
- [x] `ROADMAP.md` — ten dokument
- [ ] Konto Google Play Developer (25 USD, weryfikacja KYC ~5 dni)
- [ ] Domena `kidelo.pl` (jeśli wolna; check w PIIT)
- [ ] Repo Git + setup struktury monorepo (apps/mobile, packages/data, packages/ui)

**Kryteria zakończenia etapu:** Wszystkie kwoty świadczeń, terminy i kanały składania pokryte cytatami z gov.pl, zus.pl lub Dziennika Ustaw. Każde świadczenie ma `legal_basis` z ID ustawy lub rozporządzenia.

---

## Etap 1 — Backend i dane [1-2 tygodnie]

**Cel:** Mieć działającą bazę danych z realnymi szpitalami położniczymi z NFZ i schematem pod resztę.

**Dostawy:**
- Setup Supabase project (region: eu-central-1 / Frankfurt — RODO-friendly)
- Schemat tabel:
  - `hospitals` (id, name, address_full, lat, lng, voivodeship, city, beds, has_maternity, has_anesthesia, nfz_contract, source: "nfz" | "manual", external_id)
  - `birth_schools` (id, name, hospital_id NULL, address, lat, lng, type: "stationary"|"online"|"hybrid", is_nfz_free, price_pln, lang[], schedule, capacity)
  - `midwives` (id, name, registry_number, city, services[], source)
  - `benefits` (id, slug, name, amount_pln, unit, status_rule, channel, legal_basis, deadline_rule, criteria, steps[], updated_at)
  - `users` (id, email, created_at, deleted_at — soft delete dla RODO)
  - `user_profiles` (user_id, child_due_date | child_birth_date, employment, voivodeship, city, partner_included, first_child)
  - `user_progress` (user_id, task_id, status, completed_at)
- Skrypt ETL `scripts/fetch-nfz.ts` — pobiera placówki z NFZ Otwarte Dane (`api.nfz.gov.pl`), filtruje położnictwo, geocoduje przez Nominatim (free, rate-limit 1/s), wstawia do Supabase
- Supabase Auth: email + magic link + Google OAuth + Apple OAuth (RODO compliance: user może zażądać usunięcia)
- Row Level Security (RLS) policies dla `user_profiles` i `user_progress` — user widzi tylko swoje dane
- Edge function `eligibility-check` — odpala silnik eligibility przy zmianie profilu

**Kryteria zakończenia:** w `hospitals` jest ~500+ szpitali położniczych z całej Polski, w `benefits` 7 zweryfikowanych świadczeń, Auth działa, RLS przetestowane.

---

## Etap 2 — Setup mobile + design tokens [1 tydzień]

**Cel:** Działający szkielet aplikacji w Expo z designem ze prototypu.

**Dostawy:**
- `npx create-expo-app kidelo --template` z TypeScript
- NativeWind + Tailwind config z design tokens z prototypu (`cream #FAF7F2`, `sage #7C9082`, `evergreen #3D5147`, `terracotta #C97B5A`, `blush #E8B4A0`, `mustard #D4915B`, `ink #2C3530`)
- Fonty przez Expo Font: Newsreader (display serif), Geist (sans), Geist Mono
- React Navigation 7 z Bottom Tabs (5 tabów: Trasa, Szkoły, Pieniądze, Lista, Profil) + Stack dla detali
- Komponenty bazowe (port z prototypu):
  - `Button` (primary/light/full variants)
  - `Card`, `Chip`, `Pill`, `Kicker`, `SectionHead`, `IconBadge`
  - `Toggle`, `Checkbox`, `Progress`, `Stars`, `Avatar`, `Field`
  - `TopBar`, `BottomNav`
- Custom icon set — port z `icons.jsx` jako React Native SVG (`react-native-svg`)
- Splash screen + adaptive icon (Android), wszystko na cream backgroundzie z monogramem K
- Dark mode (auto-switch — evergreen + cream-dark)

**Kryteria zakończenia:** odpalasz `npx expo start`, widzisz pustą aplikację z nawigacją między 5 zakładkami, design tokens odpowiadają prototypowi 1:1.

---

## Etap 3 — Onboarding + silnik eligibility + Trasa [2 tygodnie]

**Cel:** Działająca personalizacja — user przechodzi onboarding, dostaje spersonalizowaną oś czasu z prawdziwymi datami.

**Dostawy:**
- Onboarding wizard (5 kroków: etap ciąży/po porodzie, parzystość, zatrudnienie, lokalizacja, partner)
- Persystencja onboardingu w MMKV (`react-native-mmkv` — szybsze niż AsyncStorage)
- Silnik `eligibility-engine.ts` jako czysta funkcja:
  ```ts
  function checkEligibility(profile: UserProfile): BenefitResult[]
  ```
  Zwraca dla każdego świadczenia: status (`eligible|action|active|future|na`), kwotę spersonalizowaną, deadline jako Date, kanał składania.
- Silnik `timeline-generator.ts` — generuje oś czasu z konkretnymi datami:
  - Termin porodu (jeśli ciąża) lub data urodzenia (jeśli po porodzie)
  - 21 dni od porodu = deadline USC, 21 dni = wniosek o macierzyński 100%
  - 3 miesiące od porodu = deadline 800+ z wyrównaniem
  - 12 miesięcy od porodu = deadline becikowe
  - 12 miesiąc życia = otwarcie Aktywny Rodzic
  - 35 miesiąc życia = koniec Aktywny Rodzic
- Ekran "Trasa" z hero card (1 pilna akcja teraz), listą "Następne 30 dni", summary "Należy Ci się X zł"
- Lokalne notyfikacje (Expo Notifications) na 7 dni przed deadlinem każdego świadczenia
- Unit testy dla `eligibility-engine` (Jest) — 20+ scenariuszy: pracująca mama UoP, B2B, student, bez pracy, niepełnosprawne dziecko, opieka naprzemienna, drugie dziecko etc.

**Kryteria zakończenia:** user wprowadza datę porodu = 26 maja 2026, UoP, woj. mazowieckie → widzi konkretne deadline'y per świadczenie i poprawne kwoty.

---

## Etap 4 — Moduły szczegółowe [2 tygodnie]

**Cel:** Pełna funkcjonalność wszystkich 5 zakładek.

**Dostawy:**
- **Szkoły / szpitale:**
  - Search (debounced, fuse.js dla fuzzy matching)
  - Filtry: miasto, online/stacjonarna/szpital, NFZ-bezpłatna, język
  - Lista wirtualizowana (`@shopify/flash-list`)
  - Detail screen z mapą (`react-native-maps`) i deep link do Google Maps
  - Porównywarka 2-3 placówek (tabela cech)
- **Pieniądze:**
  - Hero "Należy Ci się X zł" wyliczone z silnika
  - Lista świadczeń z badge'ami statusu
  - Detail screen: opis, kryteria, krok po kroku, deep link do mZUS / bankowości
  - Deep linki:
    - mZUS: `mzus://wniosek/sw-r` (Android intent fallback do sklepu Google Play)
    - PKO IKO: `iko://e-urzad/rodzina-800` (jeśli wspierane, fallback do iko.pkobp.pl)
    - Emp@tia: `https://empatia.mpips.gov.pl/`
- **Lista:**
  - 5 checklist kontekstowych (USC, Praca, mObywatel, Pediatra, Torba)
  - Auto-aktywacja zależnie od etapu (na podstawie daty urodzenia)
  - Progress per checklista
  - Wykonane / Aktywne sekcje
- **Profil:**
  - Edycja danych użytkownika
  - Dodawanie / usuwanie partnera
  - Dane dziecka (imię, data urodzenia, PESEL — opcjonalnie, never sent to server bez wyraźnej zgody)
  - Powiadomienia (toggle per kategoria)
  - Eksport danych (RODO art. 20)
  - Usuń konto (RODO art. 17 — soft delete + hard delete po 30 dniach)

**Kryteria zakończenia:** pełen happy path działa od onboardingu do złożenia wniosku przez mZUS deep link.

---

## Etap 5 — Polish, testy, Play Store [2 tygodnie]

**Cel:** Aplikacja gotowa do publikacji.

**Dostawy:**
- **Polityka prywatności i ToS** — RODO compliant, po polsku i angielsku. Wymagane przez Google Play od 2024. Wzorzec: prywatność.kidelo.pl, regulamin.kidelo.pl.
- **E2E testy** Maestro:
  - Onboarding → Trasa
  - Wybór szkoły → porównanie → wybór
  - Wniosek o 800+ → deep link mZUS
  - Toggle checklisty USC
  - Edycja profilu → zmiana powiadomień
- **Asset generation:**
  - Ikonka adaptywna 1024x1024 (foreground + background)
  - Splash screen 1290x2796 + warianty
  - 8 screenshotów Play Store (po polsku i angielsku)
  - Feature graphic 1024x500
  - Promo video 30 sekund (opcjonalne)
- **Play Console setup:**
  - Listing aplikacji (opis, screenshoty, kategoria: Parenting)
  - Data safety form (co zbieramy, co udostępniamy)
  - Content rating (IARC questionnaire — wynik: PEGI 3 / Everyone)
  - Target audience: Adults
  - Privacy Policy URL
- **Build + Deploy pipeline:**
  - EAS Build production profile
  - EAS Submit do Internal Testing
  - 10 testerów internal (rodzina, znajomi)
  - 50 testerów closed beta (Facebook grupy mam w Wrocławiu)
  - Po 2 tygodniach feedbacku → Production rollout 10% → 50% → 100%
- **Monitoring:**
  - Sentry source maps upload via EAS post-build hook
  - PostHog events: onboarding_completed, benefit_opened, deep_link_clicked, checklist_item_done
  - Alerty Sentry → Slack/Discord/email Michała

**Kryteria zakończenia:** Aplikacja na produkcji w Google Play, monitoring działa, pierwsi userzy z bety.

---

## Etap 6 (post-MVP) — Skala i monetyzacja [bieżąco]

**Co dorzucamy po MVP:**
- iOS App Store (1-2 tygodnie pracy bo Expo cross-platform)
- Tryb partnerski (drugi rodzic ma własną podpiętą sesję)
- AI chat ("zapytaj o świadczenia") — Anthropic Claude API z polskim system promptem
- RPWDL 2.0 API integration (kiedy CeZ wypuści publiczne API)
- Affiliate / B2B revenue:
  - Lead-gen do banków za konto dla dziecka (PKO Junior, Pekao Mój Skarb)
  - Lead-gen do ubezpieczycieli (NNW, polisy posagowe)
  - Płatne listing dla prywatnych szkół rodzenia (model Pregna Navigator)
- Wersja językowa: UA (ukraińska), EN (ekspaci w PL) — duża, niedoobsłużona nisza
- White-label dla banku jako moduł "asystent rodzica" (B2B sale)

---

## Realistyczna oś czasowa dla Michała

Zakładając Michała ~15-20h/tydzień (z równoległą pracą w BNS, AgroSmartLab, PPLA Academy):

| Etap | Pełny etat | Realnie u Ciebie |
|------|------------|------------------|
| 0 — Audyt | 3-5 dni | 1-2 tygodnie |
| 1 — Backend | 1-2 tyg | 3-4 tygodnie |
| 2 — Setup mobile | 1 tyg | 2 tygodnie |
| 3 — Onboarding + engine | 2 tyg | 4 tygodnie |
| 4 — Moduły | 2 tyg | 4 tygodnie |
| 5 — Polish + Play | 2 tyg | 3-4 tygodnie |
| **Razem** | **~10 tyg** | **~17-20 tygodni (~4-5 miesięcy)** |

To jest okno: koniec 2026 — początek 2027 z Play Store launch'em.

## Co dzisiaj otrzymujesz w Etapie 0

1. **`ROADMAP.md`** (ten plik)
2. **`benefits.json`** — produkcyjna, zweryfikowana baza świadczeń z cytatami źródłowymi
3. **`AUDIT.md`** — lista nieścisłości w obecnym prototypie do naprawy
4. **`STACK.md`** — uzasadnienie wyboru technologii
5. **`fetch-nfz.ts`** — kompletny skrypt Node/TS pobierający szpitale położnicze z NFZ Open API
6. **`schema.sql`** — schemat Supabase Postgres gotowy do skopiowania

**Następny krok po przeczytaniu:** powiedz mi, czy stack OK, czy wolisz alternatywę (np. Flutter zamiast RN), i ruszamy z Etapem 1 — setup Supabase + run fetch-nfz.
