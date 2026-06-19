# Kidelo — audyt prototypu (data.js)

> Lista 12 nieścisłości merytorycznych w obecnym prototypie do naprawy przed wyjściem na produkcję. Każda pozycja ma: opis problemu, źródło, propozycję poprawki.

## Krytyczne (mylące prawnie)

### 1. Etap T1 hero — błąd o becikowym

**Aktualnie:**
```
"pierwsza wizyta do 10. tygodnia daje prawo do becikowego"
```

**Problem:** Becikowe wymaga, by matka **pozostawała pod opieką medyczną od najpóźniej 10. tygodnia ciąży** (czyli regularne wizyty), nie jednorazowej pierwszej wizyty. To istotna różnica — można zdarzyć się, że ktoś zrobi jedną wizytę przed 10. tygodniem i myśli, że ma "haczyk".

**Źródło:** Ustawa z dnia 28 listopada 2003 r. o świadczeniach rodzinnych, art. 15b ust. 5.

**Poprawka:**
```
"pozostawanie pod opieką lekarską od 10. tygodnia ciąży to warunek becikowego"
```

### 2. Etap T3 hero — błąd o macierzyńskim 100%

**Aktualnie:**
```
"Złóż wniosek o urlop macierzyński — zasiłek 100% jeśli złożysz w ciągu 21 dni od porodu"
```

**Problem:** To jest dokładnie odwrotnie. **21 dni od porodu to warunek wariantu uśrednionego 81,5%** (wniosek o cały urlop macierzyński + rodzicielski razem). Wariant 100% dotyczy tylko macierzyńskiego (20 tygodni), potem rodzicielski jest 70%.

**Źródło:** Ustawa z dnia 25 czerwca 1999 r. o świadczeniach pieniężnych z ubezpieczenia społecznego w razie choroby i macierzyństwa, art. 31.

**Poprawka:**
```
"Wniosek o cały urlop w 21 dni = jednolite 81,5%. Inaczej 100% za macierzyński, 70% za rodzicielski."
```

### 3. Brak świadczenia — RKO (Rodzinny Kapitał Opiekuńczy)

**Aktualnie:** Brak w `benefits[]`.

**Problem:** RKO to ważne świadczenie 12 000 zł dla drugiego i kolejnego dziecka (12-35 mies.). Aplikacja musi je obsługiwać bo Michał targetuje też rodziców drugiego dziecka.

**Źródło:** Ustawa z dnia 17 listopada 2021 r. o rodzinnym kapitale opiekuńczym, Dz.U. 2021 poz. 2270.

**Poprawka:** Dodać w `benefits.json` (już zrobione).

### 4. Brak świadczenia — Aktywnie w domu

**Aktualnie:** Brak w `benefits[]`.

**Problem:** Trzeci wariant z programu Aktywny Rodzic (500 zł/mies, 12-35 mies, dla rodziców niepracujących). Bez tego rodzic z B2B na pauzie lub bez pracy traci 12 000 zł info.

**Poprawka:** Dodano w `benefits.json`.

## Wysokiej wagi (pomyłki ekspertskie)

### 5. Nazwa "Aktywny Rodzic w pracy"

**Aktualnie:**
```
name: "Aktywny Rodzic w pracy"
```

**Problem:** Oficjalna nazwa wg ustawy to **"Aktywni rodzice w pracy"** (liczba mnoga, bo wymaga aktywności obojga). Drobiazg, ale ważny dla SEO i wiarygodności.

**Źródło:** Ustawa z dnia 15 maja 2024 r. o wspieraniu rodziców w aktywności zawodowej i wychowaniu dziecka, Dz.U. 2024 poz. 858.

### 6. Zasiłek macierzyński — brak wariantu 70%

**Aktualnie:**
```
amount: "100% / 81,5%"
```

**Problem:** Niepełna informacja. Powinno być **100% / 81,5% / 70%** — trzy warianty:
- 100% — tylko macierzyński (20 tyg.) bez wniosku o rodzicielski
- 81,5% — wniosek o wszystko w 21 dni
- 70% — rodzicielski (32 tyg.) jeśli wybrano wariant 100% za macierzyński

**Poprawka:** Trzy warianty wyświetlane jasno w detail screen z kalkulatorem.

### 7. Etap D8-30 hero — "termin mija 9 czerwca"

**Aktualnie:**
```
note: "zostało 7 dni — termin mija 9 czerwca",
```

**Problem:** Hardcodowana data 9 czerwca 2026. To data w PRZESZŁOŚCI (dzisiaj jest 10 czerwca). Persona Anna urodziła 26 maja, czyli powinien jej zostać deadline 16 czerwca 2026 (21 dni od porodu).

