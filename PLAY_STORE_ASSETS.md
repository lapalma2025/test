# Kidelo — generowanie zasobów wizualnych dla Google Play

## Co potrzebujesz wygenerować

### 1. Ikona aplikacji (`assets/icon.png`)
- **Rozmiar:** 1024x1024 px (PNG, bez warstwy alfa dla iOS)
- **Format:** PNG, RGB (nie RGBA)
- **Treść:** monogram "K" w kolorze cream na evergreen tle, lub stylizowana ścieżka (routeAlt icon)
- **Tool:** Figma, lub `npx expo customize` (wygeneruje wszystkie warianty)

### 2. Adaptive icon (Android, `assets/adaptive-icon.png`)
- **Foreground:** 1024x1024 px, treść w środkowym kwadracie 666x666 (system tnie krawędzie)
- **Background color:** `#FAF7F2` (cream) — ustawione w app.json
- Treść: sama ikona "K" lub routeAlt na transparentnym tle

### 3. Splash screen (`assets/splash.png`)
- **Rozmiar:** 1290x2796 px (iPhone 15 Pro Max baseline)
- **Background:** `#FAF7F2`
- **Treść:** logo Kidelo w środku, max 30% wysokości
- Resize mode w app.json: `contain`

### 4. Notification icon (`assets/notification-icon.png`)
- **Rozmiar:** 96x96 px
- **Format:** PNG z alfą (białe outline na transparentnym tle)
- Android wymaga monochromatycznego białego icona — system koloruje
- Color w app.json: `#3D5147` (evergreen)

### 5. Favicon (`assets/favicon.png`)
- **Rozmiar:** 48x48 px
- Tylko dla web, opcjonalnie

## Generowanie wariantów

Najszybciej Expo:
```bash
npx expo customize
# wybierz: assets/icon.png, splash.png, adaptive-icon.png
```

Lub ręcznie wygeneruj w Figmie + użyj `npx expo install expo-image-utils` żeby auto-resize.

## Google Play Console — wymagane materiały

Po `eas submit` potrzebujesz wgrać w Play Console:

### Listing aplikacji
- **Tytuł:** "Kidelo — rodzicielski przewodnik" (max 30 znaków)
- **Krótki opis** (max 80 znaków):
  "Twoja trasa przez ciążę i pierwsze miesiące. Świadczenia, dokumenty, terminy."
- **Pełny opis** (max 4000 znaków) — szablon poniżej

### Screenshots
Wygeneruj 8 screenshotów na różnych ekranach aplikacji:
- **Rozmiar:** min 320 px, max 3840 px
- **Aspect ratio:** 16:9, 9:16, lub kwadrat — dla telefonu zalecane 1080x1920 lub 1080x2400
- **Tool:** Maestro flow + screencap, albo expo-screen-recorder

Sugerowane 8:
1. Trasa — hero card z deadlinem
2. Pieniądze — kwota "10 600 zł"
3. Szczegóły 800+ z krokami
4. Wyszukiwarka szkół rodzenia
5. Porównywarka 2 szpitali
6. Lista USC z checklistą
7. Onboarding krok 1 (etap ciąży)
8. Profil

### Feature graphic
- **Rozmiar:** 1024x500 px
- Pełnoformatowa grafika z hasłem "Twoja trasa rodzicielska" + ekrany aplikacji w mockup

### Promo video (opcjonalne)
- 30-90 sekund
- YouTube embed link

### Data safety form
Wypełnij uczciwie zgodnie z PRIVACY_POLICY.md:
- Email (collected, encrypted in transit, optional for app function)
- Personal info (parent name, child name) (collected, optional)
- App activity (collected, anonymized) — tylko po wyrażeniu zgody
- App info & performance (errors, diagnostics)
- NIE zbieramy: lokalizacji GPS, kontaktów, zdjęć, pliki, kalendarza, fizycznej aktywności

### Content rating
Wypełnij kwestionariusz IARC. Wynik: PEGI 3 / Everyone (aplikacja informacyjna, brak treści wrażliwych).

### Target audience
- Wiek: 18+
- Czy targetowane dla dzieci: NIE

### Privacy policy URL
Wymagane! Hostuj `PRIVACY_POLICY.md` jako HTML pod `kidelo.pl/prywatnosc` (lub Netlify/Vercel).

## Szablon pełnego opisu (Play Store)

```
Kidelo — Twoja trasa rodzicielska.

Aplikacja, która prowadzi Cię od ciąży, przez poród, po pierwsze 3 lata z dzieckiem.
Wszystkie świadczenia, dokumenty i terminy w jednym miejscu.

✓ KALKULATOR ŚWIADCZEŃ
Sprawdź w 3 minuty, co Ci się należy: becikowe, 800+, kosiniakowe, Aktywny Rodzic, RKO.
Dokładne kwoty na podstawie Twojej sytuacji.

✓ OŚ CZASU
Personalizowany plan: co kiedy załatwić. Powiadomienia o ważnych terminach.

✓ SZKOŁY RODZENIA I SZPITALE
Wyszukaj, porównaj, zapisz się. Dane z NFZ Otwarte Dane.

✓ CHECKLISTY
USC, ZUS, NFZ POZ, mObywatel — krok po kroku, nic nie przegapisz.

✓ KROK PO KROKU
Jak złożyć każdy wniosek. Co przygotować. Częste błędy. Deep linki do mZUS i banków.

✓ DZIAŁA OFFLINE
Nie wymaga konta. Twoje dane zostają na Twoim urządzeniu.

DLA KOGO
Mamy w ciąży, młodzi rodzice, rodzice drugiego/kolejnego dziecka, partnerzy chcący wspierać.

WIARYGODNOŚĆ
Dane zweryfikowane z gov.pl i zus.pl. Każde świadczenie z podstawą prawną i linkiem do oryginału.

PRYWATNOŚĆ
PESEL dziecka NIE jest wysyłany na serwer. Pełna zgodność z RODO. Tryb gościa bez konta.

Aplikacja darmowa, bez reklam.
```
