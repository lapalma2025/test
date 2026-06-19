-- ============================================================================
-- seed-benefits.sql — wstawia 8 świadczeń do tabeli benefits.
-- Uruchom PO schema.sql, jako jeden blok w Supabase SQL Editor.
-- Bezpieczny do wielokrotnego uruchomienia (ON CONFLICT DO UPDATE).
-- ============================================================================

insert into public.benefits (
  id, slug, name, official_name, amount_pln, amount_display,
  unit, unit_display, income_means_tested, income_limit_pln,
  channel, deadline_rule, criteria, required_docs, steps,
  legal_basis, source_citations, common_mistakes,
  valid_from, valid_to
) values

-- 1. BECIKOWE
(
  'becikowe', 'becikowe', 'Becikowe',
  'Jednorazowa zapomoga z tytułu urodzenia się dziecka',
  1000, '1 000 zł',
  'one-time', 'jednorazowo',
  true, 1922,
  'Urząd gminy (USC, OPS) lub przez Emp@tię',
  '{"type":"after_birth_months","value":12,"description":"12 miesięcy od urodzenia dziecka"}'::jsonb,
  array[
    'Dochód netto rodziny ≤ 1 922 zł na osobę',
    'Matka pozostawała pod opieką medyczną od najpóźniej 10. tygodnia ciąży',
    'Wniosek złożony w ciągu 12 miesięcy od urodzenia dziecka'
  ],
  array[
    'Wniosek o jednorazową zapomogę (formularz gminny)',
    'Skrócony odpis aktu urodzenia dziecka',
    'Zaświadczenie lekarskie o opiece w ciąży od 10. tygodnia',
    'Oświadczenie o dochodach rodziny',
    'PIT-y członków rodziny za rok bazowy'
  ],
  array[
    'Pobierz zaświadczenie lekarskie o opiece medycznej w ciąży (od 10. tygodnia)',
    'Zarejestruj urodzenie dziecka w USC, odbierz skrócony akt urodzenia',
    'Wypełnij wniosek w urzędzie gminy lub przez Emp@tię',
    'Dołącz akt urodzenia, zaświadczenie lekarskie, dokumenty o dochodach',
    'Złóż w terminie 12 miesięcy od urodzenia dziecka'
  ],
  '{"act":"Ustawa z dnia 28 listopada 2003 r. o świadczeniach rodzinnych","journal":"Dz.U. 2003 nr 228 poz. 2255","article":"art. 15b","url":"https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20032282255"}'::jsonb,
  '[{"label":"Ministerstwo Rodziny — becikowe","url":"https://www.gov.pl/web/rodzina/jednorazowa-zapomoga-z-tytulu-urodzenia-sie-dziecka","verified":"2026-06-09"}]'::jsonb,
  array[
    'Brak zaświadczenia o opiece w ciąży od 10. tygodnia — automatyczne odrzucenie',
    'Złożenie po 12 miesiącach od urodzenia — utrata prawa',
    'Pominięcie dochodów partnera mieszkającego z matką dziecka'
  ],
  '2026-06-01'::date, '2027-05-31'::date
),