**Poprawka:** W produkcji daty wyliczane z `timeline-generator.ts` na bazie `babyBorn`.

### 8. Becikowe — kryterium dochodowe niewidoczne

**Aktualnie:** Brak informacji o kryterium dochodowym (1 922 zł netto na osobę) w karcie świadczenia w `stages[].next`.

**Problem:** User ze średnimi zarobkami widzi "1000 zł, masz czas do 26 maja 2027" i myśli, że dostanie. Po wypełnieniu wniosku okazuje się, że nie. Frustracja → 1-gwiazdkowa recenzja.

**Poprawka:** Eligibility engine musi pytać o dochód w onboardingu (lub estymować z formy zatrudnienia + województwa), potem dla becikowego wyświetlać `status: "na"` zamiast `"eligible"` jeśli dochód przekracza próg.

### 9. Kosiniakowe — `status: "na"` zahardkodowany w prototypie

**Aktualnie:**
```js
kosiniakowe: { status: "na" }
```

**Problem:** To jest hardcoded `nie dotyczy` bo persona ma UoP. Ale dla studenta lub osoby bez pracy będzie `eligible`. Engine musi to dynamicznie wyliczać.

**Poprawka:** `eligibility-engine.ts` zwraca status na podstawie `profile.employment`.

## Średnio krytyczne (poprawić, ale nie blocker)

### 10. Wszystkie szkoły/szpitale w `schools[]` są fake

**Aktualnie:** 5 placówek wymyślonych (Bocian, Mamaville, Well Online, św. Zofii, Centrum Rodzinnie).

**Problem:** W produkcji muszą być realne placówki z NFZ Open API. Persona-demo OK, ale base do startu = fetch + manual seeding ~50 szkół rodzenia w 5 największych miastach.

**Poprawka:** `fetch-nfz.ts` (dostarczam) + manual seed prywatnych szkół rodzenia.

### 11. Liczby opinii sfabrykowane

**Aktualnie:**
```
reviews: 214, 389, 1120, 942, 156
```

**Problem:** W produkcji albo (a) Google Places ratings (legalnie wymaga branding "Reviews powered by Google"), albo (b) własny system opinii (start: 0 opinii). Pokazywanie wymyślonych — ryzyko prawne i nieuczciwe.

**Poprawka:** W MVP: ukryć rating gdy brak danych. Etap 6: Google Places z proper branding lub własny system.

### 12. Etap D31-180 money — "9 600 zł do końca roku"

**Aktualnie:**
```
amount: "9 600 zł",
caption: "z 800+ do końca roku"
```

**Problem:** Matematyka się zgadza (800 × 12 = 9 600) ale słowo "rok" jest mylące — chodzi o **pierwszy rok dziecka**, nie rok kalendarzowy. User w grudniu pomyśli "do końca grudnia".

**Poprawka:**
```
caption: "z 800+ przez pierwszy rok Mai"
```

## Podsumowanie

| # | Severity | Problem | Status |
|---|----------|---------|--------|
| 1 | KRYT | Becikowe — opieka od 10 tyg, nie pierwsza wizyta | Do poprawy |
| 2 | KRYT | Macierzyński 100% vs 81,5% pomylone | Do poprawy |
| 3 | KRYT | Brak RKO | ✅ Dodane w benefits.json |
| 4 | KRYT | Brak Aktywnie w domu | ✅ Dodane w benefits.json |
| 5 | WYS | Nazwa "Aktywny Rodzic w pracy" | Do poprawy |
| 6 | WYS | Brak wariantu 70% zasiłku | Do poprawy |
| 7 | WYS | Daty hardcoded | Wymaga timeline-generator |
| 8 | WYS | Becikowe bez kryterium dochodowego | Wymaga eligibility-engine |
| 9 | ŚR | Kosiniakowe status hardcoded | Wymaga eligibility-engine |
| 10 | ŚR | Schools fake | Wymaga fetch-nfz |
| 11 | ŚR | Opinie wymyślone | UI: ukryj gdy brak |
| 12 | NIS | "Do końca roku" mylące | Drobna edycja tekstu |

**4 z 12 załatwione na poziomie danych.** Pozostałe 8 wymagają pracy w Etapie 3 (silnik eligibility + timeline generator) i Etapie 4 (UI poprawki).

Po naprawie tych 12 punktów aplikacja będzie merytorycznie czysta i nie spali Ci pierwszego rocznika userów na pomyłkach prawnych.
