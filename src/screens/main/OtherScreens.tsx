/**
 * Pozostałe ekrany główne — wstępne implementacje.
 *
 * SzkolyScreen, ListaScreen, ProfilScreen są tu jako pełne placeholdy
 * (działający szkielet z prawdziwymi danymi gdzie się da, plus TODO komentarze
 * dla dalszej rozbudowy w Etapie 4 wg ROADMAP.md).
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

import { Card, Chip, Icon, IconBadge, Pill, Button, LanguageSwitcher } from '@/components/ui';
import { MainScreenShell } from '@/components/layout/MainScreenShell';
import { useProfileStore } from '@/stores/profile';
import { useTrackersStore } from '@/stores/trackers';
import { useMedicationsStore } from '@/stores/medications';
import { useNotesStore } from '@/stores/notes';
import { useAuth } from '@/hooks/useAuth';
import { signOut, deleteAccount } from '@/services/auth';
import { colors } from '@/theme/tokens';
import { useT } from '@/i18n';

// ============================================================================
// SZKOŁY — do podłączenia do Supabase w Etapie 2 (fetch-nfz)
// ============================================================================

export function SzkolyScreen() {
  const t = useT();
  // TODO Etap 2: useQuery z @tanstack/react-query → Supabase hospitals/birth_schools
  // const { data: hospitals, isLoading } = useHospitals({ city: profile.city });

  return (
    <MainScreenShell>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-5 pt-3 pb-3">
          <Text className="font-serif text-[28px] text-ink leading-tight">{t.schools.title}</Text>
        </View>

        {/* Searchbar — TODO: podłączyć debouncing + Supabase FTS */}
        <View className="px-5 mb-3">
          <View className="flex-row items-center gap-2 bg-surface border border-line rounded-card px-3 py-3">
            <Icon name="search" size={18} color={colors.ink.faint} />
            <Text className="text-ink-faint text-[14px] flex-1">{t.schools.search}</Text>
          </View>
        </View>

        {/* Chip filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 mb-4" contentContainerStyle={{ gap: 8 }}>
          <Chip active>{t.schools.all}</Chip>
          <Chip icon="globe">{t.schools.online}</Chip>
          <Chip>{t.schools.free}</Chip>
          <Chip>{t.schools.hospitals}</Chip>
        </ScrollView>

        {/* Empty state — pokazujemy gdy backend jeszcze nie odpowiedział */}
        <View className="px-5 mt-8 items-center gap-3">
          <View className="w-16 h-16 bg-sage-soft rounded-full items-center justify-center">
            <Icon name="hospital" size={28} color={colors.evergreen.DEFAULT} />
          </View>
          <Text className="text-ink font-sans-medium text-[15px] text-center">
            {t.schools.comingSoon}
          </Text>
          <Text className="text-ink-soft text-[13px] text-center px-8 leading-snug">
            {t.schools.comingSoonDesc}
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