-- 2. RODZINA 800+
(
  '800plus', 'rodzina-800-plus', 'Rodzina 800+',
  'Świadczenie wychowawcze',
  800, '800 zł',
  'monthly', 'miesięcznie',
  false, null,
  'ZUS przez aplikację mZUS, PUE/eZUS, bankowość lub Emp@tię',
  '{"type":"after_birth_months","value":3,"description":"3 miesiące od urodzenia dla wyrównania od dnia urodzenia"}'::jsonb,
  array[
    'Dziecko do ukończenia 18. roku życia',
    'Wniosek składa jeden z rodziców',
    'Bez kryterium dochodowego',
    'Wniosek wyłącznie elektroniczny'
  ],
  array[
    'PESEL dziecka (po zarejestrowaniu w USC)',
    'Numer rachunku bankowego do wypłaty',
    'Akt urodzenia (jeśli ZUS poprosi)'
  ],
  array[
    'Zarejestruj urodzenie w USC, poczekaj na nadanie numeru PESEL',
    'Zaloguj się do mZUS, PUE/eZUS lub bankowości elektronicznej',
    'Wybierz wniosek SW-R (świadczenie wychowawcze)',
    'Wpisz dane dziecka i numer PESEL',
    'Podaj numer konta bankowego',
    'Złóż w ciągu 3 miesięcy od urodzenia, by mieć wyrównanie od dnia urodzenia'
  ],
  '{"act":"Ustawa z dnia 11 lutego 2016 r. o pomocy państwa w wychowywaniu dzieci","journal":"Dz.U. 2016 poz. 195","article":"art. 4","url":"https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20160000195"}'::jsonb,
  '[{"label":"ZUS — 800+","url":"https://www.zus.pl/swiadczenia/swiadczenia-dla-rodzin/swiadczenie-wychowawcze-800-plus","verified":"2026-06-09","key_quote":"Jeśli złożysz wniosek o świadczenie wychowawcze na nowo narodzone dziecko w ciągu 3 miesięcy od dnia urodzenia dziecka, otrzymasz świadczenie od dnia urodzenia dziecka."}]'::jsonb,
  array[
    'Złożenie wniosku przed nadaniem PESEL — automatyczne odrzucenie',
    'Spóźnienie powyżej 3 miesięcy — utrata wyrównania (do kilku tysięcy zł)',
    'Złożenie przez oboje rodziców gdy nie ma opieki naprzemiennej'
  ],
  '2026-06-01'::date, '2027-05-31'::date
),

-- 3. ZASIŁEK MACIERZYŃSKI
(
  'macierzynski', 'zasilek-macierzynski', 'Zasiłek macierzyński',
  'Zasiłek macierzyński za okres urlopu macierzyńskiego i rodzicielskiego',
  null, '100% / 81,5% / 70% wynagrodzenia',
  'monthly_based_on_salary', '% miesięcznego wynagrodzenia',
  false, null,
  'ZUS przez pracodawcę (UoP) lub bezpośrednio (B2B z chorobowym)',
  '{"type":"after_birth_days","value":21,"description":"21 dni od porodu dla wariantu 81,5% jednolitej stawki"}'::jsonb,
  array[
    'Tytuł do ubezpieczenia chorobowego (UoP, B2B z chorobowym, zlecenie z chorobowym)',
    'Co najmniej 1 dzień ubezpieczenia chorobowego przed porodem (UoP)',
    'Pełny miesiąc ubezpieczenia chorobowego przed porodem (B2B)'
  ],
  array[
    'Skrócony odpis aktu urodzenia dziecka',
    'Wniosek o urlop macierzyński/rodzicielski (u pracodawcy)',
    'Zaświadczenie Z-3 lub Z-3b (B2B)'
  ],
  array[
    'Zarejestruj urodzenie w USC, odbierz akt urodzenia',
    'W ciągu 21 dni od porodu złóż wniosek u pracodawcy o cały urlop — wariant 81,5%',
    'Lub: złóż wniosek tylko o macierzyński (100%), potem osobno o rodzicielski (70%)',
    'Pracodawca przekazuje dokumenty do ZUS, ZUS wypłaca zasiłek',
    'Dla B2B: złóż Z-3b bezpośrednio przez PUE/eZUS'
  ],
  '{"act":"Ustawa z dnia 25 czerwca 1999 r. o świadczeniach pieniężnych z ubezpieczenia społecznego w razie choroby i macierzyństwa","journal":"Dz.U. 1999 nr 60 poz. 636","article":"art. 29-31","url":"https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19990600636"}'::jsonb,
  '[{"label":"ZUS — zasiłek macierzyński","url":"https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski","verified":"2026-06-09"}]'::jsonb,
  array[
    'Spóźnienie powyżej 21 dni — utrata wariantu 81,5%',
    'B2B bez dobrowolnego chorobowego — brak prawa do zasiłku',
    '9 tygodni urlopu ojcowskiego rodzicielskiego — nieprzenoszalne na matkę'
  ],
  '2026-06-01'::date, '2027-05-31'::date
),

