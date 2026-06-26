/**
 * SzkolyScreen.tsx — wyszukiwarka szkół rodzenia i szpitali z mapą i filtrami.
 */

import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { Chip, Icon, Pill, Checkbox } from '@/components/ui';
import { MainScreenShell } from '@/components/layout/MainScreenShell';
import { PlacesMap } from '@/components/places/PlacesMap';
import { VOIVODESHIPS } from '@/constants/voivodeships';
import { useHospitals, useSchools, type Hospital, type BirthSchool } from '@/hooks/useHospitals';
import { useProfileStore } from '@/stores/profile';
import { colors } from '@/theme/tokens';
import { useT } from '@/i18n';

type TabKey = 'schools' | 'hospitals';
type SchoolType = 'all' | 'stationary' | 'online' | 'hybrid';
type ViewMode = 'list' | 'map';

export default function SzkolyScreen() {
  const router = useRouter();
  const { view } = useLocalSearchParams<{ view?: string }>();
  const profile = useProfileStore();
  const t = useT();
  const [tab, setTab] = useState<TabKey>('schools');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState(profile.city || '');
  const [voivodeshipFilter, setVoivodeshipFilter] = useState<string>(
    profile.voivodeship || 'mazowieckie'
  );
  const [schoolType, setSchoolType] = useState<SchoolType>('all');
  const [freeOnly, setFreeOnly] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (view === 'map') setViewMode('map');
  }, [view]);

  const queryFilters = useMemo(
    () => ({
      voivodeship: voivodeshipFilter === 'all' ? undefined : voivodeshipFilter,
      city: cityFilter.trim() || undefined,
      search: search.length > 1 ? search : undefined,
    }),
    [voivodeshipFilter, cityFilter, search]
  );

  const hospitalsQuery = useHospitals(queryFilters);
  const schoolsQuery = useSchools({
    ...queryFilters,
    type: schoolType,
    freeOnly,
  });

  const items = tab === 'schools' ? schoolsQuery.data ?? [] : hospitalsQuery.data ?? [];
  const isLoading = tab === 'schools' ? schoolsQuery.isLoading : hospitalsQuery.isLoading;
  const resultCount = items.length;

  const toggleSelect = (id: string) => {
    setSelectedIds((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : s.length < 3 ? [...s, id] : s
    );
  };

  const openCompare = () => {
    if (selectedIds.length < 2) return;
    router.push({
      pathname: '/compare',
      params: { ids: selectedIds.join(','), type: tab },
    });
  };

  const openDetail = (id: string) => {
    router.push(`/school/${id}` as any);
  };

  const renderItem = ({ item }: { item: Hospital | BirthSchool }) => {
    if (tab === 'schools') {
      const s = item as BirthSchool;
      return (
        <SchoolCard
          school={s}
          selected={selectedIds.includes(s.id)}
          onSelect={() => toggleSelect(s.id)}
          onOpen={() => openDetail(s.id)}
          onMap={() => setViewMode('map')}
        />
      );
    }
    const h = item as Hospital;
    return (
      <HospitalCard
        hospital={h}
        selected={selectedIds.includes(h.id)}
        onSelect={() => toggleSelect(h.id)}
        onOpen={() => openDetail(h.id)}
        onMap={() => setViewMode('map')}
      />
    );
  };

  return (
    <MainScreenShell>
      <View className="px-5 pt-3 pb-2">
        <Text className="font-serif text-[28px] text-ink leading-tight">{t.schools.title}</Text>
        {!isLoading && (
          <Text className="text-ink-faint text-[12px] mt-1">
            {tab === 'schools' ? t.schools.countSchools(resultCount) : t.schools.countHospitals(resultCount)}
            {' '}{voivodeshipFilter === 'all' ? t.schools.filterAll : t.schools.filterVoiv(voivodeshipFilter)}
          </Text>
        )}
      </View>

      {/* Tabs */}
      <View className="px-5 mb-2">
        <View className="flex-row bg-surface border border-line rounded-card p-1">
          <SegmentButton active={tab === 'schools'} onPress={() => setTab('schools')}>
            {t.schools.birthSchools}
          </SegmentButton>
          <SegmentButton active={tab === 'hospitals'} onPress={() => setTab('hospitals')}>
            {t.schools.hospitals}
          </SegmentButton>
        </View>
      </View>

      {/* Województwo + miasto */}
      <View className="px-5 mb-2 gap-2">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, paddingRight: 8 }}
        >
          <Chip
            size="sm"
            active={voivodeshipFilter === 'all'}
            onPress={() => setVoivodeshipFilter('all')}
          >
            {t.schools.allPoland}
          </Chip>
          {VOIVODESHIPS.map((v) => (
            <Chip
              key={v}
              size="sm"
              active={voivodeshipFilter === v}
              onPress={() => setVoivodeshipFilter(v)}
            >
              {formatVoivodeshipShort(v)}
            </Chip>
          ))}
        </ScrollView>

        <View className="flex-row gap-2">
          <View className="flex-1 flex-row items-center gap-2 bg-surface border border-line rounded-card px-3 py-2">
            <Icon name="pin" size={14} color={colors.ink.faint} />
            <TextInput
              value={cityFilter}
              onChangeText={setCityFilter}
              placeholder={t.schools.cityPlaceholder}
              placeholderTextColor={colors.ink.faint}
              className="text-ink text-[13px] flex-1 py-0"
            />
          </View>
          <View className="flex-row bg-surface border border-line rounded-card p-0.5">
            <ViewModeButton active={viewMode === 'list'} onPress={() => setViewMode('list')} icon="list" />
            <ViewModeButton active={viewMode === 'map'} onPress={() => setViewMode('map')} icon="pin" />
          </View>
        </View>
      </View>

      {/* Search */}
      <View className="px-5 mb-2">
        <View className="flex-row items-center gap-2 bg-surface border border-line rounded-card px-3 py-2">
          <Icon name="search" size={16} color={colors.ink.faint} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={tab === 'schools' ? t.schools.searchSchool : t.schools.searchHospital}
            placeholderTextColor={colors.ink.faint}
            className="text-ink text-[13px] flex-1 py-0"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Icon name="cross" size={14} color={colors.ink.faint} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filtry szkół — kompaktowe */}
      {tab === 'schools' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-2 max-h-8"
          contentContainerStyle={{ gap: 6, paddingHorizontal: 20, alignItems: 'center' }}
        >
          <Chip size="sm" active={schoolType === 'all'} onPress={() => setSchoolType('all')}>
            {t.schools.all}
          </Chip>
          <Chip size="sm" active={schoolType === 'stationary'} onPress={() => setSchoolType('stationary')}>
            {t.schools.stationary}
          </Chip>
          <Chip size="sm" active={schoolType === 'online'} onPress={() => setSchoolType('online')} icon="globe">
            {t.schools.online}
          </Chip>
          <Chip size="sm" active={schoolType === 'hybrid'} onPress={() => setSchoolType('hybrid')}>
            {t.schools.hybrid}
          </Chip>
          <Chip size="sm" active={freeOnly} onPress={() => setFreeOnly(!freeOnly)}>
            {t.schools.nfzFree}
          </Chip>
        </ScrollView>
      )}

      {/* Mapa — pełny widok bez listy pod spodem */}
      {viewMode === 'map' && (
        isLoading ? (
          <View className="flex-1 items-center justify-center gap-2">
            <ActivityIndicator color={colors.evergreen.DEFAULT} />
            <Text className="text-ink-faint text-[12px]">{t.schools.loading}</Text>
          </View>
        ) : items.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <PlacesMap
            expanded
            places={items.map((item) => ({
              id: item.id,
              name: item.name,
              city: 'city' in item ? item.city : null,
              voivodeship: item.voivodeship,
              lat: item.lat,
              lng: item.lng,
              is_nfz: 'is_nfz_free' in item ? item.is_nfz_free : item.is_nfz,
            }))}
            voivodeship={voivodeshipFilter === 'all' ? undefined : voivodeshipFilter}
            onSelect={openDetail}
          />
        )
      )}

      {/* Lista */}
      {viewMode === 'list' && (
        isLoading ? (
          <View className="flex-1 items-center justify-center gap-2">
            <ActivityIndicator color={colors.evergreen.DEFAULT} />
            <Text className="text-ink-faint text-[12px]">{t.schools.loading}</Text>
          </View>
        ) : items.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <FlashList
            data={items}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: selectedIds.length >= 2 ? 100 : 120 }}
            ItemSeparatorComponent={() => <View className="h-2" />}
          />
        )
      )}

      {selectedIds.length >= 2 && (
        <View className="absolute bottom-20 left-4 right-4">
          <Pressable
            onPress={openCompare}
            className="bg-evergreen rounded-card px-5 py-4 flex-row items-center justify-center gap-2 active:opacity-90"
          >
            <Icon name="layers" size={18} color={colors.cream.DEFAULT} />
            <Text className="text-cream font-sans-medium text-[15px]">
              {t.schools.compareN(selectedIds.length)}
            </Text>
          </Pressable>
        </View>
      )}

    </MainScreenShell>
  );
}

