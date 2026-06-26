/**
 * app/school/[id].tsx — profil szpitala lub szkoły rodzenia.
 * Pokazuje pełne dane z master-data: opis, www, email, tagi, uwagi,
 * stopień referencyjności, płatność, wszystkie telefony.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Icon, Pill } from '@/components/ui';
import { useHospital, useSchool } from '@/hooks/useHospitals';
import { colors } from '@/theme/tokens';

// Tagi które chcemy pomijać (techniczne/wewnętrzne)
const SKIP_TAGS = new Set([
  'DODANY', 'DODANA', 'INFORMACYJNY', 'do_weryfikacji', 'do_potwierdzenia',
  'TOP10_Polska', 'TOP3_wojewodztwo', 'inwestycja_2026',
]);

// Czytelne etykiety tagów
const TAG_LABELS: Record<string, string> = {
  NFZ: 'NFZ', publiczny: 'publiczny', prywatny: 'prywatny', komercyjny: 'komercyjny',
  uniwersytecki: 'kliniczny', wojskowy: 'wojskowy', miejski: 'miejski', gminny: 'gminny',
  I_stopien: 'I stopień ref.', II_stopien: 'II stopień ref.', III_stopien: 'III stopień ref.',
  III_stopien_neonatologia: 'OITN III°',
  bank_mleka: 'bank mleka', doula: 'doula akceptowana', hipnoporod: 'hypnobirthing',
  analgezja_wziewna: 'gaz rozweselający', entonox: 'Entonox',
  immersja_wodna: 'poród w wodzie', imersja_wodna: 'poród w wodzie',
  dom_narodzin: 'dom narodzin', midwife_led: 'midwife-led',
  diagnostyka_prenatalna: 'diagnostyka prenatalna',
  ciaza_powiklana: 'ciąże powikłane', ciaza_wysokiego_ryzyka: 'wysokie ryzyko',
  chirurgia_plodu: 'chirurgia płodu', leczenie_plodu: 'leczenie płodu',
  hospicjum_perinatalne: 'hospicjum perinatalne',
  doradztwo_laktacyjne: 'doradca laktacyjny', doradca_laktacyjny: 'doradca laktacyjny',
  IBCLC: 'certyfikowany laktator',
  fizjoterapia: 'fizjoterapia', hybrydowa: 'hybrydowa', online: 'online',
  bezpłatna: 'bezpłatna', komercyjna: 'komercyjna', prywatna: 'prywatna',
  rodzicielstwo_bliskosci: 'rodzicielstwo bliskości',
  weekendowa: 'weekendowa', indywidualna: 'indywidualna',
  kameralny: 'kameralny', dobre_oceny: 'dobre opinie',
  akredytacja_MZ: 'akredytacja MZ', maluchy_na_brzuchy: 'Maluchy na Brzuchy',
  KOC: 'koordynowana opieka', VBAC: 'VBAC', bez_rejonizacji: 'bez rejonizacji',
  SOR: 'SOR', centrum_urazowe: 'centrum urazowe',
};

function tagLabel(t: string): string {
  return TAG_LABELS[t] ?? t.replace(/_/g, ' ');
}

function tagTone(t: string): 'sage' | 'clay' | 'mustard' | 'neutral' | 'evergreen' {
  if (['NFZ', 'bezpłatna', 'publiczny'].includes(t)) return 'sage';
  if (['III_stopien', 'II_stopien', 'I_stopien', 'III_stopien_neonatologia'].includes(t)) return 'mustard';
  if (['prywatny', 'komercyjny', 'komercyjna', 'prywatna'].includes(t)) return 'clay';
  if (['dobre_oceny', 'maluchy_na_brzuchy', 'akredytacja_MZ'].includes(t)) return 'evergreen';
  return 'neutral';
}

export default function SchoolDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const schoolQuery = useSchool(id);
  const hospitalQuery = useHospital(id);

  const isLoading = schoolQuery.isLoading || hospitalQuery.isLoading;
  const school = schoolQuery.data;
  const hospital = hospitalQuery.data;
  const entity = school || hospital;

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center">
        <ActivityIndicator color={colors.evergreen.DEFAULT} />
      </SafeAreaView>
    );
  }

  if (!entity) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center px-8">
        <Icon name="hospital" size={40} color={colors.ink.faint} />
        <Text className="text-ink-soft text-[15px] mt-3 text-center">Nie znaleziono placówki.</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-sage font-sans-medium text-[14px]">Wróć</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const isSchool = !!school;
  const phone = isSchool ? school?.phone ?? null : hospital?.phone ?? null;
  const allPhones = entity.all_phones ?? [];
  const address = isSchool ? school?.address_full ?? null : hospital?.address_full ?? null;
  const description = entity.description ?? null;
  const www = entity.www ?? null;
  const email = entity.email ?? null;
  const notes = entity.notes ?? null;
  const tags = (entity.tags ?? []).filter((t: string) => !SKIP_TAGS.has(t));

  const openUrl = (url: string) => {
    if (!url.startsWith('http')) url = 'https://' + url;
    Linking.openURL(url);
  };

  const lat = isSchool ? school?.lat : hospital?.lat;
  const lng = isSchool ? school?.lng : hospital?.lng;

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
      {/* Nagłówek */}
      <View className="flex-row items-center px-4 py-3 border-b border-line">
        <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center">
          <Icon name="back" size={20} color={colors.ink.DEFAULT} />
        </Pressable>
        <Text className="flex-1 text-center text-ink font-sans-medium text-[15px]">
          {isSchool ? 'Szkoła rodzenia' : 'Szpital'}
        </Text>
        <View className="w-10" />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} className="flex-1">
        {/* Hero */}
        <View className="px-5 pt-6 items-center">
          <View
            className={`w-20 h-20 rounded-full items-center justify-center ${
              isSchool ? 'bg-sage-soft' : 'bg-terracotta-soft'
            }`}
          >
            <Icon
              name={isSchool ? (school?.type === 'online' ? 'globe' : 'school') : 'hospital'}
              size={36}
              color={isSchool ? colors.evergreen.DEFAULT : colors.terracotta.dark}
            />
          </View>
          <Text className="font-serif text-[22px] text-ink text-center leading-tight mt-4 px-4">
            {entity.name}
          </Text>

          {/* Lokalizacja */}
          <View className="flex-row items-center gap-1.5 mt-2">
            <Icon name="pin" size={13} color={colors.ink.soft} />
            <Text className="text-ink-soft text-[13px]">
              {(isSchool ? school?.city : hospital?.city) ?? '—'}
              {(isSchool ? school?.voivodeship : hospital?.voivodeship)
                ? `, woj. ${isSchool ? school!.voivodeship : hospital!.voivodeship}`
                : ''}
            </Text>
          </View>

          {/* Ocena */}
          {entity.rating != null && (
            <View className="flex-row items-center gap-1.5 mt-2">
              <Icon name="star" size={14} color={colors.terracotta.DEFAULT} />
              <Text className="text-ink text-[14px] font-sans-medium">
                {entity.rating.toFixed(1).replace('.', ',')}
              </Text>
              {entity.reviews_count > 0 && (
                <Text className="text-ink-faint text-[12px]">· {entity.reviews_count} opinii</Text>
              )}
            </View>
          )}
        </View>

        {/* Tagi */}
        {tags.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5 px-5 mt-5">
            {tags.map((t: string) => (
              <Pill key={t} tone={tagTone(t)}>{tagLabel(t)}</Pill>
            ))}
          </View>
        )}

        {/* Info grid */}
        <View className="px-5 mt-5 gap-2">
          {/* Szpital — stopień referencyjności */}
          {!isSchool && hospital?.ref_level && (
            <InfoRow icon="layers" label="Stopień referencyjności">
              Położniczy: {hospital.ref_level}
              {hospital.neonatal_level ? `  ·  Neonatologiczny: ${hospital.neonatal_level}` : ''}
            </InfoRow>
          )}

          {/* Szpital — NFZ */}
          {!isSchool && entity.is_nfz && (
            <InfoRow icon="gift" label="Finansowanie">Kontrakt NFZ — bezpłatny poród</InfoRow>
          )}
          {!isSchool && !entity.is_nfz && (
            <InfoRow icon="wallet" label="Finansowanie">Placówka komercyjna (odpłatna)</InfoRow>
          )}

          {/* Szpital — znieczulenie */}
          {!isSchool && hospital?.has_anesthesia === true && (
            <InfoRow icon="info" label="Znieczulenie">Zewnątrzoponowe dostępne</InfoRow>
          )}
          {!isSchool && hospital?.has_anesthesia === false && (
            <InfoRow icon="info" label="Znieczulenie">Brak znieczulenia zewnątrzoponowego</InfoRow>
          )}

          {/* Szkoła — płatność */}
          {isSchool && school?.is_nfz_free && (
            <InfoRow icon="gift" label="Koszt">
              {school.payment && school.payment !== 'bezpłatna'
                ? school.payment
                : 'Bezpłatna — refundacja NFZ'}
            </InfoRow>
          )}
          {isSchool && !school?.is_nfz_free && (
            <InfoRow icon="wallet" label="Koszt">
              {school?.payment
                ? school.payment
                : school?.price_pln
                ? `ok. ${school.price_pln} zł za pełny kurs`
                : 'Płatna (cena do potwierdzenia)'}
            </InfoRow>
          )}

          {/* Szkoła — typ */}
          {isSchool && (
            <InfoRow icon="school" label="Forma zajęć">
              {school?.type === 'online'
                ? 'Online (kursy zdalne)'
                : school?.type === 'hybrid'
                ? 'Hybrydowa (częściowo online)'
                : 'Stacjonarna'}
            </InfoRow>
          )}

          {/* Harmonogram */}
          {isSchool && school?.schedule && (
            <InfoRow icon="clock" label="Harmonogram">{school.schedule}</InfoRow>
          )}

          {/* Adres */}
          {address && <InfoRow icon="pin" label="Adres">{address}</InfoRow>}
        </View>

        {/* Opis */}
        {description && (
          <View className="px-5 mt-6">
            <SectionHeader>O placówce</SectionHeader>
            <View className="bg-surface border border-line rounded-card p-4">
              <Text className="text-ink text-[14px] leading-relaxed">{description}</Text>
            </View>
          </View>
        )}

        {/* Uwagi */}
        {notes && (
          <View className="px-5 mt-4">
            <SectionHeader>Uwagi</SectionHeader>
            <View className="bg-blush-soft border border-terracotta/20 rounded-card p-4 flex-row gap-3">
              <Icon name="info" size={16} color={colors.terracotta.DEFAULT} />
              <Text className="text-ink text-[14px] leading-relaxed flex-1">{notes}</Text>
            </View>
          </View>
        )}

        {/* Kontakt */}
        <View className="px-5 mt-6">
          <SectionHeader>Kontakt</SectionHeader>
          <View className="bg-surface border border-line rounded-card overflow-hidden">
            {/* Wszystkie telefony */}
            {allPhones.length > 0
              ? allPhones.map((p: { label: string; number: string }, i: number) => (
                  <Pressable
                    key={i}
                    onPress={() => Linking.openURL(`tel:${p.number.replace(/\s/g, '')}`)}
                    className={`flex-row items-center gap-3 p-3.5 active:bg-cream ${
                      i > 0 ? 'border-t border-line/60' : ''
                    }`}
                  >
                    <Icon name="phone" size={16} color={colors.evergreen.DEFAULT} />
                    <View className="flex-1">
                      <Text className="text-ink-faint text-[11px] uppercase tracking-wide">{p.label}</Text>
                      <Text className="text-ink font-sans-medium text-[14px] mt-0.5">{p.number}</Text>
                    </View>
                    <Icon name="chevron" size={14} color={colors.ink.faint} />
                  </Pressable>
                ))
              : phone
              ? (
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${phone.replace(/\s/g, '')}`)}
                    className="flex-row items-center gap-3 p-3.5 active:bg-cream"
                  >
                    <Icon name="phone" size={16} color={colors.evergreen.DEFAULT} />
                    <Text className="text-ink font-sans-medium text-[14px] flex-1">{phone}</Text>
                    <Icon name="chevron" size={14} color={colors.ink.faint} />
                  </Pressable>
                )
              : null}

            {/* Email */}
            {email && (
              <Pressable
                onPress={() => Linking.openURL(`mailto:${email}`)}
                className={`flex-row items-center gap-3 p-3.5 active:bg-cream ${
                  allPhones.length > 0 || phone ? 'border-t border-line/60' : ''
                }`}
              >
                <Icon name="globe" size={16} color={colors.evergreen.DEFAULT} />
                <View className="flex-1">
                  <Text className="text-ink-faint text-[11px] uppercase tracking-wide">E-mail</Text>
                  <Text className="text-ink font-sans-medium text-[14px] mt-0.5">{email}</Text>
                </View>
                <Icon name="chevron" size={14} color={colors.ink.faint} />
              </Pressable>
            )}

            {/* Strona WWW */}
            {www && (
              <Pressable
                onPress={() => openUrl(www)}
                className={`flex-row items-center gap-3 p-3.5 active:bg-cream ${
                  allPhones.length > 0 || phone || email ? 'border-t border-line/60' : ''
                }`}
              >
                <Icon name="globe" size={16} color={colors.evergreen.DEFAULT} />
                <View className="flex-1">
                  <Text className="text-ink-faint text-[11px] uppercase tracking-wide">Strona www</Text>
                  <Text className="text-ink font-sans-medium text-[14px] mt-0.5" numberOfLines={1}>
                    {www.replace(/^https?:\/\//, '')}
                  </Text>
                </View>
                <Icon name="chevron" size={14} color={colors.ink.faint} />
              </Pressable>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Dolne przyciski */}
      <View className="px-5 py-4 border-t border-line gap-2">
        {www && (
          <Pressable
            onPress={() => openUrl(www)}
            className="flex-row items-center justify-center gap-2 bg-surface border border-line rounded-card py-3.5 active:opacity-80"
          >
            <Icon name="globe" size={18} color={colors.ink.DEFAULT} />
            <Text className="text-ink font-sans-medium text-[15px]">Otwórz stronę</Text>
          </Pressable>
        )}
        {(lat || address) && (
          <Pressable
            onPress={() => router.push({ pathname: '/(tabs)/szkoly', params: { view: 'map' } } as any)}
            className="flex-row items-center justify-center gap-2 bg-evergreen rounded-card py-3.5 active:opacity-90"
          >
            <Icon name="pin" size={18} color={colors.cream.DEFAULT} />
            <Text className="text-cream font-sans-medium text-[15px]">Zobacz na mapie</Text>
            <Icon name="arrow" size={16} color={colors.cream.DEFAULT} />
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

// ============ HELPERS ============

function SectionHeader({ children }: { children: string }) {
  return (
    <Text className="text-ink-soft text-[11px] font-sans-medium uppercase tracking-wider mb-2">
      {children}
    </Text>
  );
}

function InfoRow({ icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <View className="bg-surface border border-line rounded-card p-3.5 flex-row gap-3 items-start">
      <View className="w-8 h-8 bg-cream items-center justify-center rounded-card mt-0.5">
        <Icon name={icon} size={16} color={colors.ink.soft} />
      </View>
      <View className="flex-1">
        <Text className="text-ink-faint text-[11px] uppercase tracking-wide">{label}</Text>
        <Text className="text-ink text-[14px] mt-0.5 leading-snug">{children}</Text>
      </View>
    </View>
  );
}