export function ListaScreen() {
  const t = useT();

  const CHECKLISTS_TEMPLATE: ChecklistItem[] = [
    { id: 'usc', title: t.lists.uscTitle, note: t.lists.uscNote, totalCount: 4, doneCount: 0, active: true },
    { id: 'praca', title: t.lists.pracaTitle, note: t.lists.pracaNote, totalCount: 3, doneCount: 0, active: true },
    { id: 'mobywatel', title: t.lists.mobywatelTitle, note: t.lists.mobywatelNote, totalCount: 3, doneCount: 0, active: true },
    { id: 'pediatra', title: t.lists.pediatraTitle, note: t.lists.pediatraNote, totalCount: 3, doneCount: 0, active: true },
    { id: 'torba', title: t.lists.torbaTitle, note: t.lists.torbaNoteText, totalCount: 3, doneCount: 3, active: false },
  ];
  // TODO Etap 3: stan checklist persystowany w Supabase (user_progress)
  // Na razie mock z lokalnego stanu

  return (
    <MainScreenShell>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-5 pt-3 pb-5">
          <Text className="font-serif text-[28px] text-ink leading-tight">{t.lists.title}</Text>
          <Text className="text-ink-soft text-[13px] mt-1">{t.lists.subtitle}</Text>
        </View>

        <View className="px-5 gap-2.5">
          {CHECKLISTS_TEMPLATE.filter((c) => c.active).map((cl) => (
            <ChecklistCard key={cl.id} item={cl} />
          ))}
        </View>

        {CHECKLISTS_TEMPLATE.some((c) => !c.active) && (
          <View className="px-5 mt-7">
            <Text className="text-ink text-[14px] font-sans-medium mb-3 uppercase tracking-wide text-ink-soft">
              {t.lists.completed}
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
  const router = useRouter();
  const isDone = item.doneCount === item.totalCount;
  const pct = item.totalCount > 0 ? Math.round((item.doneCount / item.totalCount) * 100) : 0;
  return (
    <Pressable onPress={() => router.push(`/task/${item.id}` as any)} className="active:opacity-75">
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
    </Pressable>
  );
}

// ============================================================================
// PROFIL — dane usera, partner, dziecko, ustawienia
// ============================================================================

export function ProfilScreen() {
  const router = useRouter();
  const profile = useProfileStore();
  const auth = useAuth();
  const t = useT();
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleReset = () => {
    profile.reset();
    router.replace('/' as any);
  };

  const handleLogout = () => {
    Alert.alert(
      'Wyloguj się',
      'Czy na pewno chcesz się wylogować? Dane lokalne pozostaną na urządzeniu.',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Wyloguj',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            profile.setField('hasSkippedAuth', false);
            await signOut();
            setLoggingOut(false);
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Usuń konto i dane',
      'Wszystkie Twoje dane zostaną trwale i nieodwracalnie usunięte z naszych serwerów. Tej operacji nie można cofnąć.',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń konto',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            const result = await deleteAccount();
            setDeleting(false);
            if (!result.ok) {
              Alert.alert('Błąd', result.error ?? 'Nie udało się usunąć konta. Spróbuj ponownie.');
              return;
            }
            useTrackersStore.getState().replaceFromCloud({
              kickSessions: [], contractionSessions: [], testResults: [],
              feedingSessions: [], vaccinations: [], bumpEntries: [],
            });
            useMedicationsStore.getState().replaceFromCloud({ medications: [], doseRecords: [] });
            useNotesStore.getState().replaceFromCloud([]);
            profile.reset();
            router.replace('/auth');
          },
        },
      ],
    );
  };

  return (
    <MainScreenShell>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View className="px-5 pt-3 pb-5 flex-row items-center justify-between">
          <Text className="font-serif text-[28px] text-ink leading-tight">{t.profile.title}</Text>
          <LanguageSwitcher />
        </View>

        {/* Karta rodzic */}
        <View className="px-5 mb-4">
          <View className="bg-surface border border-line rounded-card p-4 flex-row items-center gap-3">
            <View className="w-14 h-14 bg-evergreen rounded-full items-center justify-center">
              <Text className="text-cream font-serif text-[24px]">
                {(profile.parentName?.[0] ?? '?').toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-ink font-sans-medium text-[16px]">{profile.parentName || '—'}</Text>
              {auth.isAuthenticated && auth.user?.email ? (
                <Text className="text-ink-soft text-[12px] mt-0.5" numberOfLines={1}>
                  {auth.user.email}
                </Text>
              ) : (
                <Text className="text-ink-soft text-[12px] mt-0.5">
                  {profile.city || '—'}{profile.city && profile.voivodeship ? ', ' : ''}{profile.voivodeship}
                </Text>
              )}
            </View>
            {auth.isAuthenticated && (
              <View style={{
                backgroundColor: colors.sage.soft, borderRadius: 8,
                paddingHorizontal: 8, paddingVertical: 4,
              }}>
                <Text style={{ fontSize: 11, color: colors.evergreen.DEFAULT, fontFamily: 'Geist_500Medium' }}>
                  Zsynchronizowano
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Karta dziecko */}
        {(profile.childBirthDate || profile.childDueDate) && (
          <View className="px-5 mb-4">
            <Text className="text-ink-soft text-[12px] font-sans-medium uppercase tracking-wide mb-2">
              {t.profile.child}
            </Text>
            <View className="bg-surface border border-line rounded-card p-4 flex-row items-center gap-3">
              <View className="w-12 h-12 bg-sage-soft rounded-full items-center justify-center">
                <Icon name="heart" size={22} color={colors.evergreen.DEFAULT} />
              </View>
              <View className="flex-1">
                <Text className="text-ink font-sans-medium text-[15px]">{profile.childName || '—'}</Text>
                <Text className="text-ink-soft text-[12px] mt-0.5">
                  {profile.childBirthDate
                    ? `${t.profile.born} ${profile.childBirthDate}`
                    : `${t.profile.dueDateLabel} ${profile.childDueDate}`}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Partner */}
        {profile.partnerIncluded && profile.partnerName && (
          <View className="px-5 mb-4">
            <Text className="text-ink-soft text-[12px] font-sans-medium uppercase tracking-wide mb-2">
              {t.profile.partner}
            </Text>
            <Pressable
              onPress={() => router.push('/partner' as any)}
              className="bg-surface border border-line rounded-card p-4 flex-row items-center gap-3 active:opacity-80"
            >
              <View className="w-12 h-12 rounded-full items-center justify-center" style={{ backgroundColor: '#C97B5A' }}>
                <Text className="text-cream font-serif text-[20px]">
                  {(profile.partnerName[0] ?? 'P').toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-ink font-sans-medium text-[15px]">{profile.partnerName}</Text>
                <Text className="text-ink-soft text-[12px] mt-0.5">{t.profile.partnerHint}</Text>
              </View>
              <Icon name="chevron" size={16} color={colors.ink.faint} />
            </Pressable>
          </View>
        )}

        {/* Dane do eligibility */}
        <View className="px-5 mb-2 mt-3">
          <Text className="text-ink-soft text-[12px] font-sans-medium uppercase tracking-wide mb-2">
            {t.profile.yourData}
          </Text>
          <View className="bg-surface border border-line rounded-card overflow-hidden">
            <Row icon="pencil" label={t.profile.editProfile} onPress={() => router.push('/edit-profile' as any)} />
          </View>
        </View>

        {/* Konto */}
        <View className="px-5 mb-2 mt-5">
          <Text className="text-ink-soft text-[12px] font-sans-medium uppercase tracking-wide mb-2">
            Konto
          </Text>
          <View className="bg-surface border border-line rounded-card overflow-hidden">
            {auth.isAuthenticated ? (
              <>
                <Pressable
                  onPress={handleLogout}
                  disabled={loggingOut || deleting}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, opacity: loggingOut ? 0.6 : 1 }}
                >
                  <View style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                    {loggingOut
                      ? <ActivityIndicator size="small" color={colors.terracotta.DEFAULT} />
                      : <Icon name="logout" size={18} color={colors.terracotta.DEFAULT} />
                    }
                  </View>
                  <Text style={{ flex: 1, fontSize: 14, color: colors.terracotta.DEFAULT, fontFamily: 'Geist_500Medium' }}>
                    Wyloguj się
                  </Text>
                </Pressable>
                <View style={{ height: 1, backgroundColor: colors.line.DEFAULT, marginLeft: 12 }} />
                <Pressable
                  onPress={handleDeleteAccount}
                  disabled={loggingOut || deleting}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, opacity: deleting ? 0.6 : 1 }}
                >
                  <View style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                    {deleting
                      ? <ActivityIndicator size="small" color={colors.terracotta.DEFAULT} />
                      : <Icon name="trash" size={18} color={colors.terracotta.DEFAULT} />
                    }
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, color: colors.terracotta.DEFAULT, fontFamily: 'Geist_500Medium' }}>
                      Usuń konto i dane
                    </Text>
                    <Text style={{ fontSize: 11.5, color: colors.ink.faint, marginTop: 1 }}>
                      Trwale usuwa wszystkie Twoje dane z serwerów
                    </Text>
                  </View>
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={() => router.push('/auth' as any)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}
              >
                <View style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="user" size={18} color={colors.evergreen.DEFAULT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, color: colors.evergreen.DEFAULT, fontFamily: 'Geist_500Medium' }}>
                    Zaloguj się
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.ink.faint, marginTop: 1 }}>
                    Twoje dane będą bezpieczne w chmurze
                  </Text>
                </View>
                <Icon name="chevron" size={14} color={colors.ink.faint} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Powiadomienia */}
        <View className="px-5 mb-2 mt-5">
          <Text className="text-ink-soft text-[12px] font-sans-medium uppercase tracking-wide mb-2">
            {t.profile.app}
          </Text>
          <View className="bg-surface border border-line rounded-card overflow-hidden">
            <Row icon="bell" label={t.profile.notifications} onPress={() => router.push('/info?section=notifications' as any)} />
            <Divider />
            <Row icon="shield" label={t.profile.privacy} onPress={() => router.push('/info?section=privacy' as any)} />
            <Divider />
            <Row icon="info" label={t.profile.about} onPress={() => router.push('/info?section=about' as any)} />
          </View>
        </View>

        {/* Reset (dev only) */}
        <View className="px-5 mt-8">
          <Pressable onPress={handleReset} className="py-3 items-center">
            <Text className="text-danger text-[13px] font-sans-medium">{t.profile.resetProfile}</Text>
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
