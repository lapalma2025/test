/**
 * app/info.tsx — ekrany informacyjne: Powiadomienia, Prywatność, O aplikacji.
 * Sekcja przekazywana przez parametr ?section=
 */

import React from 'react';
import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Icon } from '@/components/ui';
import { useProfileStore } from '@/stores/profile';
import { colors } from '@/theme/tokens';

type Section = 'notifications' | 'privacy' | 'about';

const TITLES: Record<Section, string> = {
  notifications: 'Powiadomienia',
  privacy: 'Prywatność i RODO',
  about: 'O aplikacji',
};

export default function InfoScreen() {
  const router = useRouter();
  const { section } = useLocalSearchParams<{ section: Section }>();
  const activeSection: Section = (section as Section) ?? 'about';
  const title = TITLES[activeSection] ?? 'Informacje';

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
      <View className="flex-row items-center px-4 py-3">
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
          <Icon name="back" size={20} color={colors.ink.DEFAULT} />
        </Pressable>
        <Text className="flex-1 text-center text-ink font-sans-medium text-[15px]">{title}</Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 48, paddingHorizontal: 20 }}>
        {activeSection === 'notifications' && <NotificationsSection />}
        {activeSection === 'privacy' && <PrivacySection />}
        {activeSection === 'about' && <AboutSection />}
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ POWIADOMIENIA ============

function NotificationsSection() {
  const { notificationsEnabled, setField } = useProfileStore();

  const setNotif = (key: keyof typeof notificationsEnabled, value: boolean) => {
    setField('notificationsEnabled', { ...notificationsEnabled, [key]: value });
  };

  const push = notificationsEnabled.push;

  return (
    <View className="gap-4 pt-2">
      <InfoParagraph>
        Powiadomienia pomagają Ci nie przegapić ważnych terminów — rejestracja w USC, złożenie
        wniosku o 800+ czy zbliżający się poród.
      </InfoParagraph>

      <SectionHeader>Powiadomienia push</SectionHeader>
      <View className="bg-surface border border-line rounded-card overflow-hidden">
        <ToggleRow
          label="Wszystkie powiadomienia"
          sublabel="Główny przełącznik"
          value={push}
          onToggle={(v) => setNotif('push', v)}
        />
        <Divider />
        <ToggleRow
          label="Przypomnienia o zadaniach"
          sublabel="Np. 7 dni przed terminem"
          value={notificationsEnabled.reminders}
          onToggle={(v) => setNotif('reminders', v)}
          disabled={!push}
        />
        <Divider />
        <ToggleRow
          label="Terminy prawne i deadliny"
          sublabel="USC 21 dni, ZUS 7 dni od PESEL"
          value={notificationsEnabled.deadlines}
          onToggle={(v) => setNotif('deadlines', v)}
          disabled={!push}
        />
        <Divider />
        <ToggleRow
          label="Nowe świadczenia"
          sublabel="Gdy Twoje dziecko osiągnie wiek"
          value={notificationsEnabled.newBenefits}
          onToggle={(v) => setNotif('newBenefits', v)}
          disabled={!push}
        />
      </View>

      <InfoParagraph>
        Ustawienia są zapisywane lokalnie. Upewnij się, że aplikacja Kidelo ma uprawnienia do
        wysyłania powiadomień w ustawieniach telefonu.
      </InfoParagraph>
    </View>
  );
}

// ============ PRYWATNOŚĆ I RODO ============

