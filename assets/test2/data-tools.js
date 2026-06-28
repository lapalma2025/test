/* Kidelo — dane narzędzi. window.KIDELO_TOOLS */
(function () {
  "use strict";

  // Tygodnie ciąży — reprezentatywne kamienie milowe (owoc + rozwój + objawy + wskazówka).
  const weeks = [
    { w: 8, fruit: "Malina", len: "1,6 cm", wt: "1 g",
      baby: "Powstają zawiązki rączek i nóżek, serce bije ok. 150 razy na minutę.",
      mom: "Poranne mdłości, tkliwość piersi i ogromna senność to teraz norma.",
      tip: "Zacznij przyjmować kwas foliowy i witaminę D, jeśli jeszcze tego nie robisz." },
    { w: 12, fruit: "Limonka", len: "5,4 cm", wt: "14 g",
      baby: "Wykształciły się wszystkie narządy, dziecko zaczyna się ruszać i połykać.",
      mom: "Kończy się pierwszy trymestr — mdłości zwykle ustępują, wraca energia.",
      tip: "Czas na badanie USG genetyczne (11.–14. tydzień) i test PAPP-A." },
    { w: 16, fruit: "Awokado", len: "11,6 cm", wt: "100 g",
      baby: "Dziecko słyszy pierwsze dźwięki, ćwiczy mimikę i chwyta pępowinę.",
      mom: "Brzuch zaczyna być widoczny, część mam czuje pierwsze delikatne ruchy.",
      tip: "Zaplanuj USG połówkowe na 18.–22. tydzień — to najważniejsze badanie." },
    { w: 20, fruit: "Banan", len: "25 cm", wt: "300 g",
      baby: "Półmetek ciąży. Dziecko ma odciski palców i rytm snu i czuwania.",
      mom: "Ruchy są już wyraźne. Może pojawić się zgaga i ból krzyża.",
      tip: "Dobry moment, by rozejrzeć się za szkołą rodzenia — miejsca znikają szybko." },
    { w: 24, fruit: "Kukurydza", len: "30 cm", wt: "600 g",
      baby: "Płuca dojrzewają, dziecko reaguje na głos mamy i dotyk brzucha.",
      mom: "Brzuch rośnie szybko, skóra się napina — pomaga nawilżanie i picie wody.",
      tip: "Między 24. a 28. tygodniem wykonaj test obciążenia glukozą (OGTT)." },
    { w: 28, fruit: "Bakłażan", len: "37 cm", wt: "1 kg",
      baby: "Otwiera oczy, ćwiczy oddychanie. Zaczyna się trzeci trymestr.",
      mom: "Częstsze wizyty u ginekologa, możliwe obrzęki nóg i bezsenność.",
      tip: "Od teraz warto liczyć ruchy dziecka — skorzystaj z trackera kopnięć." },
    { w: 32, fruit: "Kapusta", len: "42 cm", wt: "1,7 kg",
      baby: "Dziecko układa się głową w dół i przybiera na wadze prawie 200 g/tydzień.",
      mom: "Coraz trudniej o wygodną pozycję, pojawiają się skurcze Braxtona-Hicksa.",
      tip: "Zacznij kompletować torbę do szpitala i plan porodu." },
    { w: 36, fruit: "Sałata", len: "47 cm", wt: "2,6 kg",
      baby: "Dziecko jest już prawie gotowe — dojrzewają płuca i układ odpornościowy.",
      mom: "Główka może obniżyć się do miednicy, oddycha się łatwiej, ale częściej do toalety.",
      tip: "Złóż wniosek o urlop macierzyński i spakuj dokumenty do szpitala." },
    { w: 40, fruit: "Arbuz", len: "51 cm", wt: "3,4 kg",
      baby: "Termin porodu. Dziecko jest w pełni rozwinięte i gotowe na spotkanie.",
      mom: "Wyczekiwanie. Obserwuj skurcze i odejście wód — i odpoczywaj.",
      tip: "Gdy skurcze są regularne co 5 minut przez godzinę — czas jechać do szpitala." },
  ];

  // Kalendarz szczepień (GIS, uproszczony obowiązkowy). status: done | upcoming | future
  const vaccines = [
    { id: "v0", age: "do 24h po urodzeniu", when: "26 maja 2026", done: true,
      shots: ["WZW typu B (1. dawka)", "Gruźlica (BCG)"] },
    { id: "v1", age: "6.–8. tydzień życia", when: "ok. 7 lipca 2026", done: false, next: true,
      shots: ["Błonica, tężec, krztusiec (DTP)", "WZW B (2. dawka)", "Hib", "Pneumokoki", "Polio (IPV)", "Rotawirusy"] },
    { id: "v2", age: "3.–4. miesiąc", when: "ok. 26 sierpnia 2026", done: false,
      shots: ["DTP (2. dawka)", "Hib", "Pneumokoki", "Polio", "Rotawirusy"] },
    { id: "v3", age: "5.–6. miesiąc", when: "ok. 26 października 2026", done: false,
      shots: ["DTP (3. dawka)", "WZW B (3. dawka)", "Hib", "Polio", "Rotawirusy"] },
    { id: "v4", age: "13.–15. miesiąc", when: "ok. czerwiec 2027", done: false,
      shots: ["Odra, świnka, różyczka (MMR)", "Pneumokoki (dawka uzupełniająca)"] },
    { id: "v5", age: "16.–18. miesiąc", when: "ok. wrzesień 2027", done: false,
      shots: ["DTP (4. dawka)", "Hib", "Polio"] },
  ];

  // Dziennik badań — zasiew kilku wyników z oceną normy.
  const tests = [
    { id: "b1", name: "Morfologia — hemoglobina", value: "12,4", unit: "g/dl", range: "11,5–15,0", ok: true, date: "20 maja 2026" },
    { id: "b2", name: "Glukoza na czczo", value: "84", unit: "mg/dl", range: "70–92", ok: true, date: "20 maja 2026" },
    { id: "b3", name: "TSH", value: "3,8", unit: "mIU/l", range: "0,4–2,5", ok: false, date: "20 maja 2026" },
    { id: "b4", name: "Ferrytyna", value: "18", unit: "ng/ml", range: "30–200", ok: false, date: "6 maja 2026" },
    { id: "b5", name: "Witamina D (25-OH)", value: "34", unit: "ng/ml", range: "30–50", ok: true, date: "6 maja 2026" },
  ];

  // Notatki — wizyty, pytania do lekarza.
  const notes = [
    { id: "n1", kind: "Pytanie do lekarza", title: "Zapytać o suplementację żelaza", body: "Ferrytyna 18 — zapytać czy włączyć preparat i jaki.", date: "wczoraj", color: "clay" },
    { id: "n2", kind: "Wizyta", title: "Patronaż położnej", body: "Maja waży 3,6 kg, przybiera prawidłowo. Pępek goi się ładnie. Następna wizyta za 3 dni.", date: "8 czerwca", color: "sage" },
    { id: "n3", kind: "Notatka", title: "Pytania na bilans", body: "Kolka wieczorami — co pomaga? Witamina D dawkowanie. Kiedy pierwsza wizyta u pediatry.", date: "7 czerwca", color: "sand" },
  ];

  window.KIDELO_TOOLS = { weeks, vaccines, tests, notes, defaultWeek: 4 /* idx -> tydz. 24 */ };
})();
