import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Icon } from '@/components/ui';
import { useTrackersStore, type ContractionSession } from '@/stores/trackers';
import { colors } from '@/theme/tokens';

const pad = (n: number) => String(n).padStart(2, '0');
const fmtTime = (s: number) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
const MONTHS = ['sty','lut','mar','kwi','maj','cze','lip','sie','wrz','paź','lis','gru'];

function formatDateLabel(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (d.toDateString() === now.toDateString()) return `Dziś, ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Wczoraj, ${time}`;
  return `${d.getDate()} ${MONTHS[d.getMonth()]} · ${time}`;
}

function formatDayLabel(ts: number) {
  const d = new Date(ts);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return 'Dziś';
  if (d.toDateString() === yesterday.toDateString()) return 'Wczoraj';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

const BACK_BTN = {
  width: 40, height: 40, borderRadius: 12, borderWidth: 0.5,
  borderColor: colors.line.DEFAULT, backgroundColor: colors.surface.DEFAULT,
  alignItems: 'center' as const, justifyContent: 'center' as const,
};

export default function SkurczeScreen() {
  const router = useRouter();
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
    Alert.alert('Usuń skurcz', 'Usunąć ten wpis z historii?', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń', style: 'destructive',
        onPress: () => deleteContraction(activeContractionSessionId, contractionId),
      },
    ]);
  };

  const handleDeleteSession = (id: string) => {
    Alert.alert('Usuń sesję', 'Usunąć całą sesję z historii?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: () => deleteContractionSession(id) },
    ]);
  };

  // Log for display (reversed, most recent first)
  const logItems = done
    .map((c, i) => {
      const dur = Math.floor(((c.endedAt ?? 0) - c.startedAt) / 1000);
      const prev = done[i - 1];
      const gap = prev ? Math.floor((c.startedAt - prev.startedAt) / 1000) : 0;
      return { id: c.id, dur, gap, ts: c.startedAt, label: formatDateLabel(c.startedAt) };
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
              Timer skurczów
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
              Nowa
            </Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Stats row */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 20 }}>
            <StatBox v={avgGap > 0 ? fmtTime(avgGap) : '—'} l="śr. odstęp" />
            <StatBox v={lastDur > 0 ? fmtTime(lastDur) : '—'} l="ostatni skurcz" />
            <StatBox v={String(count)} l="skurczów" />
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
              {isRunning ? fmtTime(elapsed) : 'Start skurczu'}
            </Text>
            <Text style={{ fontSize: 12.5, color: 'rgba(242,238,228,0.85)' }}>
              {isRunning ? 'trwa — dotknij, by zakończyć' : 'dotknij, gdy zacznie się skurcz'}
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
                <Text style={{ fontFamily: 'Geist_500Medium' }}>Skurcze co ~5 min.</Text>
                {' '}Jeśli utrzymują się regularnie przez godzinę — przygotuj się do wyjazdu do szpitala.
              </Text>
            </View>
          )}

          {/* Current session log */}
          {logItems.length > 0 && (
            <View style={{ marginTop: 28 }}>
              <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT, marginBottom: 12 }}>
                {activeSession ? `Sesja · ${formatDayLabel(activeSession.contractions[0]?.startedAt ?? Date.now())}` : 'Historia'}
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
                    godzina
                  </Text>
                  <Text style={{ flex: 1, fontSize: 11.5, fontFamily: 'Geist_500Medium', color: colors.ink.faint, textAlign: 'center', letterSpacing: 0.3 }}>
                    czas
                  </Text>
                  <Text style={{ flex: 1, fontSize: 11.5, fontFamily: 'Geist_500Medium', color: colors.ink.faint, textAlign: 'center', letterSpacing: 0.3 }}>
                    odstęp
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
                Poprzednie sesje
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
            {doneCon.length} skurczów
          </Text>
          <Text style={{ fontSize: 12.5, color: colors.ink.soft, marginTop: 2 }}>
            {first ? formatDateLabel(first.startedAt) : '—'}
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
          <Text style={{ fontSize: 12.5, color: colors.ink.faint }}>Usuń sesję</Text>
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