function formatVoivodeshipShort(name: string): string {
  const short: Record<string, string> = {
    'dolnośląskie': 'Dolnośl.',
    'kujawsko-pomorskie': 'Kuj.-pom.',
    lubelskie: 'Lubelskie',
    lubuskie: 'Lubuskie',
    'łódzkie': 'Łódzkie',
    'małopolskie': 'Małopol.',
    mazowieckie: 'Mazow.',
    opolskie: 'Opolskie',
    podkarpackie: 'Podkarpackie',
    podlaskie: 'Podlaskie',
    pomorskie: 'Pomorskie',
    'śląskie': 'Śląskie',
    'świętokrzyskie': 'Świętokrz.',
    'warmińsko-mazurskie': 'Warm.-maz.',
    wielkopolskie: 'Wielkopol.',
    zachodniopomorskie: 'Zach.-pom.',
  };
  return short[name] ?? name;
}

function ViewModeButton({
  active,
  onPress,
  icon,
}: {
  active: boolean;
  onPress: () => void;
  icon: 'list' | 'pin';
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`w-9 h-9 items-center justify-center rounded-[12px] ${
        active ? 'bg-evergreen' : 'bg-transparent'
      }`}
    >
      <Icon name={icon} size={16} color={active ? colors.cream.DEFAULT : colors.ink.soft} />
    </Pressable>
  );
}

