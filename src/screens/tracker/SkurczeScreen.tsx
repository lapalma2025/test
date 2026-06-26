import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Icon } from '@/components/ui';
import { useTrackersStore, type ContractionSession } from '@/stores/trackers';
import { colors } from '@/theme/tokens';
import { useT } from '@/i18n';
import { useLanguageStore } from '@/stores/language';

const pad = (n: number) => String(n).padStart(2, '0');
const fmtTime = (s: number) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

function formatDateLabel(ts: number, locale: string, todayStr: string, yesterdayStr: string) {
  const d = new Date(ts);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (d.toDateString() === now.toDateString()) return `${todayStr}, ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `${yesterdayStr}, ${time}`;
  return `${d.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} · ${time}`;
}

function formatDayLabel(ts: number, locale: string, todayStr: string, yesterdayStr: string) {
  const d = new Date(ts);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return todayStr;
  if (d.toDateString() === yesterday.toDateString()) return yesterdayStr;
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

const BACK_BTN = {
  width: 40, height: 40, borderRadius: 12, borderWidth: 0.5,
  borderColor: colors.line.DEFAULT, backgroundColor: colors.surface.DEFAULT,
  alignItems: 'center' as const, justifyContent: 'center' as const,
};

export default function SkurczeScreen() {
  const router = useRouter();
  const t = useT();
  const lang = useLanguageStore((s) => s.lang);
  const locale = lang === 'en' ? 'en-GB' : 'pl-PL';
  const todayStr = t.common.today;
  const yesterdayStr = t.common.yesterday;
  const {
    contractionSessions, activeContractionSessionId,
    startContractionSession, startContraction, endContraction, endContractionSession,
    deleteContractionSession, deleteContraction,
  } = useTrackersStore();

  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 250);
    return () => clearInterval(id);
  }, []);

  // Auto-start session on mount if none active
  useEffect(() => {
    if (!activeContractionSessionId) {
      startContractionSession();
    }
  }, []);

  const activeSession = contractionSessions.find((s) => s.id === activeContractionSessionId);
  const contractions = activeSession?.contractions ?? [];
  const lastC = contractions[contractions.length - 1];
  const isRunning = !!(lastC && !lastC.endedAt);

  const elapsed = isRunning ? Math.floor((Date.now() - lastC.startedAt) / 1000) : 0;

  const done = contractions.filter((c) => c.endedAt);
  const avgGap = done.length >= 2
    ? Math.round(
        done.slice(0, 3).reduce((sum, c, i, arr) => {
          if (i === 0) return sum;
          return sum + Math.floor((arr[i]!.startedAt - arr[i - 1]!.startedAt) / 1000);
        }, 0) / Math.min(3, done.length - 1)
      )
    : 0;
  const lastDone = done[done.length - 1];
  const lastDur = lastDone
    ? Math.floor(((lastDone.endedAt ?? 0) - lastDone.startedAt) / 1000)
    : 0;
  const count = done.length;
  const near = avgGap > 0 && avgGap <= 300;

  const handleToggle = () => {
    if (!activeContractionSessionId) {
      startContractionSession();
      return;
    }
    if (isRunning) {
      endContraction();
    } else {
      startContraction();
    }
  };

  const handleDeleteContraction = (contractionId: string) => {
    if (!activeContractionSessionId) return;
    Alert.alert(t.contractions.deleteContraction, t.contractions.deleteContractionMsg, [
      { text: t.common.cancel, style: 'cancel' },
      {
        text: t.common.delete, style: 'destructive',
        onPress: () => deleteContraction(activeContractionSessionId, contractionId),
      },
    ]);
  };

  const handleDeleteSession = (id: string) => {
    Alert.alert(t.contractions.deleteSession, t.common.deleteConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.common.delete, style: 'destructive', onPress: () => deleteContractionSession(id) },
    ]);
  };

  // Log for display (reversed, most recent first)
  const logItems = done
    .map((c, i) => {
      const dur = Math.floor(((c.endedAt ?? 0) - c.startedAt) / 1000);
      const prev = done[i - 1];
      const gap = prev ? Math.floor((c.startedAt - prev.startedAt) / 1000) : 0;
      return { id: c.id, dur, gap, ts: c.startedAt, label: formatDateLabel(c.startedAt, locale, todayStr, yesterdayStr) };
    })
    .reverse();

  // Past completed sessions (not the current active one)
  const pastSessions = contractionSessions.filter(
    (s) => s.id !== activeContractionSessionId && !s.active
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* TopBar */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          paddingHorizontal: 18, paddingVertical: 14,
          backgroundColor: colors.cream.DEFAULT,
        }}>
          <Pressable onPress={() => router.back()} style={BACK_BTN}>
            <Icon name="back" size={20} color={colors.ink.DEFAULT} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
              {t.contractions.title}
            </Text>
          </View>
          <Pressable
            onPress={endContractionSession}
            style={{
              paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99,
              backgroundColor: colors.line.DEFAULT,
            }}
          >
            <Text style={{ fontSize: 12, fontFamily: 'Geist_500Medium', color: colors.ink.soft }}>
              {t.contractions.newSession}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats row */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 20 }}>
            <StatBox v={avgGap > 0 ? fmtTime(avgGap) : '—'} l={t.contractions.avgInterval} />
            <StatBox v={lastDur > 0 ? fmtTime(lastDur) : '—'} l={t.contractions.lastContraction} />
            <StatBox v={String(count)} l={t.contractions.contractions} />
          </View>

          {/* Main button */}
          <Pressable
            onPress={handleToggle}
            style={{
              width: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 6, backgroundColor: isRunning ? colors.terracotta.DEFAULT : colors.evergreen.DEFAULT,
              borderRadius: 22, paddingVertical: 26,
            }}
          >
            <Icon name={isRunning ? 'pause' : 'play'} size={26} color="#F2EEE4" />
            <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 23, color: '#F2EEE4', lineHeight: 27 }}>
              {isRunning ? fmtTime(elapsed) : t.contractions.startContraction}
            </Text>
            <Text style={{ fontSize: 12.5, color: 'rgba(242,238,228,0.85)' }}>
              {isRunning ? t.contractions.ongoing : t.contractions.tapToStart}
            </Text>
          </Pressable>

          {/* Alert 5-1-1 */}
          {near && (
            <View style={{
              flexDirection: 'row', gap: 11, alignItems: 'flex-start',
              backgroundColor: colors.terracotta.soft, borderRadius: 16,
              padding: 15, marginTop: 16,
            }}>
              <Icon name="info" size={17} color={colors.terracotta.DEFAULT} />
              <Text style={{ flex: 1, fontSize: 13.5, lineHeight: 21, color: colors.ink.DEFAULT }}>
                <Text style={{ fontFamily: 'Geist_500Medium' }}>{t.contractions.every5min}</Text>
                {' '}{t.contractions.every5minDesc}
              </Text>
            </View>
          )}

          {/* Current session log */}
          {logItems.length > 0 && (
            <View style={{ marginTop: 28 }}>
              <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT, marginBottom: 12 }}>
                {activeSession
                  ? t.contractions.sessionLabel(formatDayLabel(activeSession.contractions[0]?.startedAt ?? Date.now(), locale, todayStr, yesterdayStr))
                  : t.contractions.history}
              </Text>
              <View style={{
                backgroundColor: colors.surface.DEFAULT, borderWidth: 0.5,
                borderColor: colors.line.DEFAULT, borderRadius: 16, overflow: 'hidden',
              }}>
                {/* Header */}
                <View style={{
                  flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 11,
                  backgroundColor: '#FCFBF7', borderBottomWidth: 0.5, borderBottomColor: colors.line.DEFAULT,
                }}>
                  <Text style={{ flex: 2, fontSize: 11.5, fontFamily: 'Geist_500Medium', color: colors.ink.faint, letterSpacing: 0.3 }}>
                    {t.contractions.hour}
                  </Text>
                  <Text style={{ flex: 1, fontSize: 11.5, fontFamily: 'Geist_500Medium', color: colors.ink.faint, textAlign: 'center', letterSpacing: 0.3 }}>
                    {t.contractions.duration}
                  </Text>
                  <Text style={{ flex: 1, fontSize: 11.5, fontFamily: 'Geist_500Medium', color: colors.ink.faint, textAlign: 'center', letterSpacing: 0.3 }}>
                    {t.contractions.interval}
                  </Text>
                  <View style={{ width: 32 }} />
                </View>
                {/* Rows */}
                {logItems.map((item, i) => (
                  <View
                    key={item.id}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      paddingHorizontal: 16, paddingVertical: 12,
                      borderBottomWidth: i < logItems.length - 1 ? 0.5 : 0,
                      borderBottomColor: '#EDE8DE',
                    }}
                  >
                    <Text style={{ flex: 2, fontFamily: 'GeistMono_400Regular', fontSize: 13, color: colors.ink.soft }}>
                      {item.label}
                    </Text>
                    <Text style={{ flex: 1, fontFamily: 'GeistMono_400Regular', fontSize: 13, color: colors.ink.DEFAULT, textAlign: 'center' }}>
                      {fmtTime(item.dur)}
                    </Text>
                    <Text style={{ flex: 1, fontFamily: 'GeistMono_400Regular', fontSize: 13, color: colors.evergreen.DEFAULT, textAlign: 'center' }}>
                      {item.gap > 0 ? fmtTime(item.gap) : '—'}
                    </Text>
                    <Pressable
                      onPress={() => handleDeleteContraction(item.id)}
                      style={{ width: 32, alignItems: 'center' }}
                    >
                      <Icon name="trash" size={14} color={colors.ink.faint} />
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Past sessions */}
          {pastSessions.length > 0 && (
            <View style={{ marginTop: 28 }}>
              <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT, marginBottom: 12 }}>
                {t.contractions.previousSessions}
              </Text>
              <View style={{ gap: 10 }}>
                {pastSessions.slice().reverse().map((sess) => (
                  <PastSessionRow
                    key={sess.id}
                    session={sess}
                    onDelete={() => handleDeleteSession(sess.id)}
                  />
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function PastSessionRow({
  session, onDelete,
}: {
  session: ContractionSession;
  onDelete: () => void;
}) {
  const t = useT();
  const lang = useLanguageStore((s) => s.lang);
  const locale = lang === 'en' ? 'en-GB' : 'pl-PL';
  const doneCon = session.contractions.filter((c) => c.endedAt);
  const first = session.contractions[0];
  const last = doneCon[doneCon.length - 1];
  const totalMs = first && last?.endedAt
    ? last.endedAt - first.startedAt
    : 0;

  return (
    <View style={{
      backgroundColor: colors.surface.DEFAULT, borderWidth: 0.5,
      borderColor: colors.line.DEFAULT, borderRadius: 16,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14 }}>
        <View style={{
          width: 38, height: 38, borderRadius: 11, backgroundColor: colors.terracotta.soft,
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="stopwatch" size={17} color={colors.terracotta.DEFAULT} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
            {doneCon.length} {t.contractions.contractions}
          </Text>
          <Text style={{ fontSize: 12.5, color: colors.ink.soft, marginTop: 2 }}>
            {first ? formatDateLabel(first.startedAt, locale, t.common.today, t.common.yesterday) : '—'}
            {totalMs > 0 ? ` · ${Math.round(totalMs / 60000)} min` : ''}
          </Text>
        </View>
      </View>
      <View style={{ borderTopWidth: 0.5, borderTopColor: colors.line.DEFAULT }}>
        <Pressable
          onPress={onDelete}
          style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            gap: 6, paddingVertical: 10,
          }}
        >
          <Icon name="trash" size={14} color={colors.ink.faint} />
          <Text style={{ fontSize: 12.5, color: colors.ink.faint }}>{t.contractions.deleteSession}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function StatBox({ v, l }: { v: string; l: string }) {
  return (
    <View style={{
      flex: 1, backgroundColor: colors.surface.DEFAULT, borderWidth: 0.5,
      borderColor: colors.line.DEFAULT, borderRadius: 13, padding: 13, alignItems: 'center',
    }}>
      <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 19, color: colors.ink.DEFAULT }}>
        {v}
      </Text>
      <Text style={{ fontSize: 11, color: colors.ink.faint, marginTop: 3 }}>{l}</Text>
    </View>
  );
}