-- 4. KOSINIAKOWE
(
  'kosiniakowe', 'kosiniakowe', 'Świadczenie rodzicielskie (kosiniakowe)',
  'Świadczenie rodzicielskie',
  1000, '1 000 zł',
  'monthly', 'miesięcznie przez 52 tygodnie (1 dziecko)',
  false, null,
  'Urząd gminy (OPS) lub Emp@tia',
  '{"type":"after_birth_months","value":3,"description":"Wniosek w ciągu 3 miesięcy od urodzenia dla świadczenia od dnia urodzenia"}'::jsonb,
  array[
    'Brak prawa do zasiłku macierzyńskiego (studenci, bezrobotni, umowa o dzieło, B2B bez chorobowego)',
    'Świadczenie przysługuje matce; ojcu tylko w wyjątkowych przypadkach',
    'Nie łączy się z zasiłkiem macierzyńskim',
    'Bez kryterium dochodowego'
  ],
  array[
    'Wniosek o świadczenie rodzicielskie',
    'Skrócony odpis aktu urodzenia dziecka',
    'Dowód osobisty wnioskodawcy',
    'Numer konta bankowego'
  ],
  array[
    'Zarejestruj urodzenie w USC, odbierz akt urodzenia',
    'Wypełnij wniosek w urzędzie gminy lub przez Emp@tię',
    'Dołącz akt urodzenia, dane konta',
    'Świadczenie wypłacane przez 52 tygodnie (przy 1 dziecku)'
  ],
  '{"act":"Ustawa z dnia 28 listopada 2003 r. o świadczeniach rodzinnych","journal":"Dz.U. 2003 nr 228 poz. 2255","article":"art. 17c","url":"https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20032282255"}'::jsonb,
  '[{"label":"Ministerstwo Rodziny — świadczenie rodzicielskie","url":"https://www.gov.pl/web/rodzina/swiadczenie-rodzicielskie","verified":"2026-06-09"}]'::jsonb,
  array[
    'Próba łączenia z zasiłkiem macierzyńskim — nielegalne, zwrot z odsetkami',
    'Studentka z umową zlecenia BEZ chorobowego — kosiniakowe SIĘ należy'
  ],
  '2026-06-01'::date, '2027-05-31'::date
),

-- 5. AKTYWNI RODZICE W PRACY
(
  'aktywni-rodzice-w-pracy', 'aktywni-rodzice-w-pracy', 'Aktywni rodzice w pracy',
  'Świadczenie aktywni rodzice w pracy (program Aktywny Rodzic)',
  1500, '1 500 zł (1 900 zł z niepełnosprawnością)',
  'monthly', 'miesięcznie',
  false, null,
  'ZUS przez mZUS, PUE/eZUS, bankowość lub Emp@tię',
  '{"type":"child_age_months_range","value_min":12,"value_max":35,"description":"Dziecko 12-35 mies. Wniosek w 2 mies. = wyrównanie."}'::jsonb,
  array[
    'Dziecko w wieku 12-35 miesięcy',
    'Oboje rodzice aktywni zawodowo z minimalną podstawą wymiaru składek',
    'Nie łączy się z innymi świadczeniami z programu Aktywny Rodzic',
    'Wniosek wyłącznie elektroniczny'
  ],
  array['PESEL dziecka', 'Numer konta bankowego', 'Dane partnera (przy dwojgu rodziców)'],
  array[
    'Poczekaj do 12. miesiąca życia dziecka',
    'Upewnij się, że oboje rodzice mają aktywne ubezpieczenie z minimalną podstawą',
    'Złóż wniosek przez mZUS lub bankowość',
    'Wskaż numer konta, podaj dane drugiego rodzica'
  ],
  '{"act":"Ustawa z dnia 15 maja 2024 r. — Aktywny Rodzic","journal":"Dz.U. 2024 poz. 858","url":"https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20240000858"}'::jsonb,
  '[{"label":"ZUS — Aktywny Rodzic","url":"https://www.zus.pl/aktywnyrodzic","verified":"2026-06-09"}]'::jsonb,
  array[
    'Wniosek przed 12. miesiącem dziecka — odrzucenie',
    'Brak ubezpieczenia jednego z rodziców — utrata świadczenia',
    'Łączenie z Aktywnie w żłobku — trzeba wybrać jedno'
  ],
  '2026-06-01'::date, '2027-05-31'::date
),