function PrivacySection() {
  return (
    <View className="gap-5 pt-2">

      {/* Nagłówek dokumentu */}
      <View className="bg-sage-soft border border-sage/30 rounded-card p-4">
        <Text className="text-ink font-sans-medium text-[14px]">Polityka Prywatności aplikacji Filipek</Text>
        <Text className="text-ink-soft text-[12px] mt-1">Administrator: CODEWITHME sp. z o.o.</Text>
        <Text className="text-ink-faint text-[11px] mt-0.5">KRS: 0001232563 · NIP: 8971969995 · REGON: 544377769</Text>
        <Text className="text-ink-faint text-[11px]">ul. św. Mikołaja 8/11 m. 208, 50-125 Wrocław</Text>
        <Text className="text-ink-faint text-[11px] mt-1">Aktualizacja: 28 czerwca 2026</Text>
      </View>

      {/* 1. Administrator */}
      <SectionHeader>1. Administrator danych osobowych</SectionHeader>
      <InfoParagraph>
        Administratorem Twoich danych osobowych jest CODEWITHME SPÓŁKA Z OGRANICZONĄ ODPOWIEDZIALNOŚCIĄ z siedzibą we Wrocławiu (KRS: 0001232563, NIP: 8971969995). Kontakt w sprawach ochrony danych: biuro@kidelo.pl
      </InfoParagraph>

      {/* 2. Jakie dane zbieramy */}
      <SectionHeader>2. Jakie dane przetwarzamy</SectionHeader>
      <View className="bg-surface border border-line rounded-card p-4 gap-3">
        <PrivacyItem icon="user" title="Dane konta" desc="Adres e-mail podany przy rejestracji." />
        <PrivacyItem icon="file" title="Dane profilu" desc="Imię rodzica/dziecka, termin porodu lub data urodzenia, województwo, sytuacja zatrudnienia." />
        <PrivacyItem icon="heart" title="Dane zdrowotne (wrażliwe)" desc="Sesje kopnięć, skurcze, wyniki badań, karmienie, szczepienia, leki i dawkowanie, wpisy ciążowe, notatki zdrowotne." />
        <PrivacyItem icon="camera" title="Zdjęcia" desc="Przechowywane WYŁĄCZNIE na Twoim urządzeniu — nie trafiają na serwery." />
      </View>

      {/* 3. Cel i podstawa prawna */}
      <SectionHeader>3. Cel i podstawa prawna</SectionHeader>
      <View className="bg-surface border border-line rounded-card p-4 gap-2">
        {[
          'Prowadzenie konta i synchronizacja — art. 6 ust. 1 lit. b RODO (wykonanie umowy)',
          'Dane zdrowotne — art. 9 ust. 2 lit. a RODO (wyraźna zgoda wyrażona przy rejestracji)',
          'Bezpieczeństwo danych — art. 6 ust. 1 lit. f RODO (prawnie uzasadniony interes)',
        ].map((item) => (
          <View key={item} className="flex-row gap-2 items-start">
            <View className="w-1.5 h-1.5 rounded-full bg-evergreen mt-1.5 flex-shrink-0" />
            <Text className="text-ink-soft text-[13px] flex-1 leading-snug">{item}</Text>
          </View>
        ))}
      </View>

      {/* 4. Dane wrażliwe */}
      <SectionHeader>4. Dane zdrowotne — dane wrażliwe</SectionHeader>
      <InfoParagraph>
        Dane dotyczące zdrowia stanowią szczególną kategorię danych osobowych (art. 9 RODO). Przetwarzamy je wyłącznie za Twoją wyraźną zgodą, w celu świadczenia funkcji aplikacji. Możesz korzystać z aplikacji bez konta — dane pozostaną wtedy wyłącznie na Twoim urządzeniu i nie będą synchronizowane.
      </InfoParagraph>

      {/* 5. Podmioty przetwarzające */}
      <SectionHeader>5. Podmioty przetwarzające (procesorzy)</SectionHeader>
      <View className="bg-surface border border-line rounded-card p-4">
        <PrivacyItem
          icon="globe"
          title="Supabase Inc. (USA)"
          desc="Infrastruktura chmurowa. Dane przechowywane na serwerach w UE (Frankfurt, Niemcy). Przekazanie danych odbywa się na podstawie standardowych klauzul umownych (SCC) zgodnie z art. 46 RODO. Szyfrowanie: TLS 1.2+ (tranzyt) i AES-256 (spoczynek)."
        />
      </View>
      <InfoParagraph>
        Nie udostępniamy danych reklamodawcom ani podmiotom trzecim w celach marketingowych.
      </InfoParagraph>

      {/* 6. Okres przechowywania */}
      <SectionHeader>6. Okres przechowywania danych</SectionHeader>
      <InfoParagraph>
        Dane przechowywane są do momentu usunięcia konta przez użytkownika. Po usunięciu konta dane są trwale usuwane z serwerów. Kopie zapasowe mogą być przechowywane przez Supabase do 30 dni zgodnie z ich polityką retencji.
      </InfoParagraph>

      {/* 7. Twoje prawa */}
      <SectionHeader>7. Twoje prawa (RODO)</SectionHeader>
      <View className="bg-surface border border-line rounded-card p-4 gap-2">
        {[
          'Dostęp do danych (art. 15)',
          'Sprostowanie danych (art. 16)',
          'Usunięcie danych — „prawo do bycia zapomnianym" (art. 17) → Profil → Konto → Usuń konto i dane',
          'Ograniczenie przetwarzania (art. 18)',
          'Przenoszenie danych (art. 20)',
          'Sprzeciw wobec przetwarzania (art. 21)',
          'Cofnięcie zgody (art. 7 ust. 3) — bez wpływu na legalność wcześniejszego przetwarzania',
          'Skarga do UODO (uodo.gov.pl, ul. Stawki 2, 00-193 Warszawa)',
        ].map((item) => (
          <View key={item} className="flex-row gap-2 items-start">
            <View className="w-1.5 h-1.5 rounded-full bg-evergreen mt-1.5 flex-shrink-0" />
            <Text className="text-ink-soft text-[13px] flex-1 leading-snug">{item}</Text>
          </View>
        ))}
      </View>

      {/* 8. Brak reklam */}
      <SectionHeader>8. Brak reklam i profilowania</SectionHeader>
      <InfoParagraph>
        Nie wyświetlamy reklam. Nie profilujemy użytkowników w celach marketingowych. Nie sprzedajemy danych osobowych.
      </InfoParagraph>

      {/* 9. Dzieci */}
      <SectionHeader>9. Dzieci</SectionHeader>
      <InfoParagraph>
        Aplikacja nie jest przeznaczona dla osób poniżej 16 roku życia. Nie zbieramy świadomie danych od osób niepełnoletnich.
      </InfoParagraph>

      {/* 10. Wyłączenie odpowiedzialności medycznej */}
      <SectionHeader>10. Wyłączenie odpowiedzialności za treści medyczne</SectionHeader>
      <View className="bg-terracotta-soft border border-terracotta/20 rounded-card p-4 gap-2">
        <View className="flex-row gap-2 items-center mb-1">
          <Icon name="info" size={15} color={colors.terracotta.DEFAULT} />
          <Text className="text-ink font-sans-medium text-[13px]">Ważna informacja</Text>
        </View>
        <Text className="text-ink-soft text-[13px] leading-snug">
          Informacje zawarte w aplikacji mają charakter wyłącznie informacyjny i edukacyjny. Nie stanowią porady medycznej, diagnozy ani zalecenia terapeutycznego.
        </Text>
        <Text className="text-ink-soft text-[13px] leading-snug mt-1">
          Przed podjęciem jakichkolwiek decyzji dotyczących zdrowia — swojego lub dziecka — skonsultuj się z lekarzem, położną lub innym wykwalifikowanym pracownikiem służby zdrowia.
        </Text>
        <Text className="text-ink-soft text-[13px] leading-snug mt-1">
          CODEWITHME sp. z o.o. nie ponosi odpowiedzialności za decyzje podjęte na podstawie informacji zawartych w aplikacji.
        </Text>
      </View>

      {/* 11. Zmiany */}
      <SectionHeader>11. Zmiany polityki prywatności</SectionHeader>
      <InfoParagraph>
        O istotnych zmianach poinformujemy w aplikacji. Dalsze korzystanie po wejściu zmian w życie oznacza ich akceptację.
      </InfoParagraph>

      {/* 12. Kontakt */}
      <SectionHeader>12. Kontakt</SectionHeader>
      <View className="bg-surface border border-line rounded-card p-4 gap-1 mb-4">
        <Text className="text-ink font-sans-medium text-[13px]">CODEWITHME sp. z o.o.</Text>
        <Text className="text-ink-soft text-[13px]">ul. św. Mikołaja 8/11 m. 208, 50-125 Wrocław</Text>
        <Text className="text-ink-soft text-[13px] mt-2">E-mail RODO: biuro@kidelo.pl</Text>
        <Text className="text-ink-soft text-[13px]">Kontakt ogólny: biuro@kidelo.pl</Text>
      </View>

    </View>
  );
}

