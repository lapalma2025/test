import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Animated, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Icon } from '@/components/ui';
import { MedInfoCard } from '@/components/ui/MedInfoCard';
import { useTrackersStore, type KickSession } from '@/stores/trackers';
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

function formatDur(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  return m > 0 ? `${m} min` : `${s} sek`;
}

const BACK_BTN = {
  width: 40, height: 40, borderRadius: 12, borderWidth: 0.5,
  borderColor: colors.line.DEFAULT, backgroundColor: colors.surface.DEFAULT,
  alignItems: 'center' as const, justifyContent: 'center' as const,
};

export default function KopnieciaScreen() {
  const router = useRouter();
  const t = useT();
  const lang = useLanguageStore((s) => s.lang);
  const locale = lang === 'en' ? 'en-GB' : 'pl-PL';
  const todayStr = t.common.today;
  const yesterdayStr = t.common.yesterday;
  const {
    kickSessions, activeKickSessionId,
    endKickSession, tapKick, removeLastKick,
    deleteKickSession, setKickSessionCount,
  } = useTrackersStore();

  const [tick, setTick] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Edit modal state
  const [editSession, setEditSession] = useState<KickSession | null>(null);
  const [editCount, setEditCount] = useState(0);

  const activeSession = kickSessions.find((s) => s.id === activeKickSessionId);
  const kickCount = activeSession?.kicks.length ?? 0;
  const done = kickCount >= 10;
  const running = !!activeKickSessionId;
  const elapsed = activeSession ? Math.floor((Date.now() - activeSession.startedAt) / 1000) : 0;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  const pastSessions = kickSessions.filter((s) => s.id !== activeKickSessionId && s.endedAt);

  const handleTap = () => {
    tapKick();
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.94, useNativeDriver: true, speed: 50 }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 20 }),
    ]).start();
  };

  const handleDelete = (id: string) => {
    Alert.alert(t.kicks.deleteSession, t.kicks.deleteConfirm, [
      { text: t.kicks.cancel, style: 'cancel' },
      { text: t.kicks.delete, style: 'destructive', onPress: () => deleteKickSession(id) },
    ]);
  };

  const handleEdit = (sess: KickSession) => {
    setEditSession(sess);
    setEditCount(sess.kicks.length);
  };

  const handleSaveEdit = () => {
    if (editSession) {
      setKickSessionCount(editSession.id, editCount);
    }
    setEditSession(null);
  };

  const dialBg = done ? colors.sage.soft : running ? '#FCFBF7' : colors.surface.DEFAULT;
  const dialBorder = done || running ? colors.evergreen.DEFAULT : colors.sage.DEFAULT;

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
              {t.kicks.title}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Hint */}
          <Text style={{
            textAlign: 'center', fontSize: 14, color: colors.ink.soft,
            paddingHorizontal: 24, marginTop: 6, marginBottom: 22,
          }}>
            {done
              ? t.kicks.goalReached
              : t.kicks.instruction}
          </Text>

          {/* Circular dial */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Pressable
                onPress={handleTap}
                style={{
                  width: 210, height: 210, borderRadius: 105,
                  borderWidth: 1, borderColor: dialBorder,
                  backgroundColor: dialBg,
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Text style={{
                  fontFamily: 'Newsreader_400Regular', fontSize: 64, lineHeight: 68,
                  color: colors.evergreen.DEFAULT, letterSpacing: -1,
                }}>
                  {kickCount}
                </Text>
                <Text style={{ fontSize: 13, color: colors.ink.soft, marginTop: 2 }}>
                  {t.kicks.ofKicks}
                </Text>
                {running && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                    <Icon name="clock" size={13} color={colors.ink.faint} />
                    <Text style={{ fontFamily: 'GeistMono_400Regular', fontSize: 12, color: colors.ink.faint }}>
                      {fmtTime(elapsed)}
                    </Text>
                  </View>
                )}
              </Pressable>
            </Animated.View>
          </View>

          {/* Action buttons */}
          <View style={{
            flexDirection: 'row', gap: 10, justifyContent: 'center',
            paddingHorizontal: 24, marginBottom: 36,
          }}>
            <Pressable
              onPress={removeLastKick}
              style={{
                flex: 1, maxWidth: 150,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                backgroundColor: colors.surface.DEFAULT, borderWidth: 0.5,
                borderColor: colors.line.DEFAULT, borderRadius: 14, paddingVertical: 14,
              }}
            >
              <Icon name="minus" size={18} color={colors.ink.DEFAULT} />
              <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
                {t.kicks.undo}
              </Text>
            </Pressable>
            <Pressable
              onPress={endKickSession}
              style={{
                flex: 1, maxWidth: 150,
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                backgroundColor: colors.surface.DEFAULT, borderWidth: 0.5,
                borderColor: colors.line.DEFAULT, borderRadius: 14, paddingVertical: 14,
              }}
            >
              <Icon name="cross" size={18} color={colors.ink.DEFAULT} />
              <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
                {t.kicks.finish}
              </Text>
            </Pressable>
          </View>

          {/* Med info */}
          <View style={{ paddingHorizontal: 22, marginBottom: 24 }}>
            <MedInfoCard
              title="Jak liczyć ruchy dziecka?"
              items={[
                'Od 26–28. tygodnia ciąży licz codziennie ruchy dziecka',
                'Cel: 10 ruchów w ciągu 2 godzin (metoda Cardiff – zalecana przez WHO i PTG)',
                'Co się liczy: kopnięcia, obroty, szarpnięcia, wyczuwalne bąbelki',
                'Najlepsza pora: wieczorem po posiłku, leżąc spokojnie na lewym boku',
                'Każda sesja jest inna – ważna jest zmiana w stosunku do normy Twojego dziecka',
              ]}
              warning="Mniej niż 10 ruchów w 2 godziny lub nagły, wyraźny spadek aktywności – zadzwoń do ginekologa lub położnej tego samego dnia."
            />
          </View>

          {/* History */}
          {pastSessions.length > 0 && (
            <View style={{ paddingHorizontal: 22 }}>
              <Text style={{
                fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT,
                marginBottom: 12,
              }}>
                {t.kicks.history}
              </Text>
              <View style={{ gap: 10 }}>
                {pastSessions.map((sess) => (
                  <HistRow
                    key={sess.id}
                    session={sess}
                    onDelete={() => handleDelete(sess.id)}
                    onEdit={() => handleEdit(sess)}
                  />
                ))}
              </View>
            </View>
          )}

          <View style={{
            marginHorizontal: 22,
            marginTop: 26,
            backgroundColor: '#FCFBF7',
            borderRadius: 16,
            borderWidth: 0.5,
            borderColor: colors.line.DEFAULT,
            padding: 14,
            gap: 6,
          }}>
            <Text style={{ fontSize: 14, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
              {t.kicks.infoTitle}
            </Text>
            <Text style={{ fontSize: 12.5, color: colors.ink.soft, lineHeight: 18 }}>
              • {t.kicks.infoWhy}
            </Text>
            <Text style={{ fontSize: 12.5, color: colors.ink.soft, lineHeight: 18 }}>
              • {t.kicks.infoHow}
            </Text>
            <Text style={{ fontSize: 12.5, color: colors.terracotta.dark, lineHeight: 18 }}>
              • {t.kicks.infoWhen}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Edit modal */}
      <Modal visible={!!editSession} animationType="slide" presentationStyle="pageSheet" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setEditSession(null)} />
          <View style={{
            backgroundColor: colors.cream.DEFAULT,
            borderTopLeftRadius: 24, borderTopRightRadius: 24,
            padding: 24, paddingBottom: 40,
          }}>
            {/* Handle */}
            <View style={{
              width: 36, height: 4, borderRadius: 2, backgroundColor: colors.line.strong,
              alignSelf: 'center', marginBottom: 20,
            }} />

            <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT, marginBottom: 6 }}>
              {t.kicks.editCount}
            </Text>
            {editSession && (
              <Text style={{ fontSize: 12.5, color: colors.ink.faint, marginBottom: 24 }}>
                {formatDateLabel(editSession.startedAt, locale, todayStr, yesterdayStr)}
              </Text>
            )}

            {/* Counter */}
            <View style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 28,
            }}>
              <Pressable
                onPress={() => setEditCount((c) => Math.max(0, c - 1))}
                style={{
                  width: 52, height: 52, borderRadius: 16,
                  backgroundColor: colors.surface.DEFAULT, borderWidth: 0.5,
                  borderColor: colors.line.DEFAULT, alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon name="minus" size={20} color={colors.ink.DEFAULT} />
              </Pressable>

              <Text style={{
                fontFamily: 'Newsreader_400Regular', fontSize: 52, lineHeight: 60,
                color: colors.evergreen.DEFAULT, minWidth: 70, textAlign: 'center',
              }}>
                {editCount}
              </Text>

              <Pressable
                onPress={() => setEditCount((c) => c + 1)}
                style={{
                  width: 52, height: 52, borderRadius: 16,
                  backgroundColor: colors.surface.DEFAULT, borderWidth: 0.5,
                  borderColor: colors.line.DEFAULT, alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Icon name="plus" size={20} color={colors.ink.DEFAULT} />
              </Pressable>
            </View>

            <Text style={{ textAlign: 'center', fontSize: 12, color: colors.ink.faint, marginTop: 8 }}>
              {t.kicks.kicks}
            </Text>

            {/* Save */}
            <Pressable
              onPress={handleSaveEdit}
              style={{
                marginTop: 28, backgroundColor: colors.evergreen.DEFAULT,
                borderRadius: 16, paddingVertical: 16, alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: '#F2EEE4' }}>
                {t.kicks.save}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function HistRow({
  session, onDelete, onEdit,
}: {
  session: KickSession;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const t = useT();
  const lang = useLanguageStore((s) => s.lang);
  const locale = lang === 'en' ? 'en-GB' : 'pl-PL';
  const dur = session.endedAt ? session.endedAt - session.startedAt : null;
  return (
    <View style={{
      backgroundColor: colors.surface.DEFAULT, borderWidth: 0.5,
      borderColor: colors.line.DEFAULT, borderRadius: 16,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13, padding: 14 }}>
        <View style={{
          width: 38, height: 38, borderRadius: 11, backgroundColor: '#EFE9DC',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name="foot" size={17} color={colors.ink.DEFAULT} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
            {session.kicks.length} {t.kicks.kicks}
          </Text>
          <Text style={{ fontSize: 12.5, color: colors.ink.soft, marginTop: 2 }}>
            {formatDateLabel(session.startedAt, locale, t.common.today, t.common.yesterday)}{dur ? ' · ' + formatDur(dur) : ''}
          </Text>
        </View>
        {dur && (
          <Text style={{ fontFamily: 'GeistMono_400Regular', fontSize: 13, color: colors.ink.soft }}>
            {formatDur(dur)}
          </Text>
        )}
      </View>

      {/* Action bar */}
      <View style={{
        flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: colors.line.DEFAULT,
      }}>
        <Pressable
          onPress={onEdit}
          style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            gap: 6, paddingVertical: 10,
          }}
        >
          <Icon name="pencil" size={14} color={colors.ink.soft} />
          <Text style={{ fontSize: 12.5, color: colors.ink.soft }}>{t.kicks.edit}</Text>
        </Pressable>
        <View style={{ width: 0.5, backgroundColor: colors.line.DEFAULT }} />
        <Pressable
          onPress={onDelete}
          style={{
            flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            gap: 6, paddingVertical: 10,
          }}
        >
          <Icon name="trash" size={14} color={colors.ink.faint} />
          <Text style={{ fontSize: 12.5, color: colors.ink.faint }}>{t.kicks.delete}</Text>
        </Pressable>
      </View>
    </View>
  );
}