-- 6. AKTYWNIE W ŻŁOBKU
(
  'aktywnie-w-zlobku', 'aktywnie-w-zlobku', 'Aktywnie w żłobku',
  'Świadczenie aktywnie w żłobku (program Aktywny Rodzic)',
  1500, 'do 1 500 zł (do 1 900 zł z niepełnosprawnością)',
  'monthly_capped_by_fee', 'miesięcznie, nie więcej niż opłata',
  false, null,
  'ZUS. Wypłata bezpośrednio do żłobka.',
  '{"type":"after_enrollment_months","value":2,"description":"Wniosek w 2 mies. od rozpoczęcia uczęszczania = wyrównanie"}'::jsonb,
  array[
    'Dziecko uczęszcza do żłobka/klubu/dziennego opiekuna wpisanego do rejestru',
    'Opłata za pobyt (bez wyżywienia) nie przekracza 2 200 zł/mies.',
    'Nie łączy się z innymi świadczeniami z programu Aktywny Rodzic',
    'Nie łączy się z RKO na to dziecko'
  ],
  array['PESEL dziecka', 'Numer placówki żłobka w rejestrze MRiPS', 'Numer konta żłobka'],
  array[
    'Zapisz dziecko do żłobka wpisanego do rejestru żłobków',
    'Sprawdź, że opłata za pobyt nie przekracza 2 200 zł',
    'Złóż wniosek przez mZUS w 2 mies. od rozpoczęcia',
    'Wskaż dane żłobka — ZUS wypłaca bezpośrednio na konto żłobka'
  ],
  '{"act":"Ustawa z dnia 15 maja 2024 r. — Aktywny Rodzic","journal":"Dz.U. 2024 poz. 858","url":"https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20240000858"}'::jsonb,
  '[{"label":"ZUS — Aktywnie w żłobku","url":"https://www.zus.pl/aktywnyrodzic/wiadczenie-aktywnie-w-zlobku","verified":"2026-06-09","key_quote":"Świadczenie wynosi do 1500 zł miesięcznie na dziecko."}]'::jsonb,
  array[
    'Wybór żłobka z opłatą >2200 zł — utrata całego świadczenia',
    'Spóźnienie powyżej 2 mies. — utrata wyrównania',
    'Pobieranie RKO na to samo dziecko — odrzucenie'
  ],
  '2026-06-01'::date, '2027-05-31'::date
),

