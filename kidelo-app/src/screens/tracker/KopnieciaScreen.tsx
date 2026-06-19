import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Animated, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Icon } from '@/components/ui';
import { useTrackersStore, type KickSession } from '@/stores/trackers';
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
    Alert.alert('Usuń sesję', 'Czy na pewno chcesz usunąć tę sesję?', [
      { text: 'Anuluj', style: 'cancel' },
      { text: 'Usuń', style: 'destructive', onPress: () => deleteKickSession(id) },
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
              Licznik kopnięć
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
              ? 'Świetnie — dziecko jest aktywne.'
              : 'Dotykaj koła przy każdym ruchu. Cel: 10 kopnięć.'}
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
                  z 10 kopnięć
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
                Cofnij
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
                Zakończ
              </Text>
            </Pressable>
          </View>

          {/* History */}
          {pastSessions.length > 0 && (
            <View style={{ paddingHorizontal: 22 }}>
              <Text style={{
                fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT,
                marginBottom: 12,
              }}>
                Historia
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
              Edytuj liczbę kopnięć
            </Text>
            {editSession && (
              <Text style={{ fontSize: 12.5, color: colors.ink.faint, marginBottom: 24 }}>
                {formatDateLabel(editSession.startedAt)}
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
              kopnięć
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
                Zapisz
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
            {session.kicks.length} kopnięć
          </Text>
          <Text style={{ fontSize: 12.5, color: colors.ink.soft, marginTop: 2 }}>
            {formatDateLabel(session.startedAt)}{dur ? ' · ' + formatDur(dur) : ''}
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
          <Text style={{ fontSize: 12.5, color: colors.ink.soft }}>Edytuj</Text>
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
          <Text style={{ fontSize: 12.5, color: colors.ink.faint }}>Usuń</Text>
        </Pressable>
      </View>
    </View>
  );
}
