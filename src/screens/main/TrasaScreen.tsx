import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { format, differenceInDays } from 'date-fns';
import { pl as dateFnsPl, enUS } from 'date-fns/locale';

import { Kicker, IconBadge, Icon } from '@/components/ui';
import { MainScreenShell } from '@/components/layout/MainScreenShell';
import { useProfileStore } from '@/stores/profile';
import { checkEligibility, calculateTotalYearOneProjection } from '@/engine/eligibility-engine';
import { generateTimeline, type TaskItem } from '@/engine/timeline-generator';
import benefitsData from '@/data/benefits.json';
import { colors } from '@/theme/tokens';
import { useT } from '@/i18n';
import { useLanguageStore } from '@/stores/language';

// @ts-ignore
import weekDataJson from '../../../assets/ciaza-tydzien-po-tygodniu.json';

// ============ PREGNANCY WEEK HELPERS ============

const FRUIT_EMOJI: Record<string, string> = {
  'brak': '🌱', 'mak': '🌱', 'sezam': '🌿', 'soczewica': '🫘', 'borówka': '🫐',
  'malina': '🍓', 'winogrono': '🍇', 'wiśnia': '🍒',
  'truskawka': '🍓', 'figa': '🫐', 'limonka': '🍋',
  'brzoskwinia': '🍑', 'cytryna': '🍋', 'jabłko': '🍎', 'awokado': '🥑',
  'gruszka': '🍐', 'papryka': '🫑', 'mango': '🥭',
  'banan': '🍌', 'marchewka': '🥕', 'papaja': '🌴',
  'grejpfrut': '🍊', 'kukurydz': '🌽', 'kalarepa': '🥦',
  'kalafior': '🥦', 'sałat': '🥬', 'bakłażan': '🍆', 'dynia': '🎃',
  'kokos': '🥥', 'kapust': '🥬', 'ananas': '🍍', 'melon': '🍈',
  'burak': '🥬', 'por': '🌿', 'arbuz': '🍉',
};