-- 7. AKTYWNIE W DOMU
(
  'aktywnie-w-domu', 'aktywnie-w-domu', 'Aktywnie w domu',
  'Świadczenie aktywnie w domu (program Aktywny Rodzic)',
  500, '500 zł',
  'monthly', 'miesięcznie',
  false, null,
  'ZUS przez mZUS, PUE/eZUS, bankowość lub Emp@tię',
  '{"type":"child_age_months_range","value_min":12,"value_max":35,"description":"Dziecko 12-35 mies. Łącznie 12 000 zł przez 24 mies."}'::jsonb,
  array[
    'Dziecko w wieku 12-35 miesięcy',
    'Rodzice NIE pracują lub nie korzystają z dofinansowania do żłobka',
    'Alternatywa dla rodzin wybierających opiekę domową',
    'Nie łączy się z innymi świadczeniami z programu Aktywny Rodzic'
  ],
  array['PESEL dziecka', 'Numer konta bankowego rodzica'],
  array[
    'Poczekaj do 12. miesiąca życia dziecka',
    'Złóż wniosek przez mZUS',
    'Wskaż numer konta'
  ],
  '{"act":"Ustawa z dnia 15 maja 2024 r. — Aktywny Rodzic","journal":"Dz.U. 2024 poz. 858","url":"https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20240000858"}'::jsonb,
  '[{"label":"ZUS — Aktywnie w domu","url":"https://www.zus.pl/aktywnyrodzic","verified":"2026-06-09"}]'::jsonb,
  array[]::text[],
  '2026-06-01'::date, '2027-05-31'::date
),

-- 8. RKO
(
  'rko', 'rodzinny-kapital-opiekunczy', 'Rodzinny Kapitał Opiekuńczy (RKO)',
  'Rodzinny Kapitał Opiekuńczy',
  12000, '12 000 zł łącznie (500 × 24 lub 1 000 × 12)',
  'lump_sum_in_installments', 'łącznie, w ratach miesięcznych',
  false, null,
  'ZUS przez mZUS, PUE/eZUS, bankowość lub Emp@tię',
  '{"type":"child_age_months_range","value_min":12,"value_max":35,"description":"Drugie i kolejne dziecko 12-35 mies. Wniosek od 9. do 13. mies."}'::jsonb,
  array[
    'Drugie lub kolejne dziecko w rodzinie (NIE pierwsze)',
    'Dziecko w wieku 12-35 miesięcy',
    'Nie łączy się z Aktywnie w żłobku na to dziecko'
  ],
  array['PESEL dziecka', 'Numer konta bankowego'],
  array[
    'Drugie/kolejne dziecko musi mieć skończone 9 miesięcy',
    'Złóż wniosek przez mZUS przed ukończeniem 13. miesiąca',
    'Wybierz wariant: 500 zł × 24 mies. lub 1 000 zł × 12 mies.'
  ],
  '{"act":"Ustawa z dnia 17 listopada 2021 r. o rodzinnym kapitale opiekuńczym","journal":"Dz.U. 2021 poz. 2270","url":"https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20210002270"}'::jsonb,
  '[{"label":"ZUS — RKO","url":"https://www.zus.pl/swiadczenia/rodzinny-kapital-opiekunczy","verified":"2026-06-09"}]'::jsonb,
  array[
    'Próba pobrania RKO na pierwsze dziecko — odrzucenie',
    'Pobranie RKO + Aktywnie w żłobku na to samo dziecko — niezgodne',
    'Spóźnienie z wnioskiem po 13. miesiącu — częściowa utrata'
  ],
  '2026-06-01'::date, '2027-05-31'::date
)

on conflict (id) do update set
  name = excluded.name,
  official_name = excluded.official_name,
  amount_pln = excluded.amount_pln,
  amount_display = excluded.amount_display,
  unit = excluded.unit,
  unit_display = excluded.unit_display,
  income_means_tested = excluded.income_means_tested,
  income_limit_pln = excluded.income_limit_pln,
  channel = excluded.channel,
  deadline_rule = excluded.deadline_rule,
  criteria = excluded.criteria,
  required_docs = excluded.required_docs,
  steps = excluded.steps,
  legal_basis = excluded.legal_basis,
  source_citations = excluded.source_citations,
  common_mistakes = excluded.common_mistakes,
  valid_from = excluded.valid_from,
  valid_to = excluded.valid_to,
  updated_at = now();

-- Weryfikacja
select count(*) as benefits_count from public.benefits;
-- Powinno zwrócić: 8
