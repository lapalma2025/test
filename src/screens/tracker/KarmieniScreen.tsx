import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Icon } from '@/components/ui';
import { MedInfoCard } from '@/components/ui/MedInfoCard';
import { useTrackersStore, type FeedingSession } from '@/stores/trackers';
import { colors } from '@/theme/tokens';
import { useT } from '@/i18n';
import { useLanguageStore } from '@/stores/language';

const pad = (n: number) => String(n).padStart(2, '0');
const fmtTime = (s: number) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;

function formatHour(ts: number) {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateShort(ts: number, locale: string) {
  return new Date(ts).toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}

function todayMs() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return { start, end: start + 86400000 };
}

const BACK_BTN = {
  width: 40, height: 40, borderRadius: 12, borderWidth: 0.5,
  borderColor: colors.line.DEFAULT, backgroundColor: colors.surface.DEFAULT,
  alignItems: 'center' as const, justifyContent: 'center' as const,
};

// SIDE_LABELS is now built dynamically from translations inside the component

export default function KarmieniScreen() {
  const router = useRouter();
  const t = useT();
  const lang = useLanguageStore((s) => s.lang);
  const locale = lang === 'en' ? 'en-GB' : 'pl-PL';
  const SIDE_LABELS: Record<string, string> = {
    left: t.feeding.left, right: t.feeding.right,
    bottle: t.feeding.bottle, pump: t.feeding.pump,
  };
  const { feedingSessions, activeFeedingSessionId, startFeeding, endFeeding, deleteFeeding } =
    useTrackersStore();

  const [tick, setTick] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Pulse animation for active session
  useEffect(() => {
    if (!activeFeedingSessionId) { pulseAnim.setValue(1); return; }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.25, duration: 550, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 550, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [activeFeedingSessionId]);

  const activeSession = feedingSessions.find((s) => s.id === activeFeedingSessionId);
  const elapsed = activeSession ? Math.floor((Date.now() - activeSession.startedAt) / 1000) : 0;

  const { start, end } = todayMs();
  const todaySessions = feedingSessions.filter((s) => s.startedAt >= start && s.startedAt < end);
  const todayDone = todaySessions.filter((s) => s.endedAt);
  const lastSession = [...feedingSessions].filter((s) => s.endedAt).sort((a, b) => b.startedAt - a.startedAt)[0];

  const pastSessions = feedingSessions.filter((s) => s.endedAt && s.startedAt < start);
  const grouped: Record<string, FeedingSession[]> = {};
  pastSessions.forEach((s) => {
    const k = new Date(s.startedAt).toISOString().slice(0, 10);
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(s);
  });
  const dayKeys = Object.keys(grouped).sort((a, b) => b.localeCompare(a)).slice(0, 7);

  const handleSide = (side: FeedingSession['side']) => {
    if (activeFeedingSessionId) {
      if (activeSession?.side === side) endFeeding();
    } else {
      startFeeding(side);
    }
  };

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
              {t.feeding.title}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Last feeding card */}
          <View style={{
            backgroundColor: '#EFE9DC', borderRadius: 16, padding: 16, marginTop: 4, marginBottom: 14,
          }}>
            <Text style={{ fontSize: 11, color: colors.ink.faint, fontFamily: 'Geist_500Medium', letterSpacing: 0.4 }}>
              {t.feeding.lastFeeding}
            </Text>
            <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 17, color: colors.ink.DEFAULT, marginTop: 5 }}>
              {lastSession
                ? `${SIDE_LABELS[lastSession.side]} · ${formatHour(lastSession.startedAt)}`
                : t.feeding.noFeedings}
            </Text>
          </View>

          {/* L / P side buttons */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 10 }}>
            {(['left', 'right'] as const).map((side) => {
              const isActive = activeSession?.side === side && !!activeFeedingSessionId;
              const otherActive = !!activeFeedingSessionId && !isActive;
              return (
                <Pressable
                  key={side}
                  onPress={() => handleSide(side)}
                  style={{
                    flex: 1, position: 'relative',
                    backgroundColor: isActive ? colors.sage.soft : colors.surface.DEFAULT,
                    borderWidth: 1, borderColor: isActive ? colors.evergreen.DEFAULT : colors.line.DEFAULT,
                    borderRadius: 22, paddingVertical: 26, alignItems: 'center',
                    overflow: 'hidden',
                    opacity: otherActive ? 0.45 : 1,
                  }}
                >
                  <Text style={{
                    fontFamily: 'Newsreader_400Regular', fontSize: 17,
                    color: isActive ? colors.evergreen.DEFAULT : colors.ink.DEFAULT,
                  }}>
                    {SIDE_LABELS[side]}
                  </Text>
                  {isActive ? (
                    <Text style={{
                      fontFamily: 'GeistMono_400Regular', fontSize: 22,
                      color: colors.evergreen.DEFAULT, marginTop: 8, letterSpacing: 1,
                    }}>
                      {fmtTime(elapsed)}
                    </Text>
                  ) : !otherActive ? (
                    <Text style={{
                      fontSize: 12, color: colors.ink.faint,
                      fontFamily: 'Geist_400Regular', marginTop: 6,
                    }}>
                      {t.feeding.tapToStart}
                    </Text>
                  ) : null}
                  {isActive && (
                    <Animated.View style={{
                      position: 'absolute', top: 12, right: 12,
                      width: 9, height: 9, borderRadius: 5,
                      backgroundColor: colors.terracotta.DEFAULT,
                      opacity: pulseAnim,
                    }} />
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Butelka + Laktator */}
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 4 }}>
            {(['bottle', 'pump'] as const).map((side) => {
              const isActive = activeSession?.side === side && !!activeFeedingSessionId;
              return (
                <Pressable
                  key={side}
                  onPress={() => handleSide(side)}
                  style={{
                    flex: 1,
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                    backgroundColor: isActive ? colors.sage.soft : colors.surface.DEFAULT,
                    borderWidth: 0.5, borderColor: isActive ? colors.evergreen.DEFAULT : colors.line.DEFAULT,
                    borderRadius: 14, paddingVertical: 13,
                  }}
                >
                  <Icon name={side === 'bottle' ? 'bottle' : 'pump'} size={16} color={isActive ? colors.evergreen.DEFAULT : colors.ink.soft} />
                  <Text style={{ fontSize: 14, fontFamily: 'Geist_500Medium', color: isActive ? colors.evergreen.DEFAULT : colors.ink.soft }}>
                    {SIDE_LABELS[side]}
                    {isActive ? ` · ${fmtTime(elapsed)}` : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={{
            textAlign: 'center', fontSize: 13, color: colors.ink.soft,
            marginTop: 14, marginBottom: 0,
          }}>
            {activeFeedingSessionId
              ? t.feeding.feedingOngoing
              : t.feeding.tapSideToStart}
          </Text>

          {/* Med info */}
          <View style={{ marginTop: 20 }}>
            <MedInfoCard
              title="Karmienie piersią — jak to działa?"
              items={[
                'Noworodek karmi się 8–12 razy na dobę, zwykle co 2–3 godziny (również w nocy)',
                'Karm na żądanie – obserwuj sygnały głodu: szukanie, cmokanie, przykładanie piąstek do buzi',
                'Typowo 10–20 min na piersi; gdy dziecko zwalnia, zaproponuj drugą stronę',
                'WHO zaleca wyłączne karmienie piersią przez pierwsze 6 miesięcy życia',
                'Oznaki dobrego karmienia: 6+ mokrych pieluszek dziennie, spokój po karmieniu, regularny przyrost masy ciała',
                'Trudności z karmieniem? Skontaktuj się z doradcą laktacyjnym (certyfikat IBCLC)',
              ]}
            />
          </View>

          {/* Today */}
          {todayDone.length > 0 && (
            <View style={{ marginTop: 28 }}>
              <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT, marginBottom: 12 }}>
                {t.feeding.today}
              </Text>
              <View style={{ gap: 10 }}>
                {todayDone.sort((a, b) => b.startedAt - a.startedAt).map((sess) => (
                  <FeedRow key={sess.id} session={sess} onDelete={() => deleteFeeding(sess.id)} />
                ))}
              </View>
            </View>
          )}

          {/* History by day */}
          {dayKeys.map((day) => (
            <View key={day} style={{ marginTop: 24 }}>
              <Text style={{ fontSize: 11, color: colors.ink.faint, fontFamily: 'Geist_500Medium', letterSpacing: 0.4, marginBottom: 10 }}>
                {formatDateShort(new Date(day).getTime() + 43200000, locale).toUpperCase()}
              </Text>
              <View style={{ gap: 10 }}>
                {(grouped[day] ?? []).sort((a, b) => b.startedAt - a.startedAt).map((sess) => (
                  <FeedRow key={sess.id} session={sess} onDelete={() => deleteFeeding(sess.id)} />
                ))}
              </View>
            </View>
          ))}

          <View style={{
            backgroundColor: '#FCFBF7',
            borderRadius: 16,
            borderWidth: 0.5,
            borderColor: colors.line.DEFAULT,
            padding: 14,
            marginTop: 26,
            gap: 6,
          }}>
            <Text style={{ fontSize: 14, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
              {t.feeding.infoTitle}
            </Text>
            <Text style={{ fontSize: 12.5, color: colors.ink.soft, lineHeight: 18 }}>
              • {t.feeding.infoWhy}
            </Text>
            <Text style={{ fontSize: 12.5, color: colors.ink.soft, lineHeight: 18 }}>
              • {t.feeding.infoHow}
            </Text>
            <Text style={{ fontSize: 12.5, color: colors.terracotta.dark, lineHeight: 18 }}>
              • {t.feeding.infoWhen}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function FeedRow({ session, onDelete }: { session: FeedingSession; onDelete: () => void }) {
  const t = useT();
  const sideLabelMap: Record<string, string> = {
    left: t.feeding.left, right: t.feeding.right,
    bottle: t.feeding.bottle, pump: t.feeding.pump,
  };
  const dur = session.endedAt ? Math.floor((session.endedAt - session.startedAt) / 1000) : 0;
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmtTime = (s: number) => `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
  const formatHour = (ts: number) => {
    const d = new Date(ts);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const isLeft = session.side === 'left';
  const isRight = session.side === 'right';
  const label = sideLabelMap[session.side];
  const badgeBg = isLeft ? colors.evergreen.DEFAULT : isRight ? colors.sage.DEFAULT : '#EFE9DC';
  const badgeColor = isLeft || isRight ? '#fff' : colors.ink.DEFAULT;
  const badgeLabel = isLeft ? 'L' : isRight ? 'P' : session.side === 'bottle' ? '🍼' : '🥛';

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 13,
      backgroundColor: colors.surface.DEFAULT, borderWidth: 0.5,
      borderColor: colors.line.DEFAULT, borderRadius: 16, padding: 14,
    }}>
      <View style={{
        width: 38, height: 38, borderRadius: 11, backgroundColor: badgeBg,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 15, fontFamily: 'Newsreader_400Regular', color: badgeColor }}>
          {badgeLabel}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
          {label} · {dur > 0 ? fmtTime(dur) : ''}
        </Text>
        <Text style={{ fontSize: 12, color: colors.ink.soft, marginTop: 2 }}>
          {formatHour(session.startedAt)}
        </Text>
      </View>
      <Pressable onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Icon name="trash" size={16} color={colors.ink.faint} />
      </Pressable>
    </View>
  );
}
