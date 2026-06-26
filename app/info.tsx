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
    <View className="gap-4 pt-2">
      <SectionHeader>Twoje dane</SectionHeader>
      <InfoParagraph>
        Aplikacja Kidelo przechowuje Twoje dane wyłącznie na urządzeniu. Nie wysyłamy żadnych
        danych osobowych na zewnętrzne serwery bez Twojej zgody.
      </InfoParagraph>

      <View className="bg-surface border border-line rounded-card p-4 gap-3">
        <PrivacyItem
          icon="shield"
          title="Dane lokalne"
          desc="Profil, daty i preferencje zapisane są na Twoim telefonie w zaszyfrowanej pamięci."
        />
        <PrivacyItem
          icon="user"
          title="Bez konta"
          desc="Korzystanie z aplikacji nie wymaga rejestracji ani podawania adresu e-mail."
        />
        <PrivacyItem
          icon="cross"
          title="Brak reklam"
          desc="Kidelo nie wyświetla reklam i nie sprzedaje Twoich danych reklamodawcom."
        />
        <PrivacyItem
          icon="globe"
          title="Dane zewnętrzne"
          desc="Lista szkół rodzenia i szpitali pochodzi z publicznych baz NFZ"
        />
      </View>

      <SectionHeader>RODO</SectionHeader>
      <InfoParagraph>
        Zgodnie z rozporządzeniem RODO (GDPR) masz prawo do:
      </InfoParagraph>
      <View className="bg-surface border border-line rounded-card p-4 gap-2">
        {[
          'Dostępu do swoich danych (art. 15 RODO)',
          'Sprostowania danych (art. 16 RODO)',
          'Usunięcia danych — wystarczy zresetować profil w ustawieniach (art. 17 RODO)',
          'Przenoszenia danych (art. 20 RODO)',
        ].map((item) => (
          <View key={item} className="flex-row gap-2 items-start">
            <View className="w-1.5 h-1.5 rounded-full bg-evergreen mt-1.5" />
            <Text className="text-ink-soft text-[13px] flex-1 leading-snug">{item}</Text>
          </View>
        ))}
      </View>

      <InfoParagraph>
        Kontakt w sprawach RODO: rodo@kidelo.app
      </InfoParagraph>
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

      <View className="bg-sage-soft border border-sage/30 rounded-card p-4 gap-1">
        <Text className="text-ink font-sans-medium text-[13px]">Kontakt</Text>
        <Text className="text-ink-soft text-[13px]">kontakt@kidelo.app</Text>
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
