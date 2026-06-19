/**
 * Pozostałe ekrany główne — wstępne implementacje.
 *
 * SzkolyScreen, ListaScreen, ProfilScreen są tu jako pełne placeholdy
 * (działający szkielet z prawdziwymi danymi gdzie się da, plus TODO komentarze
 * dla dalszej rozbudowy w Etapie 4 wg ROADMAP.md).
 */

import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { Card, Chip, Icon, IconBadge, Pill, Button } from '@/components/ui';
import { MainScreenShell } from '@/components/layout/MainScreenShell';
import { useProfileStore } from '@/stores/profile';
import { colors } from '@/theme/tokens';

// ============================================================================
// SZKOŁY — do podłączenia do Supabase w Etapie 2 (fetch-nfz)
// ============================================================================

export function SzkolyScreen() {
  // TODO Etap 2: useQuery z @tanstack/react-query → Supabase hospitals/birth_schools
  // const { data: hospitals, isLoading } = useHospitals({ city: profile.city });

  return (
    <MainScreenShell>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-5 pt-3 pb-3">
          <Text className="font-serif text-[28px] text-ink leading-tight">Szkoły i szpitale</Text>
        </View>

        {/* Searchbar — TODO: podłączyć debouncing + Supabase FTS */}
        <View className="px-5 mb-3">
          <View className="flex-row items-center gap-2 bg-surface border border-line rounded-card px-3 py-3">
            <Icon name="search" size={18} color={colors.ink.faint} />
            <Text className="text-ink-faint text-[14px] flex-1">Szukaj szkoły lub szpitala</Text>
          </View>
        </View>

        {/* Chip filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 mb-4" contentContainerStyle={{ gap: 8 }}>
          <Chip active>Wszystkie</Chip>
          <Chip icon="globe">Online</Chip>
          <Chip>Bezpłatne · NFZ</Chip>
          <Chip>Szpitale</Chip>
        </ScrollView>

        {/* Empty state — pokazujemy gdy backend jeszcze nie odpowiedział */}
        <View className="px-5 mt-8 items-center gap-3">
          <View className="w-16 h-16 bg-sage-soft rounded-full items-center justify-center">
            <Icon name="hospital" size={28} color={colors.evergreen.DEFAULT} />
          </View>
          <Text className="text-ink font-sans-medium text-[15px] text-center">
            Lista będzie tu po Etapie 2
          </Text>
          <Text className="text-ink-soft text-[13px] text-center px-8 leading-snug">
            Po uruchomieniu skryptu fetch-nfz i podłączeniu Supabase tu pojawi się ~500 szpitali położniczych z bazą NFZ.
          </Text>
        </View>
      </ScrollView>
    </MainScreenShell>
  );
}

// ============================================================================
// LISTA — checklisty kontekstowe
// ============================================================================

interface ChecklistItem {
  id: string;
  title: string;
  note: string;
  totalCount: number;
  doneCount: number;
  active: boolean;
}

const CHECKLISTS_TEMPLATE: ChecklistItem[] = [
  { id: 'usc', title: 'Dokumenty w USC', note: 'rejestracja urodzenia i numer PESEL', totalCount: 4, doneCount: 0, active: true },
  { id: 'praca', title: 'Dopisanie do pracodawcy', note: 'ubezpieczenie zdrowotne i zasiłek', totalCount: 3, doneCount: 0, active: true },
  { id: 'mobywatel', title: 'Dopisanie do mObywatela', note: 'dokument dziecka w telefonie', totalCount: 3, doneCount: 0, active: true },
  { id: 'pediatra', title: 'Pierwsza wizyta u pediatry', note: 'opieka w pierwszych tygodniach', totalCount: 3, doneCount: 0, active: true },
  { id: 'torba', title: 'Torba do szpitala', note: 'gotowa od 36. tygodnia', totalCount: 3, doneCount: 3, active: false },
];

