import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { addDays, differenceInDays, format, parseISO, isValid } from 'date-fns';
import { pl } from 'date-fns/locale';

import { Icon, DateField } from '@/components/ui';
import { colors } from '@/theme/tokens';

type CalcMode = 'lmp' | 'week' | 'ivf';

type EmbryoDay = 3 | 5 | 6;
const EMBRYO_OPTIONS: { day: EmbryoDay; label: string; sublabel: string }[] = [
  { day: 3, label: 'Dzień 3', sublabel: 'zarodek' },
  { day: 5, label: 'Dzień 5', sublabel: 'blastocysta (najczęściej)' },
  { day: 6, label: 'Dzień 6', sublabel: 'blastocysta rozwinięta' },
];

function calcIvfDueDate(transferDate: Date, embryoDay: EmbryoDay): Date {
  return addDays(transferDate, 266 - embryoDay);
}

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
  const [transferDate, setTransferDate] = useState('');
  const [embryoDay, setEmbryoDay] = useState<EmbryoDay>(5);

  const [result, setResult] = useState<{
    dueDate: Date;
    pregnancyWeek: number;
    daysLeft: number;
    ivfGestAgeAtTransfer?: string;
  } | null>(null);

  const calculate = () => {
    const today = new Date();

    if (mode === 'lmp') {
      if (!lmpDate.match(/^\d{4}-\d{2}-\d{2}$/)) return;
      try {
        const lmp = parseISO(lmpDate);
        if (!isValid(lmp)) return;
        const dueDate = addDays(lmp, 280);
        const daysFromLMP = differenceInDays(today, lmp);
        const pregnancyWeek = Math.min(42, Math.max(1, Math.floor(daysFromLMP / 7) + 1));
        const daysLeft = differenceInDays(dueDate, today);
        setResult({ dueDate, pregnancyWeek, daysLeft: Math.max(0, daysLeft) });
      } catch { /* invalid */ }

    } else if (mode === 'week') {
      const w = parseInt(currentWeek, 10);
      if (isNaN(w) || w < 1 || w > 42) return;
      const lmpEstimated = addDays(today, -(w - 1) * 7);
      const dueDate = addDays(lmpEstimated, 280);
      const daysLeft = differenceInDays(dueDate, today);
      setResult({ dueDate, pregnancyWeek: w, daysLeft: Math.max(0, daysLeft) });

    } else {
      if (!transferDate.match(/^\d{4}-\d{2}-\d{2}$/)) return;
      try {
        const tDate = parseISO(transferDate);
        if (!isValid(tDate)) return;
        const dueDate = calcIvfDueDate(tDate, embryoDay);
        const gestDaysAtTransfer = 14 + embryoDay;
        const gestWeeksAtTransfer = Math.floor(gestDaysAtTransfer / 7);
        const gestDayRemainder = gestDaysAtTransfer % 7;
        const theoreticalLMP = addDays(dueDate, -280);
        const daysFromLMP = differenceInDays(today, theoreticalLMP);
        const pregnancyWeek = Math.min(42, Math.max(1, Math.floor(daysFromLMP / 7) + 1));
        const daysLeft = differenceInDays(dueDate, today);
        setResult({
          dueDate, pregnancyWeek,
          daysLeft: Math.max(0, daysLeft),
          ivfGestAgeAtTransfer: `${gestWeeksAtTransfer} tyg. ${gestDayRemainder} dni`,
        });
      } catch { /* invalid */ }
    }
  };

  const weeksLeft = result ? Math.floor(result.daysLeft / 7) : null;
  const daysRemainder = result ? result.daysLeft % 7 : null;
  const trimester = result
    ? result.pregnancyWeek <= 13 ? 1 : result.pregnancyWeek <= 27 ? 2 : 3
    : null;
  const trimesterLabel = trimester === 1 ? 'I trymestr' : trimester === 2 ? 'II trymestr' : 'III trymestr';

  const handleModeChange = (m: CalcMode) => { setMode(m); setResult(null); };

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

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={{
              fontFamily: 'Newsreader_400Regular', fontSize: 22, color: colors.ink.DEFAULT,
              lineHeight: 30, marginTop: 8, marginBottom: 22,
            }}>
              Oblicz przewidywany{'\n'}termin porodu
            </Text>

            {/* Tryb */}
            <View style={{
              backgroundColor: colors.surface.DEFAULT,
              borderWidth: 0.5, borderColor: colors.line.DEFAULT,
              borderRadius: 14, padding: 4, marginBottom: 22,
              flexDirection: 'row',
            }}>
              {(['lmp', 'week', 'ivf'] as CalcMode[]).map((m) => (
                <Pressable
                  key={m}
                  onPress={() => handleModeChange(m)}
                  style={{
                    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 11,
                    backgroundColor: mode === m ? colors.evergreen.DEFAULT : 'transparent',
                  }}
                >
                  <Text style={{
                    fontSize: 12, fontFamily: 'Geist_500Medium',
                    color: mode === m ? colors.cream.DEFAULT : colors.ink.soft,
                  }}>
                    {m === 'lmp' ? 'Z miesiączki' : m === 'week' ? 'Z tygodnia' : 'In Vitro'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* ===== TRYB: LMP ===== */}
            {mode === 'lmp' && (
              <View style={{ marginBottom: 20 }}>
                <DateField
                  value={lmpDate}
                  onChange={(v) => { setLmpDate(v); setResult(null); }}
                  label="Pierwsza data ostatniej miesiączki (LMP)"
                  modalTitle="Data ostatniej miesiączki"
                  placeholder="Wybierz datę"
                  maxYear={2035}
                />
              </View>
            )}

            {/* ===== TRYB: TYDZIEŃ ===== */}
            {mode === 'week' && (
              <View style={{ gap: 6, marginBottom: 20 }}>
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
                    fontSize: 28, color: colors.ink.DEFAULT,
                    fontFamily: 'Geist_500Medium', textAlign: 'center',
                  }}
                />
              </View>
            )}

            {/* ===== TRYB: IN VITRO ===== */}
            {mode === 'ivf' && (
              <View style={{ gap: 20, marginBottom: 20 }}>
                <View style={{
                  backgroundColor: `${colors.evergreen.DEFAULT}10`,
                  borderWidth: 1, borderColor: `${colors.evergreen.DEFAULT}30`,
                  borderRadius: 14, padding: 14, flexDirection: 'row', gap: 10,
                }}>
                  <Icon name="info" size={15} color={colors.evergreen.DEFAULT} />
                  <Text style={{ flex: 1, fontSize: 12, color: colors.ink.soft, lineHeight: 18 }}>
                    Wzór: data porodu = data transferu + (266 − dzień zarodka).{'\n'}
                    Taki sam wynik dla świeżego i mrożonego transferu (FET).
                  </Text>
                </View>

                <DateField
                  value={transferDate}
                  onChange={(v) => { setTransferDate(v); setResult(null); }}
                  label="Data transferu zarodka"
                  modalTitle="Data transferu zarodka"
                  placeholder="Wybierz datę transferu"
                  maxYear={2035}
                />

                <View style={{ gap: 10 }}>
                  <Text style={{
                    fontSize: 11, color: colors.ink.faint, textTransform: 'uppercase',
                    letterSpacing: 0.6, fontFamily: 'Geist_500Medium',
                  }}>
                    Wiek zarodka w dniu transferu
                  </Text>
                  <View style={{ gap: 8 }}>
                    {EMBRYO_OPTIONS.map((opt) => {
                      const active = embryoDay === opt.day;
                      return (
                        <Pressable
                          key={opt.day}
                          onPress={() => { setEmbryoDay(opt.day); setResult(null); }}
                          style={{
                            flexDirection: 'row', alignItems: 'center',
                            paddingHorizontal: 16, paddingVertical: 14,
                            borderRadius: 14, borderWidth: 1,
                            backgroundColor: active ? `${colors.evergreen.DEFAULT}12` : colors.surface.DEFAULT,
                            borderColor: active ? colors.evergreen.DEFAULT : colors.line.DEFAULT,
                          }}
                        >
                          <View style={{
                            width: 20, height: 20, borderRadius: 10, borderWidth: 2,
                            borderColor: active ? colors.evergreen.DEFAULT : colors.line.DEFAULT,
                            alignItems: 'center', justifyContent: 'center', marginRight: 12,
                          }}>
                            {active && (
                              <View style={{
                                width: 10, height: 10, borderRadius: 5,
                                backgroundColor: colors.evergreen.DEFAULT,
                              }} />
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{
                              fontSize: 14,
                              fontFamily: active ? 'Geist_500Medium' : 'Geist_400Regular',
                              color: active ? colors.evergreen.DEFAULT : colors.ink.DEFAULT,
                            }}>
                              {opt.label}
                            </Text>
                            <Text style={{ fontSize: 11, color: colors.ink.faint, marginTop: 1 }}>
                              {opt.sublabel}
                            </Text>
                          </View>
                          <View style={{
                            backgroundColor: active ? `${colors.evergreen.DEFAULT}18` : colors.line.DEFAULT,
                            borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
                          }}>
                            <Text style={{
                              fontSize: 11, fontFamily: 'GeistMono_400Regular',
                              color: active ? colors.evergreen.DEFAULT : colors.ink.soft,
                            }}>
                              +{266 - opt.day} dni
                            </Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>

                  <View style={{
                    backgroundColor: colors.surface.DEFAULT,
                    borderWidth: 0.5, borderColor: colors.line.DEFAULT,
                    borderRadius: 12, padding: 12,
                  }}>
                    <Text style={{ fontSize: 11, color: colors.ink.soft, lineHeight: 16 }}>
                      W dniu transferu (dzień {embryoDay}) ciąża ma już{' '}
                      <Text style={{ fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
                        2 tyg. {embryoDay} dni
                      </Text>{' '}
                      (tydzień {Math.floor((14 + embryoDay) / 7)}+{(14 + embryoDay) % 7}).
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Przycisk oblicz */}
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
                <View style={{
                  backgroundColor: colors.evergreen.DEFAULT,
                  borderRadius: 20, padding: 22,
                }}>
                  {mode === 'ivf' && (
                    <View style={{
                      alignSelf: 'flex-start',
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
                      marginBottom: 10,
                    }}>
                      <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)', fontFamily: 'Geist_500Medium' }}>
                        IN VITRO · DZIEŃ {embryoDay}
                      </Text>
                    </View>
                  )}

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

                  <View style={{
                    flexDirection: 'row', marginTop: 18,
                    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)',
                  }}>
                    <DueStat value={`${result.pregnancyWeek}.`} label="tydzień ciąży" separator={false} />
                    <DueStat value={trimesterLabel!} label="trymestr" />
                    <DueStat
                      value={result.daysLeft > 0 ? `${weeksLeft}t ${daysRemainder}d` : '🎉'}
                      label="pozostało"
                    />
                  </View>
                </View>

                {mode === 'ivf' && result.ivfGestAgeAtTransfer && (
                  <View style={{
                    borderWidth: 0.5, borderColor: colors.line.DEFAULT,
                    borderRadius: 14, padding: 14, marginTop: 10,
                    backgroundColor: colors.surface.DEFAULT,
                    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
                  }}>
                    <Icon name="info" size={15} color={colors.evergreen.DEFAULT} />
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={{ fontSize: 12, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
                        Wiek ciążowy w dniu transferu: {result.ivfGestAgeAtTransfer}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.ink.soft, lineHeight: 16 }}>
                        Wzór: data transferu + {266 - embryoDay} dni (266 − {embryoDay})
                      </Text>
                    </View>
                  </View>
                )}

                <View style={{
                  flexDirection: 'row', gap: 10, alignItems: 'flex-start',
                  backgroundColor: colors.sage.soft, borderRadius: 14,
                  padding: 14, marginTop: 10,
                }}>
                  <Icon name="info" size={16} color={colors.evergreen.DEFAULT} />
                  <Text style={{ flex: 1, fontSize: 12, color: colors.ink.soft, lineHeight: 18 }}>
                    {mode === 'ivf'
                      ? 'Termin po in vitro jest bardzo dokładny — wiek zarodka jest znany co do dnia. Klinika może go doprecyzować po USG I trymestru.'
                      : 'Wynik jest orientacyjny. Termin potwierdzony przez lekarza na podstawie USG I trymestru jest dokładniejszy.'}
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
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