// ============ O APLIKACJI ============

function AboutSection() {
  return (
    <View className="gap-4 pt-2">
      <View className="items-center py-6 gap-2">
        <View className="w-16 h-16 bg-evergreen rounded-[20px] items-center justify-center">
          <Icon name="heart" size={28} color={colors.cream.DEFAULT} />
        </View>
        <Text className="font-serif text-[24px] text-ink">Kidelo</Text>
        <Text className="text-ink-faint text-[13px]">Wersja 1.0.0</Text>
      </View>

      <InfoParagraph>
        Kidelo to aplikacja dla przyszłych i nowych rodziców, stworzona z myślą o polskim rynku.
        Pomaga nie przegapić żadnego terminu, świadczenia ani badania w trakcie ciąży i pierwszych
        lat życia dziecka.
      </InfoParagraph>

      <SectionHeader>Źródła danych</SectionHeader>
      <View className="bg-surface border border-line rounded-card p-4 gap-3">
        <PrivacyItem
          icon="hospital"
          title="NFZ"
          desc="Rejestr szpitali położniczych i placówek POZ z bazy Narodowego Funduszu Zdrowia."
        />
        <PrivacyItem
          icon="file"
          title="ZUS / gov.pl"
          desc="Aktualne stawki świadczeń: 800+, becikowe, kosiniakowe, Aktywny Rodzic."
        />
      </View>

      <View className="bg-surface border border-line rounded-card p-4 gap-1">
        <Text className="text-ink font-sans-medium text-[13px]">Kontakt</Text>
        <Text className="text-ink-soft text-[13px]">biuro@kidelo.pl</Text>
      </View>

      <SectionHeader>Wyłączenie odpowiedzialności medycznej</SectionHeader>
      <View style={{ backgroundColor: colors.terracotta.soft, borderWidth: 1, borderColor: 'rgba(185,90,70,0.2)', borderRadius: 16, padding: 16, gap: 8, marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 4 }}>
          <Icon name="info" size={15} color={colors.terracotta.DEFAULT} />
          <Text style={{ fontSize: 13, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>Ważna informacja</Text>
        </View>
        <Text style={{ fontSize: 13, color: colors.ink.soft, lineHeight: 20 }}>
          Informacje w aplikacji mają charakter wyłącznie informacyjny i edukacyjny — nie są poradą medyczną ani diagnozą.
        </Text>
        <Text style={{ fontSize: 13, color: colors.ink.soft, lineHeight: 20 }}>
          Przed podjęciem decyzji dotyczących zdrowia skonsultuj się z lekarzem lub położną. CODEWITHME sp. z o.o. nie ponosi odpowiedzialności za decyzje podjęte na podstawie treści aplikacji.
        </Text>
      </View>
    </View>
  );
}

// ============ HELPERS ============

function SectionHeader({ children }: { children: string }) {
  return (
    <Text className="text-ink-soft text-[11px] font-sans-medium uppercase tracking-wider mt-2">
      {children}
    </Text>
  );
}

function InfoParagraph({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-ink-soft text-[14px] leading-relaxed">{children}</Text>
  );
}

function Divider() {
  return <View className="h-px bg-line ml-4" />;
}

function ToggleRow({
  label,
  sublabel,
  value,
  onToggle,
  disabled,
}: {
  label: string;
  sublabel?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View className={`flex-row items-center gap-3 p-3.5 ${disabled ? 'opacity-40' : ''}`}>
      <View className="flex-1">
        <Text className="text-ink text-[14px]">{label}</Text>
        {sublabel && <Text className="text-ink-faint text-[12px] mt-0.5">{sublabel}</Text>}
      </View>
      <Switch
        value={value && !disabled}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ true: colors.evergreen.DEFAULT, false: colors.line.DEFAULT }}
        thumbColor={colors.cream.DEFAULT}
      />
    </View>
  );
}

function PrivacyItem({ icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <View className="flex-row gap-3 items-start">
      <View className="w-8 h-8 bg-sage-soft rounded-lg items-center justify-center mt-0.5">
        <Icon name={icon} size={16} color={colors.evergreen.DEFAULT} />
      </View>
      <View className="flex-1">
        <Text className="text-ink font-sans-medium text-[13px]">{title}</Text>
        <Text className="text-ink-soft text-[12px] mt-0.5 leading-snug">{desc}</Text>
      </View>
    </View>
  );
}