export function ListaScreen() {
  // TODO Etap 3: stan checklist persystowany w Supabase (user_progress)
  // Na razie mock z lokalnego stanu

  return (
    <MainScreenShell>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-5 pt-3 pb-5">
          <Text className="font-serif text-[28px] text-ink leading-tight">Listy</Text>
          <Text className="text-ink-soft text-[13px] mt-1">dla Twojego etapu</Text>
        </View>

        <View className="px-5 gap-2.5">
          {CHECKLISTS_TEMPLATE.filter((c) => c.active).map((cl) => (
            <ChecklistCard key={cl.id} item={cl} />
          ))}
        </View>

        {CHECKLISTS_TEMPLATE.some((c) => !c.active) && (
          <View className="px-5 mt-7">
            <Text className="text-ink text-[14px] font-sans-medium mb-3 uppercase tracking-wide text-ink-soft">
              Zakończone
            </Text>
            <View className="gap-2.5">
              {CHECKLISTS_TEMPLATE.filter((c) => !c.active).map((cl) => (
                <ChecklistCard key={cl.id} item={cl} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </MainScreenShell>
  );
}

function ChecklistCard({ item }: { item: ChecklistItem }) {
  const isDone = item.doneCount === item.totalCount;
  const pct = item.totalCount > 0 ? Math.round((item.doneCount / item.totalCount) * 100) : 0;
  return (
    <Card className={isDone ? 'opacity-60' : ''}>
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 mr-2">
          <Text className="text-ink font-sans-medium text-[15px]">{item.title}</Text>
          <Text className="text-ink-soft text-[12px] mt-0.5">{item.note}</Text>
        </View>
        <Text className="font-mono text-[13px] text-ink-soft">
          {item.doneCount}/{item.totalCount}
        </Text>
      </View>
      <View className="h-1 bg-line rounded-full overflow-hidden">
        <View className="h-full bg-evergreen rounded-full" style={{ width: `${pct}%` }} />
      </View>
    </Card>
  );
}

// ============================================================================
// PROFIL — dane usera, partner, dziecko, ustawienia
// ============================================================================

export function ProfilScreen() {
  const router = useRouter();
  const profile = useProfileStore();

  const handleReset = () => {
    profile.reset();
    router.replace('/' as any);
  };

  return (
    <MainScreenShell>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-5 pt-3 pb-5">
          <Text className="font-serif text-[28px] text-ink leading-tight">Profil</Text>
        </View>

        {/* Karta rodzic */}
        <View className="px-5 mb-4">
          <Pressable
            onPress={() => router.push('/edit-profile' as any)}
            className="bg-surface border border-line rounded-card p-4 flex-row items-center gap-3 active:opacity-80"
          >
            <View className="w-14 h-14 bg-evergreen rounded-full items-center justify-center">
              <Text className="text-cream font-serif text-[24px]">
                {(profile.parentName?.[0] ?? '?').toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-ink font-sans-medium text-[16px]">{profile.parentName || '—'}</Text>
              <Text className="text-ink-soft text-[12px] mt-0.5">
                {profile.city || '—'}, {profile.voivodeship}
              </Text>
            </View>
            <Icon name="pencil" size={16} color={colors.ink.faint} />
          </Pressable>
        </View>

        {/* Karta dziecko */}
        {(profile.childBirthDate || profile.childDueDate) && (
          <View className="px-5 mb-4">
            <Text className="text-ink-soft text-[12px] font-sans-medium uppercase tracking-wide mb-2">
              Dziecko
            </Text>
            <View className="bg-surface border border-line rounded-card p-4 flex-row items-center gap-3">
              <View className="w-12 h-12 bg-sage-soft rounded-full items-center justify-center">
                <Icon name="heart" size={22} color={colors.evergreen.DEFAULT} />
              </View>
              <View className="flex-1">
                <Text className="text-ink font-sans-medium text-[15px]">{profile.childName || '—'}</Text>
                <Text className="text-ink-soft text-[12px] mt-0.5">
                  {profile.childBirthDate
                    ? `ur. ${profile.childBirthDate}`
                    : `planowana data: ${profile.childDueDate}`}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Partner */}
        {profile.partnerIncluded && profile.partnerName && (
          <View className="px-5 mb-4">
            <Row icon="user" label="Partner" value={profile.partnerName} />
          </View>
        )}

        {/* Dane do eligibility */}
        <View className="px-5 mb-2 mt-3">
          <Text className="text-ink-soft text-[12px] font-sans-medium uppercase tracking-wide mb-2">
            Twoje dane
          </Text>
          <View className="bg-surface border border-line rounded-card overflow-hidden">
            <Row icon="briefcase" label="Forma zatrudnienia" value={profile.employment} onPress={() => router.push('/edit-profile' as any)} />
            <Divider />
            <Row icon="pin" label="Lokalizacja" value={`${profile.city || '—'}, ${profile.voivodeship}`} onPress={() => router.push('/edit-profile' as any)} />
            <Divider />
            <Row icon="pencil" label="Edytuj profil" onPress={() => router.push('/edit-profile' as any)} />
          </View>
        </View>

        {/* Powiadomienia */}
        <View className="px-5 mb-2 mt-5">
          <Text className="text-ink-soft text-[12px] font-sans-medium uppercase tracking-wide mb-2">
            Aplikacja
          </Text>
          <View className="bg-surface border border-line rounded-card overflow-hidden">
            <Row icon="bell" label="Powiadomienia" onPress={() => router.push('/info?section=notifications' as any)} />
            <Divider />
            <Row icon="shield" label="Prywatność i RODO" onPress={() => router.push('/info?section=privacy' as any)} />
            <Divider />
            <Row icon="info" label="O aplikacji · v1.0.0" onPress={() => router.push('/info?section=about' as any)} />
          </View>
        </View>

        {/* Reset (dev only) */}
        <View className="px-5 mt-8">
          <Pressable onPress={handleReset} className="py-3 items-center">
            <Text className="text-danger text-[13px] font-sans-medium">Resetuj profil (dev)</Text>
          </Pressable>
        </View>
      </ScrollView>
    </MainScreenShell>
  );
}

function Row({ icon, label, value, onPress }: { icon: any; label: string; value?: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 p-3.5 active:bg-line/30">
      <View className="w-8 h-8 items-center justify-center">
        <Icon name={icon} size={18} color={colors.ink.soft} />
      </View>
      <Text className="text-ink text-[14px] flex-1">{label}</Text>
      {value && <Text className="text-ink-soft text-[13px]">{value}</Text>}
      <Icon name="chevron" size={14} color={colors.ink.faint} />
    </Pressable>
  );
}

function Divider() {
  return <View className="h-px bg-line ml-12" />;
}
