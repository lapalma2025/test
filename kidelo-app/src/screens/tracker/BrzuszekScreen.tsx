/**
 * BrzuszekScreen.tsx — pamiętnik ciąży tydzień po tygodniu.
 * Użytkownik opisuje jak się czuje w danym tygodniu + nastrój.
 * Każdy wpis automatycznie dopasowuje się do tygodnia ciąży z danych profilu.
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Modal, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { differenceInDays } from 'date-fns';

import { Icon } from '@/components/ui';
import { useTrackersStore, type BumpEntry } from '@/stores/trackers';
import { useProfileStore } from '@/stores/profile';
import { colors } from '@/theme/tokens';

// @ts-ignore
import weekData from '../../../assets/ciaza-tydzien-po-tygodniu.json';

const FRUIT_EMOJI: Record<string, string> = {
  'mak': '🌱', 'sezam': '🌿', 'soczewica': '🫘', 'borówka': '🫐',
  'malina': '🍓', 'fasolka': '🫘', 'winogrono': '🍇', 'wiśnia': '🍒',
  'truskawka': '🍓', 'kumkwat': '🍊', 'figa': '🫒', 'limonka': '🍋',
  'cytryna': '🍋', 'groch': '🫛', 'jabłko': '🍎', 'awokado': '🥑',
  'rzepa': '🥔', 'gruszka': '🍐', 'papryka': '🫑', 'mango': '🥭',
  'pomidor': '🍅', 'banan': '🍌', 'marchewka': '🥕', 'papaja': '🥭',
  'kabaczek': '🥒', 'grejpfrut': '🍊', 'kukurydz': '🌽', 'kalarepa': '🥦',
  'kalafior': '🥦', 'sałat': '🥬', 'bakłażan': '🍆', 'dynia': '🎃',
  'kokos': '🥥', 'kapust': '🥬', 'ananas': '🍍', 'melon': '🍈',
  'botwina': '🥬', 'por': '🥬', 'arbuz': '🍉',
};

function fruitEmoji(porownanie: string): string {
  const lower = (porownanie ?? '').toLowerCase();
  for (const [key, emoji] of Object.entries(FRUIT_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return '👶';
}

type MoodType = BumpEntry['mood'];

const MOODS: Array<{ id: MoodType; emoji: string; label: string; color: string }> = [
  { id: 'great', emoji: '🌟', label: 'Świetnie', color: colors.evergreen.DEFAULT },
  { id: 'good',  emoji: '😊', label: 'Dobrze',   color: colors.sage.DEFAULT     },
  { id: 'tired', emoji: '😴', label: 'Zmęczona', color: colors.mustard.DEFAULT  },
  { id: 'tough', emoji: '😔', label: 'Ciężko',   color: colors.terracotta.DEFAULT },
];

function calcCurrentWeek(profile: ReturnType<typeof useProfileStore.getState>): number | null {
  const ref = profile.childDueDate;
  if (!ref) return null;
  try {
    const daysLeft = differenceInDays(new Date(ref), new Date());
    const w = 40 - Math.round(daysLeft / 7);
    return Math.max(1, Math.min(42, w));
  } catch {
    return null;
  }
}

export default function BrzuszekScreen() {
  const router = useRouter();
  const profile = useProfileStore();
  const { bumpEntries, addBumpEntry, updateBumpEntry, deleteBumpEntry } = useTrackersStore();

  const currentWeek = calcCurrentWeek(profile);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formWeek, setFormWeek] = useState(String(currentWeek ?? 1));
  const [formNote, setFormNote] = useState('');
  const [formMood, setFormMood] = useState<MoodType>('good');

  const openAdd = () => {
    setEditId(null);
    setFormWeek(String(currentWeek ?? 1));
    setFormNote('');
    setFormMood('good');
    setShowForm(true);
  };

  const openEdit = (e: BumpEntry) => {
    setEditId(e.id);
    setFormWeek(String(e.week));
    setFormNote(e.note);
    setFormMood(e.mood);
    setShowForm(true);
  };

  const handleSave = () => {
    const week = Math.max(1, Math.min(42, parseInt(formWeek, 10) || 1));
    const today = new Date().toISOString().slice(0, 10);
    if (editId) {
      updateBumpEntry(editId, { week, note: formNote, mood: formMood });
    } else {
      addBumpEntry({ week, note: formNote, mood: formMood, date: today });
    }
    setShowForm(false);
  };

  // Tygodnie z danych JSON
  const getWeekInfo = (week: number) => {
    return (weekData as any).tygodnie.find((t: any) => t.tydzien === week) ?? null;
  };

  const sorted = [...bumpEntries].sort((a, b) => b.week - a.week);

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* TopBar */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          paddingHorizontal: 18, paddingVertical: 14,
          backgroundColor: colors.cream.DEFAULT,
        }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40, height: 40, borderRadius: 12, borderWidth: 0.5,
              borderColor: colors.line.DEFAULT, backgroundColor: colors.surface.DEFAULT,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Icon name="back" size={20} color={colors.ink.DEFAULT} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
              Pamiętnik ciąży
            </Text>
          </View>
          <Pressable
            onPress={openAdd}
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="plus" size={22} color={colors.evergreen.DEFAULT} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Aktualny tydzień — karta hero */}
          {currentWeek && (
            <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
              {(() => {
                const wInfo = getWeekInfo(currentWeek);
                const emoji = wInfo ? fruitEmoji(wInfo.rozmiar_dziecka.porownanie) : '👶';
                const hasEntry = bumpEntries.some((e) => e.week === currentWeek);
                return (
                  <View style={{
                    backgroundColor: colors.blush.soft,
                    borderRadius: 20, padding: 20,
                    borderWidth: 1, borderColor: `${colors.terracotta.DEFAULT}30`,
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 11, color: colors.terracotta.DEFAULT, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                          Teraz
                        </Text>
                        <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 28, color: colors.ink.DEFAULT, marginTop: 4 }}>
                          Tydzień {currentWeek}
                        </Text>
                        {wInfo && (
                          <Text style={{ fontSize: 13, color: colors.ink.soft, marginTop: 4 }}>
                            Dziecko wielkości: {wInfo.rozmiar_dziecka.porownanie}
                          </Text>
                        )}
                      </View>
                      <Text style={{ fontSize: 56 }}>{emoji}</Text>
                    </View>
                    {!hasEntry && (
                      <Pressable
                        onPress={openAdd}
                        style={{
                          marginTop: 16, backgroundColor: colors.terracotta.DEFAULT,
                          borderRadius: 12, paddingVertical: 12, alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 14, fontFamily: 'Geist_500Medium', color: colors.cream.DEFAULT }}>
                          Napisz o tym tygodniu
                        </Text>
                      </Pressable>
                    )}
                  </View>
                );
              })()}
            </View>
          )}

          {/* Lista wpisów */}
          {sorted.length === 0 ? (
            <View style={{ alignItems: 'center', paddingHorizontal: 32, paddingTop: 40 }}>
              <Text style={{ fontSize: 48, marginBottom: 16 }}>📖</Text>
              <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 22, color: colors.ink.DEFAULT, textAlign: 'center', marginBottom: 10 }}>
                Zacznij pisać
              </Text>
              <Text style={{ fontSize: 14, color: colors.ink.soft, textAlign: 'center', lineHeight: 20 }}>
                Opisuj jak się czujesz każdego tygodnia.{'\n'}To wspomnienia, które zostają na zawsze.
              </Text>
            </View>
          ) : (
            <View style={{ paddingHorizontal: 20, marginTop: 24 }}>
              <Text style={{ fontSize: 11, color: colors.ink.faint, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
                Moje wpisy ({sorted.length})
              </Text>
              {sorted.map((entry) => {
                const wInfo = getWeekInfo(entry.week);
                const emoji = wInfo ? fruitEmoji(wInfo.rozmiar_dziecka.porownanie) : '👶';
                const mood = MOODS.find((m) => m.id === entry.mood);
                return (
                  <View key={entry.id} style={{
                    backgroundColor: colors.surface.DEFAULT,
                    borderWidth: 0.5, borderColor: colors.line.DEFAULT,
                    borderRadius: 16, marginBottom: 12, overflow: 'hidden',
                  }}>
                    {/* Header wpisu */}
                    <View style={{
                      flexDirection: 'row', alignItems: 'center',
                      paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
                      borderBottomWidth: 0.5, borderBottomColor: colors.line.DEFAULT,
                      gap: 10,
                    }}>
                      <Text style={{ fontSize: 28 }}>{emoji}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
                          Tydzień {entry.week}
                        </Text>
                        {wInfo && (
                          <Text style={{ fontSize: 11, color: colors.ink.faint }}>
                            {wInfo.rozmiar_dziecka.porownanie}
                          </Text>
                        )}
                      </View>
                      {mood && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Text style={{ fontSize: 16 }}>{mood.emoji}</Text>
                          <Text style={{ fontSize: 11, color: mood.color, fontFamily: 'Geist_500Medium' }}>
                            {mood.label}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Treść */}
                    {entry.note ? (
                      <Text style={{ fontSize: 14, color: colors.ink.DEFAULT, lineHeight: 20, padding: 16 }}>
                        {entry.note}
                      </Text>
                    ) : null}

                    {/* Akcje */}
                    <View style={{
                      flexDirection: 'row',
                      borderTopWidth: 0.5, borderTopColor: colors.line.DEFAULT,
                    }}>
                      <Pressable
                        onPress={() => openEdit(entry)}
                        style={{
                          flex: 1, flexDirection: 'row', alignItems: 'center',
                          justifyContent: 'center', gap: 6,
                          paddingVertical: 10,
                        }}
                      >
                        <Icon name="pencil" size={14} color={colors.ink.soft} />
                        <Text style={{ fontSize: 12, color: colors.ink.soft }}>Edytuj</Text>
                      </Pressable>
                      <View style={{ width: 0.5, backgroundColor: colors.line.DEFAULT }} />
                      <Pressable
                        onPress={() => deleteBumpEntry(entry.id)}
                        style={{
                          flex: 1, flexDirection: 'row', alignItems: 'center',
                          justifyContent: 'center', gap: 6,
                          paddingVertical: 10,
                        }}
                      >
                        <Icon name="trash" size={14} color={colors.ink.faint} />
                        <Text style={{ fontSize: 12, color: colors.ink.faint }}>Usuń</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Modal formularza */}
        <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
          <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                paddingHorizontal: 16, paddingVertical: 12,
                borderBottomWidth: 0.5, borderBottomColor: colors.line.DEFAULT,
              }}>
                <Pressable onPress={() => setShowForm(false)} style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ fontSize: 14, color: colors.ink.soft }}>Anuluj</Text>
                </Pressable>
                <Text style={{ flex: 1, textAlign: 'center', fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
                  {editId ? 'Edytuj wpis' : 'Nowy wpis'}
                </Text>
                <Pressable onPress={handleSave} style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ fontSize: 14, fontFamily: 'Geist_500Medium', color: colors.evergreen.DEFAULT }}>
                    Zapisz
                  </Text>
                </Pressable>
              </View>

              <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} keyboardShouldPersistTaps="handled">
                {/* Tydzień */}
                <View>
                  <Text style={{ fontSize: 11, color: colors.ink.faint, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, fontFamily: 'Geist_500Medium' }}>
                    Tydzień ciąży
                  </Text>
                  <TextInput
                    value={formWeek}
                    onChangeText={setFormWeek}
                    keyboardType="number-pad"
                    placeholder="np. 28"
                    placeholderTextColor={colors.ink.faint}
                    style={{
                      backgroundColor: colors.surface.DEFAULT,
                      borderWidth: 1, borderColor: colors.line.DEFAULT,
                      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
                      fontSize: 15, color: colors.ink.DEFAULT, fontFamily: 'Geist_400Regular',
                    }}
                  />
                  {(() => {
                    const w = parseInt(formWeek, 10);
                    const wInfo = !isNaN(w) ? getWeekInfo(Math.max(1, Math.min(42, w))) : null;
                    if (!wInfo) return null;
                    const emoji = fruitEmoji(wInfo.rozmiar_dziecka.porownanie);
                    return (
                      <View style={{
                        flexDirection: 'row', alignItems: 'center', gap: 8,
                        marginTop: 8, paddingHorizontal: 12, paddingVertical: 8,
                        backgroundColor: colors.blush.soft, borderRadius: 10,
                      }}>
                        <Text style={{ fontSize: 20 }}>{emoji}</Text>
                        <Text style={{ fontSize: 13, color: colors.ink.soft, flex: 1 }}>
                          Dziecko wielkości: {wInfo.rozmiar_dziecka.porownanie}
                          {wInfo.rozmiar_dziecka.waga !== '—' ? ` · ${wInfo.rozmiar_dziecka.waga}` : ''}
                        </Text>
                      </View>
                    );
                  })()}
                </View>

                {/* Nastrój */}
                <View>
                  <Text style={{ fontSize: 11, color: colors.ink.faint, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10, fontFamily: 'Geist_500Medium' }}>
                    Jak się czujesz?
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {MOODS.map((m) => (
                      <Pressable
                        key={m.id}
                        onPress={() => setFormMood(m.id)}
                        style={{
                          flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12,
                          backgroundColor: formMood === m.id
                            ? `${m.color}20`
                            : colors.surface.DEFAULT,
                          borderWidth: 1.5,
                          borderColor: formMood === m.id ? m.color : colors.line.DEFAULT,
                          gap: 4,
                        }}
                      >
                        <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
                        <Text style={{
                          fontSize: 10, fontFamily: 'Geist_500Medium',
                          color: formMood === m.id ? m.color : colors.ink.faint,
                        }}>
                          {m.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Notatka */}
                <View>
                  <Text style={{ fontSize: 11, color: colors.ink.faint, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, fontFamily: 'Geist_500Medium' }}>
                    Jak minął ten tydzień?
                  </Text>
                  <TextInput
                    value={formNote}
                    onChangeText={setFormNote}
                    placeholder="Opisz swoje odczucia, ważne momenty, pytania do lekarza..."
                    placeholderTextColor={colors.ink.faint}
                    multiline
                    numberOfLines={6}
                    autoFocus
                    style={{
                      backgroundColor: colors.surface.DEFAULT,
                      borderWidth: 1, borderColor: colors.line.DEFAULT,
                      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
                      fontSize: 15, color: colors.ink.DEFAULT,
                      fontFamily: 'Geist_400Regular',
                      minHeight: 140, textAlignVertical: 'top',
                    }}
                  />
                </View>
              </ScrollView>
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