function fruitEmoji(porownanie: string): string {
  const lower = (porownanie ?? '').toLowerCase();
  for (const [key, emoji] of Object.entries(FRUIT_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return '👶';
}

function calcPregnancyWeek(dueDateStr: string | null | undefined, now: Date): number | null {
  if (!dueDateStr) return null;
  try {
    const dueDate = new Date(dueDateStr);
    const daysLeft = differenceInDays(dueDate, now);
    const week = 40 - Math.round(daysLeft / 7);
    return Math.max(1, Math.min(42, week));
  } catch {
    return null;
  }
}

function weekForStage(stageId: string, currentWeek: number | null, isCurrentStage: boolean, isPastStage: boolean): number | null {
  if (!currentWeek) return null;
  if (isCurrentStage) return currentWeek;
  const STAGE_WEEKS: Record<string, [number, number]> = {
    t1: [1, 13], t2: [14, 27], t3: [28, 42],
    d07: [38, 40], d830: [40, 42], d31180: [40, 42],
    m612: [40, 42], m1235: [40, 42],
  };
  const range = STAGE_WEEKS[stageId];
  if (!range) return null;
  if (isPastStage) return range[1];
  return range[0];
}

export default function TrasaScreen() {
  const router = useRouter();
  const profile = useProfileStore();
  const t = useT();
  const lang = useLanguageStore((s) => s.lang);
  const now = new Date();

  const { timeline, results, totalProjected } = useMemo(() => {
    const userProfile = profile.toUserProfile();
    // @ts-ignore JSON import
    const results = checkEligibility(userProfile, benefitsData, now);
    const timeline = generateTimeline(userProfile, results, now, t.timeline);
    const totalProjected = calculateTotalYearOneProjection(results);
    return { timeline, results, totalProjected };
  }, [
    profile.childBirthDate, profile.childDueDate, profile.employment,
    profile.partnerEmployment, profile.firstChild, profile.hasDisability, lang,
  ]);

  const currentPregnancyWeek = calcPregnancyWeek(profile.childDueDate, now);

  const [viewIdx, setViewIdx] = useState(timeline.currentStageIndex);
  const currentIdx = timeline.currentStageIndex;
  const viewStage = timeline.stages[viewIdx];
  const isBrowsing = viewIdx !== currentIdx;

  if (!viewStage) {
    return (
      <MainScreenShell className="items-center justify-center">
        <Text className="text-ink-soft">{t.route.noData}</Text>
      </MainScreenShell>
    );
  }

  const handleOpenLink = (link?: string) => {
    if (!link) return;
    if (link.startsWith('tab:')) router.push(`/(tabs)/${link.slice(4)}` as any);
    else if (link.startsWith('benefit:')) router.push(`/benefit/${link.slice(8)}` as any);
    else if (link.startsWith('task:')) router.push(`/task/${link.slice(5)}` as any);
  };

  const goToPrev = () => setViewIdx((i) => Math.max(0, i - 1));
  const goToNext = () => setViewIdx((i) => Math.min(timeline.stages.length - 1, i + 1));
  const goToCurrent = () => setViewIdx(currentIdx);

  const dateLocale = lang === 'en' ? enUS : dateFnsPl;

  return (
    <MainScreenShell>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View className="px-5 pt-2 pb-3 flex-row justify-between items-start">
          <View>
            <Text className="text-ink text-[17px] font-sans-medium">
              {t.route.greeting}{profile.parentName ? `, ${profile.parentName}` : ''}
            </Text>
            <Text className="text-ink-faint text-[13px] mt-0.5">
              {format(now, 'EEEE, d MMMM', { locale: dateLocale })}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push('/info?section=notifications' as any)}
            className="w-10 h-10 items-center justify-center bg-surface border border-line rounded-full active:opacity-70"
          >
            <Icon name="bell" size={20} color={colors.ink.DEFAULT} />
          </Pressable>
        </View>

        {/* Stage + navigation */}
        <View className="px-5 py-3">

          {/* Stage bar */}
          <View className="flex-row gap-1 mb-4">
            {timeline.stages.map((s, i) => (
              <Pressable
                key={s.id}
                onPress={() => setViewIdx(i)}
                className="flex-1 py-2 -my-2"
                hitSlop={{ top: 8, bottom: 8 }}
              >
                <View
                  className={`h-1.5 rounded-full ${
                    i === viewIdx
                      ? 'bg-evergreen'
                      : i === currentIdx
                      ? 'bg-sage'
                      : i < currentIdx
                      ? 'bg-sage/50'
                      : 'bg-line'
                  }`}
                />
              </Pressable>
            ))}
          </View>

          {/* Prev/next navigation */}
          <View className="flex-row items-center justify-between mb-3">
            <Pressable
              onPress={goToPrev}
              disabled={viewIdx === 0}
              className="w-9 h-9 items-center justify-center rounded-full bg-surface border border-line active:opacity-60 disabled:opacity-30"
            >
              <Icon name="back" size={16} color={viewIdx === 0 ? colors.ink.faint : colors.ink.DEFAULT} />
            </Pressable>

            <View className="flex-1 items-center px-2">
              {isBrowsing ? (
                <Pressable onPress={goToCurrent} className="flex-row items-center gap-1.5 active:opacity-70">
                  <View className="w-1.5 h-1.5 rounded-full bg-evergreen" />
                  <Text className="text-evergreen text-[12px] font-sans-medium">{t.route.backToNow}</Text>
                </Pressable>
              ) : (
                <View className="flex-row items-center gap-1.5">
                  <View className="w-1.5 h-1.5 rounded-full bg-evergreen" />
                  <Text className="text-evergreen text-[12px] font-sans-medium">{t.route.yourStage}</Text>
                </View>
              )}
              <Text className="text-ink-faint text-[11px] mt-0.5">
                {t.route.stageOf(viewIdx + 1, timeline.stages.length, viewStage.band)}
              </Text>
            </View>

            <Pressable
              onPress={goToNext}
              disabled={viewIdx === timeline.stages.length - 1}
              className="w-9 h-9 items-center justify-center rounded-full bg-surface border border-line active:opacity-60"
            >
              <Icon
                name="arrow"
                size={16}
                color={viewIdx === timeline.stages.length - 1 ? colors.ink.faint : colors.ink.DEFAULT}
              />
            </Pressable>
          </View>

          {/* Stage title */}
          <Kicker>{viewStage.kicker}</Kicker>
          <Text className="font-serif text-[32px] text-ink leading-none mt-1">{viewStage.big}</Text>
          <Text className="text-ink-soft text-[14px] mt-2 leading-snug">{viewStage.sub}</Text>

          {/* Browsing past/future badge */}
          {isBrowsing && (
            <View className={`flex-row items-center gap-1.5 mt-3 self-start px-3 py-1.5 rounded-full ${
              viewIdx < currentIdx ? 'bg-sage-soft' : 'bg-blush-soft'
            }`}>
              <Icon
                name={viewIdx < currentIdx ? 'check' : 'clock'}
                size={12}
                color={viewIdx < currentIdx ? colors.evergreen.DEFAULT : colors.terracotta.DEFAULT}
              />
              <Text className={`text-[11px] font-sans-medium ${
                viewIdx < currentIdx ? 'text-evergreen' : 'text-terracotta-dark'
              }`}>
                {viewIdx < currentIdx ? t.route.browsingPast : t.route.browsingFuture}
              </Text>
            </View>
          )}
        </View>

        {/* HERO */}
        <View className="px-5 pt-3">
          <Pressable
            onPress={() => handleOpenLink(viewStage.hero.link)}
            className={`rounded-hero p-5 active:opacity-90 ${
              isBrowsing
                ? viewIdx < currentIdx
                  ? 'bg-sage'
                  : 'bg-ink'
                : 'bg-evergreen'
            }`}
          >
            <View className="flex-row justify-between items-center mb-2.5">
              <Text className="text-cream/70 text-[11px] uppercase tracking-wider font-sans-medium">
                {isBrowsing
                  ? viewIdx < currentIdx ? t.route.past : t.route.upcoming
                  : viewStage.hero.urgent ? t.route.urgentNow : t.route.nowLabel}
              </Text>
              {!isBrowsing && viewStage.hero.urgent && (
                <View className="bg-mustard px-2 py-0.5 rounded-full flex-row items-center gap-1">
                  <Icon name="clock" size={11} color="#2C1A0A" />
                  <Text className="text-[10px] font-sans-medium" style={{ color: '#2C1A0A' }}>{t.route.deadlineSoon}</Text>
                </View>
              )}
            </View>
            <Text className="text-cream font-sans-medium text-[18px] leading-tight">
              {viewStage.hero.title}
            </Text>
            <Text className="text-cream/70 text-[13px] leading-snug mt-1.5 mb-4">
              {viewStage.hero.note}
            </Text>
            {viewStage.hero.link && (
              <View className="flex-row gap-2">
                <View className="bg-cream/15 px-4 py-2 rounded-card flex-row items-center gap-1.5">
                  <Text className="text-cream font-sans-medium text-[13px]">{t.route.open}</Text>
                  <Icon name="arrow" size={14} color={colors.cream.DEFAULT} />
                </View>
              </View>
            )}
          </Pressable>
        </View>

        {/* Stage tasks */}
        <View className="px-5 pt-6">
          <View className="flex-row justify-between items-baseline mb-3">
            <Text className="text-ink text-[15px] font-sans-medium">
              {isBrowsing ? t.route.tasksInStage : t.route.next30days}
            </Text>
            <Pressable onPress={() => router.push('/timeline' as any)} className="active:opacity-60">
              <Text className="text-sage text-[12px] font-sans-medium">{t.route.fullTimeline}</Text>
            </Pressable>
          </View>
          <View className="gap-2">
            {viewStage.next.map((task) => (
              <TaskCard key={task.id} task={task} onPress={() => handleOpenLink(task.link)} />
            ))}
          </View>
        </View>

        {/* Pregnancy week card — only for t1/t2/t3 stages */}
        {['t1', 't2', 't3'].includes(viewStage.id) && (
          <WeekCard
            stageId={viewStage.id}
            currentWeek={currentPregnancyWeek}
            isCurrentStage={viewIdx === currentIdx}
            isPastStage={viewIdx < currentIdx}
            onPress={(w) => router.push(`/week/${w}` as any)}
            t={t}
          />
        )}

        {/* Benefits card */}
        <View className="px-5 pt-6">
          <Pressable
            onPress={() => router.push('/(tabs)/pieniadze')}
            className="bg-surface border border-line rounded-card p-4 active:opacity-90"
          >
            <View className="flex-row justify-between items-center mb-2">
              <Kicker>{t.route.youAreEntitled}</Kicker>
              <Icon name="wallet" size={18} color={colors.evergreen.DEFAULT} />
            </View>
            <Text className="font-serif text-[28px] text-ink leading-none">
              {formatPLN(totalProjected)}
            </Text>
            <Text className="text-ink-soft text-[12px] mt-1">
              {t.route.benefitsProjection(results.filter((r) => ['eligible', 'action', 'active'].includes(r.eligibility)).length)}
            </Text>
            <View className="flex-row items-center gap-1 mt-3">
              <Text className="text-sage text-[13px] font-sans-medium">{t.route.seeBenefits}</Text>
              <Icon name="arrow" size={14} color={colors.sage.DEFAULT} />
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </MainScreenShell>
  );
}

// ============ WEEK CARD ============

function WeekCard({
  stageId,
  currentWeek,
  isCurrentStage,
  isPastStage,
  onPress,
  t,
}: {
  stageId: string;
  currentWeek: number | null;
  isCurrentStage: boolean;
  isPastStage: boolean;
  onPress: (week: number) => void;
  t: ReturnType<typeof useT>;
}) {
  const displayWeek = weekForStage(stageId, currentWeek, isCurrentStage, isPastStage);
  if (!displayWeek) return null;

  const weekObj = (weekDataJson as any).tygodnie.find((t: any) => t.tydzien === displayWeek);
  if (!weekObj) return null;

  const emoji = fruitEmoji(weekObj.rozmiar_dziecka.porownanie);
  const tri = weekObj.trymestr;
  const trimBg = tri === 1 ? 'bg-sage-soft' : tri === 2 ? 'bg-blush-soft' : 'bg-mustard/20';
  const trimText = tri === 1 ? 'text-evergreen' : tri === 2 ? 'text-terracotta-dark' : 'text-ink';

  return (
    <View className="px-5 pt-5">
      <Text className="text-ink text-[15px] font-sans-medium mb-3">{t.route.yourPregnancyWeek}</Text>
      <Pressable
        onPress={() => onPress(displayWeek)}
        className={`rounded-card border border-line overflow-hidden active:opacity-80 ${trimBg}`}
      >
        {/* Header */}
        <View className="flex-row items-center px-4 pt-4 pb-3">
          <View className="flex-1">
            {isCurrentStage ? null : (
              <Text className="text-ink-faint text-[10px] uppercase tracking-wide mb-1">
                {isPastStage ? t.route.lastWeekOfStage : t.route.firstWeekOfStage}
              </Text>
            )}
            <Text className={`font-serif text-[24px] leading-none ${trimText}`}>
              {t.week.title(displayWeek)}
            </Text>
            <Text className={`font-sans-medium text-[13px] mt-0.5 ${trimText}`}>
              {weekObj.etap_nazwa}
            </Text>
          </View>
          <View className="items-center ml-4">
            <Text className="text-[44px]">{emoji}</Text>
            <Text className="text-ink-faint text-[10px] text-center mt-0.5" numberOfLines={1}>
              {weekObj.rozmiar_dziecka.porownanie}
            </Text>
          </View>
        </View>

        {/* Size strip */}
        {(weekObj.rozmiar_dziecka.dlugosc !== '—' || weekObj.rozmiar_dziecka.waga !== '—') && (
          <View className="flex-row px-4 pb-3 gap-5">
            {weekObj.rozmiar_dziecka.dlugosc !== '—' && (
              <View>
                <Text className="text-ink-faint text-[10px] uppercase">{t.week.length}</Text>
                <Text className={`font-sans-medium text-[13px] ${trimText}`}>
                  {weekObj.rozmiar_dziecka.dlugosc}
                </Text>
              </View>
            )}
            {weekObj.rozmiar_dziecka.waga !== '—' && (
              <View>
                <Text className="text-ink-faint text-[10px] uppercase">{t.week.weight}</Text>
                <Text className={`font-sans-medium text-[13px] ${trimText}`}>
                  {weekObj.rozmiar_dziecka.waga}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Summary snippet */}
        <View className="bg-white/50 px-4 py-3 flex-row items-center gap-3">
          <Text className="text-ink text-[12px] leading-snug flex-1" numberOfLines={2}>
            {weekObj.podsumowanie}
          </Text>
          <View className="flex-row items-center gap-1 shrink-0">
            <Text className="text-evergreen text-[12px] font-sans-medium">{t.route.more}</Text>
            <Icon name="arrow" size={12} color={colors.evergreen.DEFAULT} />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

// ============ TASK CARD ============

function TaskCard({ task, onPress }: { task: TaskItem; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-surface border border-line rounded-card p-3.5 flex-row items-center gap-3 active:opacity-80"
    >
      <IconBadge
        name={task.icon as any}
        theme={task.theme === 'clay' ? 'clay' : task.theme === 'sand' ? 'sand' : 'sage'}
      />
      <View className="flex-1">
        <Text className="text-ink font-sans-medium text-[14px]">{task.title}</Text>
        <Text className="text-ink-soft text-[12px] mt-0.5" numberOfLines={2}>
          {task.note}
        </Text>
      </View>
      <Icon name="chevron" size={16} color={colors.ink.faint} />
    </Pressable>
  );
}

function formatPLN(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
    maximumFractionDigits: 0,
  }).format(amount);
}
