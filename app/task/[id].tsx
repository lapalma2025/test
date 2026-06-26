import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Icon, Pill } from '@/components/ui';
import { colors } from '@/theme/tokens';

const TASK_CONTENT: Record<string, any> = {
  usc: {
    title: 'Zarejestruj urodzenie w USC',
    pill: '21 dni od porodu',
    pillTone: 'clay',
    intro: 'Masz 21 dni od porodu na zgłoszenie urodzenia dziecka w Urzędzie Stanu Cywilnego. Bez aktu urodzenia nie złożysz wniosku o 800+ ani becikowego. Od 2024 roku szpital automatycznie przesyła Kartę Urodzenia do USC w ciągu 3 dni — nie musisz jej dostarczać osobiście.',
    docs: [
      'Karta urodzenia ze szpitala (przesyłana przez szpital do USC automatycznie)',
      'Dowody osobiste obojga rodziców',
      'Akt małżeństwa (jeśli jesteście małżeństwem)',
      'Login do mObywatela lub e-dowód (jeśli rejestrujesz online)',
    ],
    steps: [
      'Poczekaj 3 dni — szpital automatycznie wysyła Kartę Urodzenia do USC',
      'Zgłoś urodzenie online przez gov.pl lub osobiście w USC właściwym dla miejsca urodzenia',
      'Urząd sporządza akt urodzenia i automatycznie nadaje numer PESEL następnego dnia',
      'Dziecko zostaje zameldowane pod Twoim adresem automatycznie',
      'Odbierz skrócony odpis aktu urodzenia (bezpłatnie)',
      'Jeśli nie jesteś żonaty z matką — złóż oświadczenie o uznaniu ojcostwa przy tej samej wizycie',
    ],
    tip: 'Uwaga: jeśli nie zarejestrujesz dziecka w terminie 21 dni, kierownik USC zrobi to sam i nada imię według własnego wyboru.',
  },
  torba: {
    title: 'Spakuj torbę do szpitala',
    pill: 'gotowa od 34–36. tygodnia',
    pillTone: 'sand',
    intro: 'Najlepiej spakować torbę między 34. a 36. tygodniem ciąży — torba powinna stać gotowa w przedpokoju lub bagażniku. Każdy szpital może mieć własną listę, sprawdź na stronie wybranej placówki. Podziel pakowanie na 4 sekcje.',
    docs: [],
    steps: [
      'MAMA — CZAS PORODU: luźna koszula porodowa, klapki pod prysznic, ciepłe skarpetki, gumka do włosów, balsam do ust, butelka wody z dzióbkiem, drobne przekąski',
      'MAMA — POBYT PO PORODZIE: 2–3 koszule nocne lub luźne koszulki, szlafrok, kilka par majtek poporodowych lub jednorazowych, biustonosza do karmienia, wkładki laktacyjne, ręczniki, kosmetyczka, podkłady poporodowe, duże podpaski, ładowarka do telefonu',
      'DZIECKO: 3–4 body w rozmiarze 56 lub 62 (wcześniej wyprane), 3–4 pajacyki lub śpiochów, czapeczka, skarpetki, kocyk lub rożek, paczka pieluszek jednorazowych rozmiar 0 lub 1, chusteczki nawilżane',
      'DOKUMENTY: dowód tożsamości, karta ciąży, wyniki badań z ostatnich tygodni, plan porodu (opcjonalnie)',
      'DLA OJCA: woda i przekąski na kilka godzin, ładowarka i powerbank, bluza lub koszulka na zmianę, szczoteczka do zębów, drobne pieniądze i karta',
    ],
    tip: 'Kiedy torba jest spakowana, zapamiętaj gdzie co leży — podczas porodu partnerka może prosić o konkretne rzeczy, np. gumkę lub wodę.',
  },
  badania: {
    title: 'Pierwsze badania w ciąży',
    pill: '6.–10. tydzień ciąży',
    pillTone: 'sage',
    intro: 'Pierwsza wizyta u ginekologa to start kalendarza badań. Lekarz zleca zestaw badań „startowych" — standardowy przegląd zdrowia. Większość można wykonać bezpłatnie w ramach NFZ.',
    docs: [
      'Dowód tożsamości + nr PESEL',
      'Karta ciąży (zostanie wystawiona na pierwszej wizycie)',
      'Ewentualne wcześniejsze wyniki badań',
    ],
    steps: [
      'I TRYMESTR (6–10 tydz.): morfologia krwi, grupa krwi i czynnik Rh, glukoza na czczo, TSH (tarczyca), badanie moczu',
      'I TRYMESTR (6–10 tydz.): badania w kierunku infekcji — HIV, HCV, HBsAg (WZW B), kiła (VDRL)',
      'I TRYMESTR (6–10 tydz.): odporność — toksoplazmoza IgG/IgM, różyczka IgG/IgM, cytomegalia CMV',
      '11.–14. tydz.: USG I trymestru — ocena rozwoju płodu, pomiar przezierności karkowej',
      '11.–14. tydz.: test PAPP-A — badanie przesiewowe wad chromosomalnych (refundowane od 2023 r.)',
      'II TRYMESTR (18–22 tydz.): USG połówkowe — szczegółowa ocena anatomii dziecka',
      '24.–28. tydz.: test OGTT (krzywa cukrowa) — wykrycie cukrzycy ciążowej',
      '35.–37. tydz.: posiew GBS — badanie w kierunku paciorkowca grupy B',
    ],
    tip: 'Twoja rola: pamiętaj o datach ważniejszych badań, zabieraj wyniki na każdą wizytę. USG połówkowe (18–22 tydz.) to moment, kiedy zobaczysz dziecko wyraźnie — warto być razem.',
  },
  usg: {
    title: 'USG połówkowe — ważne badanie',
    pill: '18.–22. tydzień',
    pillTone: 'sage',
    intro: 'USG połówkowe to jedno z najważniejszych badań w całej ciąży. Lekarz bardzo dokładnie ocenia anatomię dziecka — serce, mózg, kręgosłup, kończyny. Dla rodziców to często najbardziej emocjonujące badanie, bo widać już małego człowieka — jego głowę, dłonie, ruchy.',
    docs: [
      'Karta ciąży ze wszystkimi dotychczasowymi wynikami',
      'Skierowanie od ginekologa prowadzącego',
    ],
    steps: [
      'Zrób listę pytań do lekarza — możesz zapytać o płeć dziecka, ruchy, pozycję',
      'Badanie trwa zazwyczaj 20–40 minut — lekarz mierzy wiele parametrów',
      'Większość wad wrodzonych widocznych w USG ujawnia się właśnie na tym etapie',
      'Po badaniu lekarz zleci kolejne badania laboratoryjne: morfologię i badanie moczu',
      'Zachowaj wydruk i nagranie z badania',
    ],
    tip: 'To też dobry moment, żeby oboje przyjrzeć się ruchom dziecka i poczuć, że „naprawdę ktoś tam mieszka". Wiele par opisuje USG połówkowe jako przełomowy moment — wcześniej mały człowiek był abstrakcją, teraz widać go wyraźnie.',
  },
  szpital: {
    title: 'Wybierz szpital do porodu',
    pill: 'decyzja do 30. tygodnia',
    pillTone: 'sand',
    intro: 'Wybór szpitala to jedna z pierwszych konkretnych decyzji, w której możesz aktywnie wziąć udział. Nie ma jednego „najlepszego szpitala" — ważne są trzy rzeczy: kompetentny personel, poczucie bezpieczeństwa matki i rozsądna odległość od domu.',
    docs: [],
    steps: [
      'Sprawdź szpitale w swoim województwie w zakładce Szkoły i Szpitale',
      'Zwróć uwagę na: poziom referencyjny szpitala, oddział neonatologiczny, dostępność znieczulenia',
      'Pytania do porodówki: czy sala jest jednoosobowa? Czy można rodzić w różnych pozycjach? Czy jest wanna lub prysznic? Czy ojciec może być obecny przez cały czas?',
      'Sprawdź realne opinie — na forach piszą kobiety, które rodziły w danym miejscu',
      'Weź pod uwagę odległość — ważny jest realny czas dojazdu nocą',
      'Jeśli możesz, odwiedź szpital na dniu otwartym lub umów wizytę z położną',
    ],
    tip: 'Duże szpitale kliniczne mają lepsze zaplecze dla komplikacji. Mniejsze szpitale często mają bardziej kameralną atmosferę. Statystycznie większość porodów przebiega bez komplikacji.',
  },
  plan: {
    title: 'Plan porodu i torba szpitalna',
    pill: '30.–36. tydzień',
    pillTone: 'sage',
    intro: 'Spakuj torbę do 33.–34. tygodnia — wczesny poród nie pyta o termin. Plan porodu to dokument z Waszymi preferencjami, który oddajesz personelowi przy przyjęciu. Każdy szpital może mieć własne wymagania — sprawdź stronę wybranej placówki.',
    docs: [
      'Dowód tożsamości (mama i tata)',
      'Karta ciąży z wynikami z III trymestru',
      'Oddzielny dokument z grupą krwi i czynnikiem Rh',
      'Wynik GBS (posiew 35.–37. tydz.)',
      'Wyniki: HIV, HBs, HCV, morfologia, badanie moczu',
      'Przy ujemnym Rh — aktualny wynik przeciwciał odpornościowych',
      'Formularz planu porodu (pobierz ze strony szpitala lub stwórz własny)',
    ],
    steps: [
      'Omów preferencje dotyczące znieczulenia (zewnątrzoponowe tak/nie, TENS, woda, różne pozycje) i kto może być obecny na sali porodowej',
      'Ustalcie życzenia dotyczące pierwszych minut — kontakt skóra-do-skóry, opóźnione przecięcie pępowiny (po 1–3 minutach od porodu), karmienie piersią od razu',
      'Zapisz preferencje na wypadek cięcia cesarskiego: czy tata ma być obecny, czy chcecie kontakt z dzieckiem zaraz po operacji',
      'Omów plan z ginekologiem lub położną prowadzącą — najlepiej przed 36. tygodniem ciąży',
      'Wydrukuj plan i włóż do torby w przezroczystej koszulce — oddaj personelowi przy przyjęciu na izbę',
    ],
    packSections: [
      {
        title: 'Sala porodowa — mama',
        items: [
          'Luźna koszula porodowa lub długa koszulka — bawełna, z rozpinanym przodem',
          'Klapki pod prysznic i ciepłe skarpetki',
          'Gumka do włosów i balsam/pomadka do ust',
          'Woda z dziubkiem — min. 2 l (łatwiejsza do picia podczas skurczów)',
          'Lekkie przekąski: rodzynki, krakersy, baton — dla siebie i partnera',
          'Ładowarka do telefonu i słuchawki z przygotowaną playlistą',
          'Mały ręcznik do wytarcia czoła i pleców',
          'Olejek do masażu (opcja, do masażu pleców przez partnera)',
          '1 duża podpaska poporodowa i jednorazowe majtki z siatki',
        ],
      },
      {
        title: 'Oddział poporodowy — mama',
        items: [
          '2–3 koszule nocne zapinane z przodu — ułatwiają karmienie piersią',
          'Szlafrok i kapcie domowe',
          '2–3 biustonosze do karmienia (bezszwowe lub miękkie)',
          'Wkładki laktacyjne (1 opakowanie)',
          '2 opakowania majtek jednorazowych lub z siatki',
          '2 opakowania dużych podpasek poporodowych',
          'Podkłady jednorazowe — ok. 5–6 szt.',
          'Ręcznik kąpielowy + mały ręcznik',
          'Płyn do higieny intymnej — naturalny, bez barwników i zapachów',
          'Kosmetyki: żel pod prysznic, szampon, krem, szczoteczka do zębów',
          'Papier toaletowy, jednorazowe nakładki na deskę sedesu',
          'Kubek termiczny i sztućce',
        ],
      },
      {
        title: 'Dla dziecka',
        items: [
          '3–4 body z krótkim rękawem — rozmiar 56 lub 62 (wyprać przed wyjazdem)',
          '3–4 pajacyki z zamkiem lub zatrzaskami — rozmiar 56 i 62',
          '2 czapeczki w różnych rozmiarach',
          '2–3 pary skarpetek',
          'Rożek lub kocyk bawełniany',
          'Pieluszki jednorazowe rozmiar 0 lub 1 (1 opakowanie)',
          '3–4 pieluszki tetrowe',
          'Chusteczki nawilżane — bez alkoholu i zapachu',
          'Octenisept do pielęgnacji kikuta pępowiny',
          'Krem pieluszkowy przeciw odparzeniom',
        ],
      },
      {
        title: 'Dla partnera',
        items: [
          'Woda i przekąski na kilka godzin — automaty mogą nie działać',
          'Zmiana ubrania i bluz lub polar (sale porodowe bywają zimne)',
          'Szczoteczka do zębów i dezodorant',
          'Ładowarka i powerbank — telefon musi działać przez całą dobę',
          'Drobne pieniądze i karta płatnicza',
        ],
      },
      {
        title: 'Na dzień wyjścia ze szpitala',
        items: [
          'Ubranie dla mamy — w rozmiarze ciążowym lub luźne (brzuch nie znika od razu po porodzie)',
          'Ubranko dla dziecka dopasowane do pory roku',
          'Kocyk lub rożek',
          'Fotelik samochodowy tyłem do kierunku jazdy (gr. 0/0+) lub atestowana gondola samochodowa — zamontowane w aucie przed porodem. Zwykła gondola od wózka do auta nie jest dopuszczona prawnie.',
        ],
      },
    ],
    tip: 'Spakuj torbę razem z partnerem — żeby wiedział, gdzie co leży i mógł sprawnie podać Ci rzeczy. Na walizce przyklej karteczkę z rzeczami do zabrania w ostatniej chwili: leki stałe, ładowarka, telefon. Walizka na kółkach jest wygodniejsza niż noszona torba. Plan porodu to preferencje, nie kontrakt — poród jest nieprzewidywalny.',
  },
  praca: {
    title: 'Poinformuj pracodawcę i zgłoś dziecko do ubezpieczenia',
    pill: 'po porodzie',
    pillTone: 'clay',
    intro: 'Po urodzeniu dziecka masz kilka formalności pracowniczych do dopełnienia. Najważniejsza to zgłoszenie dziecka do ubezpieczenia zdrowotnego — bez tego dziecko nie ma prawa do bezpłatnej opieki NFZ. Pracodawca ma na to 7 dni od momentu otrzymania dokumentów.',
    docs: [
      'Akt urodzenia dziecka (skrócony odpis)',
      'Numer PESEL dziecka',
      'Wniosek o urlop macierzyński / rodzicielski (druki u pracodawcy)',
    ],
    steps: [
      'Poinformuj pracodawcę o urodzeniu dziecka — może to zrobić partner telefonicznie lub mailowo',
      'Złóż wniosek o urlop macierzyński u pracodawcy w ciągu 21 dni od porodu (dla UoP) — decyduje o stawce 81,5% vs 100%/70%',
      'Pracodawca lub samodzielnie (B2B): wyślij druk ZUS ZCNA do ZUS — zgłoszenie dziecka do ubezpieczenia zdrowotnego',
      'Termin ZUS ZCNA: 7 dni od daty urodzenia dziecka (dla UoP pracodawca robi to za Ciebie)',
      'Poproś pracodawcę o potwierdzenie przyjęcia wniosku urlopowego — zachowaj kopię',
      'Sprawdź, czy pracodawca wypłacił zaległe wynagrodzenie za miesiąc porodu',
    ],
    tip: 'Pracodawca nie może zwolnić pracownicy w trakcie urlopu macierzyńskiego ani rodzicielskiego. Przez ten czas jesteś objęta szczególną ochroną stosunku pracy.',
  },
  pediatra: {
    title: 'Pierwsza wizyta u pediatry',
    pill: '1.–2. tydzień życia',
    pillTone: 'sage',
    intro: 'Pierwsza wizyta patronażowa pediatry powinna odbyć się w 1.–2. tygodniu życia dziecka. Jest bezpłatna i obowiązkowa w ramach NFZ. Wcześniej musisz wybrać przychodnię POZ i złożyć deklarację — bez niej nie możesz umówić wizyty.',
    docs: [
      'Numer PESEL dziecka',
      'Karta zdrowia noworodka ze szpitala',
      'Książeczka zdrowia dziecka (wystawiona w szpitalu)',
      'Karta szczepień ze szpitala',
      'Dowód tożsamości rodzica',
    ],
    steps: [
      'Wybierz przychodnię POZ z pediatrą — sprawdź czy przyjmuje noworodki i ma wolne zapisy',
      'Złóż deklarację wyboru lekarza POZ w przychodni (formularz papierowy lub online)',
      'Złóż osobną deklarację dla pielęgniarki POZ — to inna osoba niż lekarz',
      'Umów pierwszą wizytę patronażową pediatry — powinna się odbyć do końca 2. tygodnia życia',
      'Na wizytę weź: książeczkę zdrowia, kartę szczepień, kartę noworodka ze szpitala, listę pytań',
      'Pediatra sprawdzi: waga (przyrost wagowy), żółtaczka, pępek, odruchy, czy dobrze ssie',
      'Umów kolejną wizytę patronażową i dowiedz się o harmonogram szczepień w tej przychodni',
    ],
    tip: 'Nie czekaj na to, aż dziecko zachoruje. Pierwsza wizyta to poznanie pediatry i ustalenie harmonogramu opieki. Miej przy sobie listę pytań — o karmienie, sen, żółtaczkę, kiedy dzwonić po pomoc.',
  },
  nfz: {
    title: 'Deklaracja NFZ — lekarz POZ dla dziecka',
    pill: 'po nadaniu PESEL',
    pillTone: 'sage',
    intro: 'Po nadaniu numeru PESEL musisz zgłosić dziecko do wybranej przychodni podstawowej opieki zdrowotnej (POZ). Tam wybierasz lekarza pediatrę i położną środowiskową — to automatycznie aktywuje bezpłatne wizyty patronażowe.',
    docs: [
      'Numer PESEL dziecka',
      'Akt urodzenia dziecka',
      'Dowód tożsamości rodzica',
    ],
    steps: [
      'Wybierz przychodnię POZ — sprawdź czy ma pediatrę i przyjmuje noworodki',
      'Złóż deklarację wyboru lekarza POZ (wypełnij formularz w przychodni)',
      'Wybierz pielęgniarkę POZ i położną środowiskową (może być ta sama przychodnia)',
      'Umów pierwszą wizytę patronażową pediatry — powinna się odbyć w 1–2 tygodniu życia',
      'Wizyty patronażowe położnej: 4–6 wizyt przez 8 tygodni — pierwsza do 48h po wyjściu ze szpitala',
    ],
    tip: 'Wizyty patronażowe są OBOWIĄZKOWE i bezpłatne. Odmowa może skutkować zgłoszeniem do opieki społecznej. Nie zwlekaj z deklaracją NFZ — im wcześniej to zrobisz, tym szybciej uruchomisz opiekę zdrowotną dla dziecka.',
  },
  mobywatel: {
    title: 'Dopisz dziecko do mObywatela',
    pill: 'po nadaniu PESEL',
    pillTone: 'clay',
    intro: 'Aplikacja mObywatel pozwala mieć przy sobie cyfrowy profil zdrowotny dziecka — historię szczepień, bilanse, wyniki badań. To przydatne przy każdej wizycie u lekarza.',
    docs: [
      'Numer PESEL dziecka',
      'Profil zaufany rodzica w mObywatelu',
    ],
    steps: [
      'Otwórz aplikację mObywatel na telefonie',
      'Wejdź w sekcję „Profil" lub „Zarządzaj profilem"',
      'Dodaj profil dziecka — podaj numer PESEL',
      'Sprawdź sekcję „Zdrowie" — powinna pojawić się historia szczepień i bilansów',
      'Zapisz aplikację jako „ulubioną" — będziesz jej potrzebował przy każdej wizycie',
    ],
    tip: 'mObywatel synchronizuje się z systemem P1 (elektroniczne dokumenty medyczne) — aktualizacje szczepień pojawiają się automatycznie po każdej wizycie.',
  },
  bilans: {
    title: 'Wizyty patronażowe i bilanse',
    pill: '1.–8. tydzień życia',
    pillTone: 'sage',
    intro: 'Wizyty patronażowe to obowiązkowe, bezpłatne wizyty po porodzie — sprawdzają jak radzi sobie dziecko i wspierają rodziców. Pediatra odwiedza w 1–2 tygodniu, położna 4–6 razy przez 8 tygodni.',
    docs: [
      'Karta zdrowia dziecka ze szpitala',
      'Książeczka zdrowia dziecka',
      'Lista pytań (zrób wcześniej!)',
    ],
    steps: [
      'Pierwsza wizyta patronażowa położnej: do 48 godzin po wyjściu ze szpitala',
      'Pierwsza wizyta pediatry: 1–2 tydzień życia — ocena ogólna, waga, żółtaczka',
      'Kolejne wizyty położnej: łącznie 4–6 przez pierwsze 8 tygodni',
      'Bilans 1. miesiąca: pediatra sprawdza przyrosty wagowe, odruchy, słuch',
      'Plan szczepień: WZW B i BCG już w szpitalu; kolejne szczepienia w 2., 3–4., 5–6. miesiącu',
    ],
    tip: 'Miej przy sobie listę pytań na każdą wizytę — o karmienie, sen, niepokojące objawy. Specjaliści mają ograniczony czas, a pytania lubią znikać w głowie gdy lekarz jest w pokoju.',
  },
  'badania-noworodka': {
    title: 'Pierwsze badania noworodka',
    pill: 'pierwsze dni w szpitalu',
    pillTone: 'sage',
    intro: 'Zaraz po porodzie noworodek przechodzi serię rutynowych badań przesiewowych w szpitalu. Wszystkie są wykonywane automatycznie — Twoja rola to tylko zapewnienie obecności i zadbanie o dokumenty.',
    docs: [
      'Nic nie trzeba przygotowywać — badania wykonuje szpital',
    ],
    steps: [
      'Skala Apgar: ocena w 1., 5. i 10. minucie po porodzie — serce, oddech, napięcie mięśniowe',
      'Badanie przesiewowe (test pięty): 3.–5. doba życia — wykrywa wiele chorób metabolicznych',
      'Badanie słuchu: audiometryczne, w szpitalu przed wypisem',
      'Badanie wzroku (czerwona źrenica): sprawdzenie dna oka',
      'Pomiar wagi, długości i obwodu głowy — będzie porównywany przy każdej kolejnej wizycie',
    ],
    tip: 'Zachowaj wszystkie dokumenty ze szpitala: kartę zdrowia noworodka, wyniki badań przesiewowych, kartę szczepień. Będą potrzebne przy pierwszej wizycie u pediatry.',
  },
  szczepienia: {
    title: 'Pierwsze szczepienia dziecka',
    pill: 'w szpitalu i 2. miesiąc',
    pillTone: 'sage',
    intro: 'Pierwsze szczepienia dziecko dostaje jeszcze w szpitalu — to ochrona przeciwko WZW B i gruźlicy. Kolejne szczepienia realizuje pediatra według Programu Szczepień Ochronnych (PSO), który jest bezpłatny i obowiązkowy.',
    docs: [
      'Książeczka zdrowia dziecka (zostanie wystawiona w szpitalu)',
      'Karta szczepień ze szpitala',
    ],
    steps: [
      'W SZPITALU (1.–2. doba): szczepionka WZW B (wirusowe zapalenie wątroby typu B)',
      'W SZPITALU (kilka dni po urodzeniu): szczepionka BCG (gruźlica)',
      '2. miesiąc życia: szczepionka 6w1, Hib, pneumokoki — planuj wizytę u pediatry',
      '3.–4. miesiąc: kolejna dawka 6w1, meningokoki',
      '5.–6. miesiąc: kolejne dawki — kalendarz ustala pediatra',
      'Śledź kalendarz szczepień w mObywatelu lub książeczce zdrowia',
    ],
    tip: 'Szczepienia są bezpłatne i obowiązkowe. Uchylanie się od szczepień może skutkować karą grzywny i problemami z zapisem do żłobka lub przedszkola.',
  },
  zlobek: {
    title: 'Zapisy do żłobka',
    pill: 'rekrutacja wiosną',
    pillTone: 'sand',
    intro: 'Żłobki publiczne mają ograniczone miejsca — rekrutacja do żłobków miejskich zazwyczaj rusza wiosną (marzec–kwiecień) na rok szkolny od września. Jeśli chcesz korzystać z żłobka publicznego, działaj z wyprzedzeniem.',
    docs: [
      'Akt urodzenia dziecka',
      'Zaświadczenie o zatrudnieniu obojga rodziców',
    ],
    steps: [
      'Sprawdź terminy rekrutacji w swoim mieście (strona UM lub żłobka)',
      'Żłobki publiczne: złóż wniosek przez system elektroniczny lub osobiście w żłobku',
      'Żłobki prywatne: zapisz się jak najwcześniej — najlepsze mają kolejki kilkumiesięczne',
      'Sprawdź program „Aktywnie w żłobku" — do 1500 zł dofinansowania na żłobek prywatny',
      'Alternatywa: program „Aktywni rodzice w pracy" — 1500 zł na nianię lub opiekunkę',
    ],
    tip: 'W największych miastach na jedno miejsce w żłobku publicznym przypada kilka-kilkanaście dzieci. Im wcześniej złożysz wniosek, tym lepiej. Jeśli nie dostaniesz miejsca — masz prawo do dofinansowania żłobka prywatnego.',
  },
  'aktywny-prep': {
    title: 'Przygotuj się na Aktywnego Rodzica',
    pill: 'od 12. miesiąca dziecka',
    pillTone: 'clay',
    intro: 'Program „Aktywny Rodzic" (potocznie: babciowe) to 1500 zł miesięcznie na opiekę nad dzieckiem w wieku 12–36 miesięcy. Można z niego skorzystać w 3 wariantach — wybierz ten, który pasuje do Twojej sytuacji.',
    docs: [
      'Akt urodzenia dziecka',
      'Zaświadczenia o zatrudnieniu',
      'PESEL dziecka',
    ],
    steps: [
      'WARIANT 1 — „Aktywni rodzice w pracy": 1500 zł/mies. na nianię lub opiekunkę gdy oboje rodzice pracują',
      'WARIANT 2 — „Aktywnie w żłobku": 1500 zł/mies. trafia bezpośrednio do żłobka jako obniżenie opłaty',
      'WARIANT 3 — „Aktywnie w domu": 500 zł/mies. gdy rodzic zostaje w domu i nie korzysta z innych form',
      'Wniosek składasz przez PUE ZUS lub mZUS — elektronicznie',
      'Zasiłek wypłacany przez ZUS do 10. dnia następnego miesiąca',
    ],
    tip: 'Nie można łączyć wariantów 1 i 2. Aktywny Rodzic zaczyna się od 12. miesiąca życia dziecka — złóż wniosek kilka tygodni wcześniej, żeby uniknąć przerwy w płatności.',
  },
  'zlobek-finansowanie': {
    title: 'Aktywnie w żłobku — dofinansowanie',
    pill: 'dziecko 12–36 miesięcy',
    pillTone: 'clay',
    intro: 'Program „Aktywnie w żłobku" (część Aktywnego Rodzica) zapewnia do 1500 zł miesięcznie dofinansowania do żłobka prywatnego. Pieniądze trafiają bezpośrednio do placówki — płacisz mniej za żłobek.',
    docs: [
      'Umowa ze żłobkiem',
      'PESEL dziecka',
      'Zaświadczenia o zatrudnieniu rodziców',
    ],
    steps: [
      'Dziecko musi mieć ukończony 12. miesiąc i nie przekroczyć 36. miesiąca',
      'Żłobek musi być wpisany do rejestru żłobków lub posiadać kontrakt z gminą',
      'Złóż wniosek przez PUE ZUS lub mZUS — podaj dane żłobka',
      'ZUS weryfikuje i przelewa 1500 zł/mies. bezpośrednio do placówki',
      'Ty płacisz różnicę między ceną a dofinansowaniem',
    ],
    tip: 'Przy dziecku z niepełnosprawnością kwota dofinansowania wynosi 1900 zł/mies. Sprawdź w ZUS czy żłobek, który wybrałeś, jest zakontraktowany do programu.',
  },
  'bilans-2l': {
    title: 'Bilans 2-latka',
    pill: '24. miesiąc życia',
    pillTone: 'sage',
    intro: 'Bilans zdrowia dwulatka to obowiązkowe badanie u pediatry, które sprawdza rozwój mowy, wzroku, słuchu i postawy. To ważny punkt kontrolny wykrywający ewentualne opóźnienia we wczesnym stadium.',
    docs: [
      'Książeczka zdrowia dziecka',
      'Karta szczepień',
    ],
    steps: [
      'Umów bilans 2-latka u swojego pediatry POZ — jest bezpłatny w ramach NFZ',
      'Pediatra sprawdza: mowę (słowa, zdania), chód, wzrok, słuch, wagę i wzrost',
      'Przejrzysz kalendarz szczepień — czy są aktualne',
      'Dostaniesz skierowania jeśli coś wymaga dalszej diagnostyki',
    ],
    tip: 'Zapisz przed wizytą, jakie słowa dziecko mówi i co rozumie — pediatra zapyta o te szczegóły. Wczesne wykrycie opóźnień mowy daje najlepsze efekty przy terapii logopedycznej.',
  },
};

