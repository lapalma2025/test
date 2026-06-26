import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { addDays, differenceInDays, format, parseISO, isValid } from 'date-fns';
import { pl } from 'date-fns/locale';

import { Icon } from '@/components/ui';
import { colors } from '@/theme/tokens';

type CalcMode = 'lmp' | 'week';

const BACK_BTN = {
  width: 40, height: 40, borderRadius: 12, borderWidth: 0.5,
  borderColor: colors.line.DEFAULT, backgroundColor: colors.surface.DEFAULT,
  alignItems: 'center' as const, justifyContent: 'center' as const,
};

export default function KalkulatorScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<CalcMode>('lmp');
  const [lmpDate, setLmpDate] = useState('');
  const [currentWeek, setCurrentWeek] = useState('');
  const [result, setResult] = useState<{
    dueDate: Date;
    pregnancyWeek: number;
    daysLeft: number;
  } | null>(null);

  const calculate = () => {
    if (mode === 'lmp') {
      if (!lmpDate.match(/^\d{4}-\d{2}-\d{2}$/)) return;
      try {
        const lmp = parseISO(lmpDate);
        if (!isValid(lmp)) return;
        const dueDate = addDays(lmp, 280);
        const today = new Date();
        const daysFromLMP = differenceInDays(today, lmp);
        const pregnancyWeek = Math.min(42, Math.max(1, Math.floor(daysFromLMP / 7) + 1));
        const daysLeft = differenceInDays(dueDate, today);
        setResult({ dueDate, pregnancyWeek, daysLeft: Math.max(0, daysLeft) });
      } catch { /* invalid date */ }
    } else {
      const w = parseInt(currentWeek, 10);
      if (isNaN(w) || w < 1 || w > 42) return;
      const today = new Date();
      const lmpEstimated = addDays(today, -(w - 1) * 7);
      const dueDate = addDays(lmpEstimated, 280);
      const daysLeft = differenceInDays(dueDate, today);
      setResult({ dueDate, pregnancyWeek: w, daysLeft: Math.max(0, daysLeft) });
    }
  };

  const weeksLeft = result ? Math.floor(result.daysLeft / 7) : null;
  const daysRemainder = result ? result.daysLeft % 7 : null;
  const trimester = result
    ? result.pregnancyWeek <= 13 ? 1 : result.pregnancyWeek <= 27 ? 2 : 3
    : null;
  const trimesterLabel = trimester === 1 ? 'I trymestr' : trimester === 2 ? 'II trymestr' : 'III trymestr';

  return (
    <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
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
              Kalkulator terminu porodu
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          {/* Lead */}
          <Text style={{
            fontFamily: 'Newsreader_400Regular', fontSize: 22, color: colors.ink.DEFAULT,
            lineHeight: 30, marginTop: 8, marginBottom: 22,
          }}>
            Oblicz przewidywany{'\n'}termin porodu
          </Text>

          {/* Tryb */}
          <View style={{
            flexDirection: 'row',
            backgroundColor: colors.surface.DEFAULT,
            borderWidth: 0.5, borderColor: colors.line.DEFAULT,
            borderRadius: 14, padding: 4, marginBottom: 22,
          }}>
            {(['lmp', 'week'] as CalcMode[]).map((m) => (
              <Pressable
                key={m}
                onPress={() => { setMode(m); setResult(null); }}
                style={{
                  flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 11,
                  backgroundColor: mode === m ? colors.evergreen.DEFAULT : 'transparent',
                }}
              >
                <Text style={{
                  fontSize: 13, fontFamily: 'Geist_500Medium',
                  color: mode === m ? colors.cream.DEFAULT : colors.ink.soft,
                }}>
                  {m === 'lmp' ? 'Z daty miesiączki' : 'Z tygodnia ciąży'}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Input */}
          {mode === 'lmp' ? (
            <View style={{ gap: 8, marginBottom: 20 }}>
              <Text style={{
                fontSize: 11, color: colors.ink.faint, textTransform: 'uppercase',
                letterSpacing: 0.6, fontFamily: 'Geist_500Medium',
              }}>
                Ostatnia miesiączka
              </Text>
              <TextInput
                value={lmpDate}
                onChangeText={(v) => { setLmpDate(v); setResult(null); }}
                placeholder="YYYY-MM-DD  np. 2025-09-15"
                placeholderTextColor={colors.ink.faint}
                keyboardType="numbers-and-punctuation"
                style={{
                  backgroundColor: colors.surface.DEFAULT,
                  borderWidth: 0.5, borderColor: colors.line.DEFAULT,
                  borderRadius: 13, paddingHorizontal: 16, paddingVertical: 15,
                  fontSize: 16, color: colors.ink.DEFAULT,
                  fontFamily: 'GeistMono_400Regular',
                }}
              />
            </View>
          ) : (
            <View style={{ gap: 8, marginBottom: 20 }}>
              <Text style={{
                fontSize: 11, color: colors.ink.faint, textTransform: 'uppercase',
                letterSpacing: 0.6, fontFamily: 'Geist_500Medium',
              }}>
                Aktualny tydzień ciąży (1–42)
              </Text>
              <TextInput
                value={currentWeek}
                onChangeText={(v) => { setCurrentWeek(v); setResult(null); }}
                placeholder="np. 20"
                placeholderTextColor={colors.ink.faint}
                keyboardType="number-pad"
                style={{
                  backgroundColor: colors.surface.DEFAULT,
                  borderWidth: 0.5, borderColor: colors.line.DEFAULT,
                  borderRadius: 13, paddingHorizontal: 16, paddingVertical: 15,
                  fontSize: 24, color: colors.ink.DEFAULT,
                  fontFamily: 'GeistMono_400Regular',
                }}
              />
            </View>
          )}

          {/* Przycisk */}
          <Pressable
            onPress={calculate}
            style={{
              backgroundColor: colors.evergreen.DEFAULT,
              borderRadius: 14, paddingVertical: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 16, fontFamily: 'Geist_500Medium', color: colors.cream.DEFAULT }}>
              Oblicz termin
            </Text>
          </Pressable>

          {/* Wynik */}
          {result && (
            <View style={{ marginTop: 24 }}>
              {/* Karta wynikowa */}
              <View style={{
                backgroundColor: colors.evergreen.DEFAULT,
                borderRadius: 20, padding: 22, overflow: 'hidden',
              }}>
                <Text style={{
                  fontSize: 11, color: 'rgba(255,255,255,0.65)',
                  textTransform: 'uppercase', letterSpacing: 0.8,
                  fontFamily: 'Geist_500Medium', marginBottom: 8,
                }}>
                  przewidywany termin porodu
                </Text>
                <Text style={{
                  fontFamily: 'Newsreader_400Regular', fontSize: 28,
                  color: colors.cream.DEFAULT, lineHeight: 34,
                }}>
                  {format(result.dueDate, 'd MMMM yyyy', { locale: pl })}
                </Text>

                {/* 3 statystyki */}
                <View style={{
                  flexDirection: 'row', marginTop: 18,
                  borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)',
                }}>
                  <DueStat
                    value={`${result.pregnancyWeek}.`}
                    label="tydzień ciąży"
                    separator={false}
                  />
                  <DueStat value={trimesterLabel!} label="trymestr" />
                  <DueStat
                    value={result.daysLeft > 0 ? `${weeksLeft}t ${daysRemainder}d` : '🎉'}
                    label="pozostało"
                  />
                </View>
              </View>

              {/* Nota */}
              <View style={{
                flexDirection: 'row', gap: 10, alignItems: 'flex-start',
                backgroundColor: colors.sage.soft, borderRadius: 14,
                padding: 14, marginTop: 12,
              }}>
                <Icon name="info" size={16} color={colors.evergreen.DEFAULT} />
                <Text style={{ flex: 1, fontSize: 12, color: colors.ink.soft, lineHeight: 18 }}>
                  Wynik jest orientacyjny. Termin potwierdzony przez lekarza na podstawie USG I trymestru jest dokładniejszy.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function DueStat({ value, label, separator = true }: { value: string; label: string; separator?: boolean }) {
  return (
    <View style={{
      flex: 1, alignItems: 'center', paddingTop: 14,
      borderLeftWidth: separator ? 1 : 0,
      borderLeftColor: 'rgba(255,255,255,0.15)',
    }}>
      <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 20, color: colors.cream.DEFAULT, lineHeight: 24 }}>
        {value}
      </Text>
      <Text style={{
        fontSize: 10, color: 'rgba(255,255,255,0.6)',
        textTransform: 'uppercase', letterSpacing: 0.4,
        marginTop: 4, fontFamily: 'Geist_500Medium',
      }}>
        {label}
      </Text>
    </View>
  );
}