function SegmentButton({
  active,
  onPress,
  children,
}: {
  active: boolean;
  onPress: () => void;
  children: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 min-h-[38px] items-center justify-center rounded-[14px] px-2 ${
        active ? 'bg-evergreen' : 'bg-transparent'
      }`}
    >
      <Text
        numberOfLines={1}
        className={`text-[12px] font-sans-medium text-center ${
          active ? 'text-cream' : 'text-ink-soft'
        }`}
      >
        {children}
      </Text>
    </Pressable>
  );
}

function SchoolCard({
  school, selected, onSelect, onOpen, onMap,
}: { school: BirthSchool; selected: boolean; onSelect: () => void; onOpen: () => void; onMap: () => void }) {
  const t = useT();
  const hasMap = !!(school.lat && school.lng) || !!school.address_full;
  return (
    <View className="bg-surface border border-line rounded-card overflow-hidden">
      <Pressable onPress={onOpen} className="p-4 active:opacity-80">
        <View className="flex-row justify-between items-start mb-2">
          <View className="flex-1 mr-3">
            <Text className="text-ink font-sans-medium text-[15px] leading-tight">{school.name}</Text>
            <View className="flex-row items-center gap-1.5 mt-1.5 flex-wrap">
              <Pill tone={school.is_nfz_free ? 'sage' : 'mustard'}>
                {school.is_nfz_free ? t.schools.nfzFree : t.schools.schoolPrivate}
              </Pill>
              <Pill tone="neutral">
                {school.type === 'online' ? t.schools.schoolOnline : school.type === 'hybrid' ? t.schools.schoolHybrid : t.schools.schoolStationary}
              </Pill>
              {school.city && (
                <View className="flex-row items-center gap-1">
                  <Icon name="pin" size={11} color={colors.ink.faint} />
                  <Text className="text-ink-faint text-[11px]">{school.city}</Text>
                </View>
              )}
            </View>
          </View>
          <Text className={`font-mono text-[13px] ${school.is_nfz_free ? 'text-sage' : 'text-ink'}`}>
            {school.is_nfz_free
              ? t.schools.schoolFree
              : school.payment ?? (school.price_pln ? `${school.price_pln} zł` : t.schools.schoolPaid)}
          </Text>
        </View>

        {school.description && (
          <Text className="text-ink-soft text-[12px] leading-snug mt-1" numberOfLines={2}>
            {school.description}
          </Text>
        )}

        <View className="flex-row items-center justify-between mt-1.5">
          {school.rating ? (
            <View className="flex-row items-center gap-1">
              <Icon name="star" size={12} color={colors.terracotta.DEFAULT} />
              <Text className="text-ink text-[11px] font-sans-medium">
                {school.rating.toFixed(1).replace('.', ',')}
              </Text>
            </View>
          ) : (
            <View />
          )}
          {school.schedule && (
            <Text className="text-ink-faint text-[11px] flex-1 text-right ml-2" numberOfLines={1}>
              {school.schedule}
            </Text>
          )}
        </View>
      </Pressable>

      <View className={`flex-row border-t ${selected ? 'border-sage' : 'border-line'}`}>
        <Pressable
          onPress={onSelect}
          className={`flex-1 flex-row items-center gap-2 px-4 py-2 ${selected ? 'bg-sage-soft' : ''}`}
        >
          <Checkbox checked={selected} size={16} />
          <Text className={`text-[11px] font-sans-medium ${selected ? 'text-evergreen' : 'text-ink-soft'}`}>
            {t.schools.compareBtn}
          </Text>
        </Pressable>
        {hasMap && (
          <Pressable
            onPress={onMap}
            className="flex-row items-center gap-1.5 px-4 py-2 border-l border-line"
          >
            <Icon name="pin" size={13} color={colors.evergreen.DEFAULT} />
            <Text className="text-evergreen text-[11px] font-sans-medium">{t.schools.mapBtn}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function HospitalCard({
  hospital, selected, onSelect, onOpen, onMap,
}: { hospital: Hospital; selected: boolean; onSelect: () => void; onOpen: () => void; onMap: () => void }) {
  const t = useT();
  const hasMap = !!(hospital.lat && hospital.lng) || !!hospital.address_full;
  return (
    <View className="bg-surface border border-line rounded-card overflow-hidden">
      <Pressable onPress={onOpen} className="p-4 active:opacity-80">
        <Text className="text-ink font-sans-medium text-[15px] leading-tight">{hospital.name}</Text>
        {hospital.description && (
          <Text className="text-ink-soft text-[12px] leading-snug mt-1.5" numberOfLines={2}>
            {hospital.description}
          </Text>
        )}
        <View className="flex-row items-center gap-1.5 mt-1.5 flex-wrap">
          <Pill tone={hospital.is_nfz !== false ? 'sage' : 'mustard'}>
            {hospital.is_nfz !== false ? t.schools.nfzFree : t.schools.hospitalPrivate}
          </Pill>
          {hospital.city && (
            <View className="flex-row items-center gap-1">
              <Icon name="pin" size={11} color={colors.ink.faint} />
              <Text className="text-ink-faint text-[11px]">
                {hospital.city}{hospital.voivodeship ? `, ${hospital.voivodeship}` : ''}
              </Text>
            </View>
          )}
        </View>
        <View className="flex-row items-center gap-3 mt-2">
          {hospital.has_anesthesia && <Pill tone="sage">{t.schools.anesthesia}</Pill>}
          {hospital.rating && (
            <View className="flex-row items-center gap-1">
              <Icon name="star" size={12} color={colors.terracotta.DEFAULT} />
              <Text className="text-ink text-[11px]">{hospital.rating.toFixed(1).replace('.', ',')}</Text>
            </View>
          )}
        </View>
      </Pressable>

      <View className={`flex-row border-t ${selected ? 'border-sage' : 'border-line'}`}>
        <Pressable
          onPress={onSelect}
          className={`flex-1 flex-row items-center gap-2 px-4 py-2 ${selected ? 'bg-sage-soft' : ''}`}
        >
          <Checkbox checked={selected} size={16} />
          <Text className={`text-[11px] font-sans-medium ${selected ? 'text-evergreen' : 'text-ink-soft'}`}>
            {t.schools.compareBtn}
          </Text>
        </Pressable>
        {hasMap && (
          <Pressable
            onPress={onMap}
            className="flex-row items-center gap-1.5 px-4 py-2 border-l border-line"
          >
            <Icon name="pin" size={13} color={colors.evergreen.DEFAULT} />
            <Text className="text-evergreen text-[11px] font-sans-medium">{t.schools.mapBtn}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function EmptyState({ tab }: { tab: TabKey }) {
  const t = useT();
  return (
    <View className="flex-1 items-center justify-center gap-3 px-8">
      <View className="w-14 h-14 bg-sage-soft rounded-full items-center justify-center">
        <Icon name="search" size={24} color={colors.evergreen.DEFAULT} />
      </View>
      <Text className="text-ink font-sans-medium text-[15px] text-center">{t.schools.noResults}</Text>
      <Text className="text-ink-soft text-[12px] text-center leading-snug">
        {tab === 'schools' ? t.schools.noResultsSchools : t.schools.noResultsHospitals}
      </Text>
    </View>
  );
}