export default function TaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const taskId = (Array.isArray(id) ? id[0] : id) ?? '';
  const task = TASK_CONTENT[taskId] ?? null;

  if (!task) {
    return (
      <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
        <View className="flex-row items-center px-4 py-3">
          <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
            <Icon name="back" size={20} color={colors.ink.DEFAULT} />
          </Pressable>
          <Text className="flex-1 text-center text-ink font-sans-medium text-[15px]">Zadanie</Text>
          <View className="w-10" />
        </View>
        <View className="flex-1 items-center justify-center px-8 gap-3">
          <Text className="text-ink font-sans-medium text-[15px] text-center">Treść zadania w budowie</Text>
          <Text className="text-ink-soft text-[13px] text-center leading-snug">
            Szczegóły tego kroku pojawią się wkrótce.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
          <Icon name="back" size={20} color={colors.ink.DEFAULT} />
        </Pressable>
        <Text className="flex-1 text-center text-ink font-sans-medium text-[15px]">Zadanie</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} className="flex-1">
        <View className="px-5">
          <Pill tone={task.pillTone ?? 'clay'}>{task.pill ?? ''}</Pill>
          <Text className="font-serif text-[28px] text-ink leading-tight mt-3">{task.title}</Text>
          <Text className="text-ink-soft text-[14px] leading-snug mt-2">{task.intro}</Text>

          {task.docs && task.docs.length > 0 && (
            <View className="mt-6">
              <Text className="text-ink-soft text-[12px] font-sans-medium uppercase tracking-wide mb-2">
                Co przygotować
              </Text>
              {task.docs.map((d: string, i: number) => (
                <View key={i} className="flex-row gap-2 items-start py-1.5">
                  <Icon name="file" size={14} color={colors.terracotta.DEFAULT} />
                  <Text className="text-ink text-[14px] flex-1 leading-snug">{d}</Text>
                </View>
              ))}
            </View>
          )}

          {task.steps && task.steps.length > 0 && (
            <View className="mt-6">
              <Text className="text-ink-soft text-[12px] font-sans-medium uppercase tracking-wide mb-2">
                Jak to zrobić
              </Text>
              {task.steps.map((s: string, i: number) => (
                <View key={i} className="flex-row gap-3 items-start py-1.5">
                  <View className="w-6 h-6 bg-sage-soft rounded-full items-center justify-center">
                    <Text className="text-evergreen font-mono text-[12px]">{i + 1}</Text>
                  </View>
                  <Text className="text-ink text-[14px] flex-1 leading-snug">{s}</Text>
                </View>
              ))}
            </View>
          )}

          {task.packSections && task.packSections.length > 0 && (
            <View className="mt-6">
              <Text className="text-ink-soft text-[12px] font-sans-medium uppercase tracking-wide mb-3">
                Co spakować do torby
              </Text>
              <View className="gap-3">
                {task.packSections.map((section: { title: string; items: string[] }, si: number) => (
                  <View key={si} className="bg-surface border border-line rounded-card p-3.5">
                    <Text className="text-ink font-sans-medium text-[13px] mb-2">{section.title}</Text>
                    {section.items.map((item: string, ii: number) => (
                      <View key={ii} className="flex-row gap-2 items-start py-0.5">
                        <Text className="text-evergreen text-[14px]" style={{ lineHeight: 20 }}>·</Text>
                        <Text className="text-ink text-[13px] flex-1 leading-snug">{item}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </View>
          )}

          {task.tip && (
            <View className="mt-5 bg-terracotta-soft/50 border border-terracotta-soft rounded-card p-3.5 flex-row gap-2.5 items-start">
              <Icon name="info" size={16} color={colors.terracotta.dark} />
              <Text className="text-terracotta-dark text-[13px] flex-1 leading-snug">{task.tip}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View className="px-5 py-4 border-t border-line">
        <Button variant="primary" full onPress={() => router.back()}>Rozumiem, wracam</Button>
      </View>
    </SafeAreaView>
  );
}
