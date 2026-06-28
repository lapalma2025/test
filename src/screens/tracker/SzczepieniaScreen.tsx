import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, Modal, TextInput,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Icon } from '@/components/ui';
import { useTrackersStore, type Vaccination } from '@/stores/trackers';
import { colors } from '@/theme/tokens';
import { useT } from '@/i18n';

const BACK_BTN = {
  width: 40, height: 40, borderRadius: 12, borderWidth: 0.5,
  borderColor: colors.line.DEFAULT, backgroundColor: colors.surface.DEFAULT,
  alignItems: 'center' as const, justifyContent: 'center' as const,
};

interface VaccGroup {
  label: string;
  items: Vaccination[];
  done: boolean;
  next: boolean;
}

function buildGroups(vaccinations: Vaccination[]): VaccGroup[] {
  const order: string[] = [];
  const map: Record<string, Vaccination[]> = {};
  vaccinations.forEach((v) => {
    if (!map[v.groupLabel]) {
      order.push(v.groupLabel);
      map[v.groupLabel] = [];
    }
    map[v.groupLabel]!.push(v);
  });

  let lastDoneIdx = -1;
  const groups: VaccGroup[] = order.map((label, i) => {
    const items = map[label] ?? [];
    const done = items.every((v) => v.done);
    if (done) lastDoneIdx = i;
    return { label, items, done, next: false };
  });

  const nextIdx = lastDoneIdx + 1;
  if (nextIdx < groups.length) {
    groups[nextIdx]!.next = true;
  }

  return groups;
}

function todayDisplay(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  return `${dd}.${mm}.${yyyy}`;
}

// ─── DATE MODAL ───────────────────────────────────────────────────────────────

interface DateModalProps {
  visible: boolean;
  vaccName: string;
  onConfirm: (date: string) => void;
  onClose: () => void;
}

function DateModal({ visible, vaccName, onConfirm, onClose }: DateModalProps) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [useToday, setUseToday] = useState(true);

  const monthRef = useRef<TextInput>(null);
  const yearRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      setDay('');
      setMonth('');
      setYear('');
      setUseToday(true);
    }
  }, [visible]);

  const today = todayDisplay();

  function handleConfirm() {
    if (useToday) {
      onConfirm(today);
      return;
    }
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (
      !day || !month || !year || year.length < 4 ||
      d < 1 || d > 31 || m < 1 || m > 12 || y < 2020 || y > 2035
    ) {
      Alert.alert('Niepoprawna data', 'Sprawdź wpisaną datę (DD.MM.RRRR).');
      return;
    }
    onConfirm(`${String(d).padStart(2, '0')}.${String(m).padStart(2, '0')}.${y}`);
  }

  function handleDayChange(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 2);
    setDay(digits);
    if (digits.length === 2) {
      monthRef.current?.focus();
    }
  }

  function handleMonthChange(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 2);
    setMonth(digits);
    if (digits.length === 2) {
      yearRef.current?.focus();
    }
  }

  function handleYearChange(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    setYear(digits);
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <Pressable
            onPress={() => undefined}
            style={{
              backgroundColor: colors.cream.DEFAULT,
              borderTopLeftRadius: 24, borderTopRightRadius: 24,
              padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 28,
            }}
          >
            {/* Drag handle */}
            <View style={{
              width: 36, height: 4, borderRadius: 2,
              backgroundColor: colors.line.DEFAULT, alignSelf: 'center', marginBottom: 20,
            }} />

            <Text style={{
              fontSize: 16, fontFamily: 'Geist_500Medium',
              color: colors.ink.DEFAULT, marginBottom: 4,
            }}>
              Kiedy podano szczepienie?
            </Text>
            <Text style={{ fontSize: 13, color: colors.ink.soft, marginBottom: 20 }} numberOfLines={2}>
              {vaccName}
            </Text>

            {/* Opcja: Dziś */}
            <Pressable
              onPress={() => setUseToday(true)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                padding: 14, borderRadius: 14, marginBottom: 10,
                borderWidth: 1.5,
                borderColor: useToday ? colors.evergreen.DEFAULT : colors.line.DEFAULT,
                backgroundColor: useToday ? `${colors.evergreen.DEFAULT}0D` : colors.surface.DEFAULT,
              }}
            >
              <View style={{
                width: 22, height: 22, borderRadius: 11, borderWidth: 2,
                borderColor: useToday ? colors.evergreen.DEFAULT : colors.line.DEFAULT,
                backgroundColor: useToday ? colors.evergreen.DEFAULT : 'transparent',
                alignItems: 'center', justifyContent: 'center',
              }}>
                {useToday && <Icon name="check" size={12} color="#fff" strokeWidth={2.5} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
                  Dziś
                </Text>
                <Text style={{ fontSize: 13, color: colors.ink.soft, marginTop: 1 }}>{today}</Text>
              </View>
            </Pressable>

            {/* Opcja: Inna data */}
            <Pressable
              onPress={() => { setUseToday(false); setTimeout(() => monthRef.current?.blur(), 50); }}
              style={{
                padding: 14, borderRadius: 14,
                borderWidth: 1.5,
                borderColor: !useToday ? colors.evergreen.DEFAULT : colors.line.DEFAULT,
                backgroundColor: !useToday ? `${colors.evergreen.DEFAULT}0D` : colors.surface.DEFAULT,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: !useToday ? 14 : 0 }}>
                <View style={{
                  width: 22, height: 22, borderRadius: 11, borderWidth: 2,
                  borderColor: !useToday ? colors.evergreen.DEFAULT : colors.line.DEFAULT,
                  backgroundColor: !useToday ? colors.evergreen.DEFAULT : 'transparent',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {!useToday && <Icon name="check" size={12} color="#fff" strokeWidth={2.5} />}
                </View>
                <Text style={{ fontSize: 14, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
                  Inna data
                </Text>
              </View>

              {!useToday && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {/* DD */}
                  <TextInput
                    value={day}
                    onChangeText={handleDayChange}
                    placeholder="DD"
                    placeholderTextColor={colors.ink.faint}
                    keyboardType="number-pad"
                    maxLength={2}
                    autoFocus
                    style={{
                      width: 54, textAlign: 'center', fontSize: 20,
                      fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT,
                      backgroundColor: colors.cream.DEFAULT, borderRadius: 10,
                      borderWidth: 1, borderColor: colors.line.DEFAULT,
                      paddingVertical: 10,
                    }}
                  />
                  <Text style={{ fontSize: 18, color: colors.ink.faint, marginBottom: 2 }}>.</Text>
                  {/* MM */}
                  <TextInput
                    ref={monthRef}
                    value={month}
                    onChangeText={handleMonthChange}
                    placeholder="MM"
                    placeholderTextColor={colors.ink.faint}
                    keyboardType="number-pad"
                    maxLength={2}
                    style={{
                      width: 54, textAlign: 'center', fontSize: 20,
                      fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT,
                      backgroundColor: colors.cream.DEFAULT, borderRadius: 10,
                      borderWidth: 1, borderColor: colors.line.DEFAULT,
                      paddingVertical: 10,
                    }}
                  />
                  <Text style={{ fontSize: 18, color: colors.ink.faint, marginBottom: 2 }}>.</Text>
                  {/* RRRR */}
                  <TextInput
                    ref={yearRef}
                    value={year}
                    onChangeText={handleYearChange}
                    placeholder="RRRR"
                    placeholderTextColor={colors.ink.faint}
                    keyboardType="number-pad"
                    maxLength={4}
                    style={{
                      width: 78, textAlign: 'center', fontSize: 20,
                      fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT,
                      backgroundColor: colors.cream.DEFAULT, borderRadius: 10,
                      borderWidth: 1, borderColor: colors.line.DEFAULT,
                      paddingVertical: 10,
                    }}
                  />
                </View>
              )}
            </Pressable>

            {/* Przyciski */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 20 }}>
              <Pressable
                onPress={onClose}
                style={{
                  flex: 1, paddingVertical: 14, borderRadius: 14,
                  backgroundColor: colors.surface.DEFAULT,
                  borderWidth: 1, borderColor: colors.line.DEFAULT,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.ink.soft }}>
                  Anuluj
                </Text>
              </Pressable>
              <Pressable
                onPress={handleConfirm}
                style={{
                  flex: 2, paddingVertical: 14, borderRadius: 14,
                  backgroundColor: colors.evergreen.DEFAULT, alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: '#fff' }}>
                  Zatwierdź szczepienie
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function SzczepieniaScreen() {
  const router = useRouter();
  const t = useT();
  const { vaccinations, initVaccinations, toggleVaccination } = useTrackersStore();
  const [pendingVacc, setPendingVacc] = useState<Vaccination | null>(null);

  useEffect(() => { initVaccinations(); }, []);

  const groups = buildGroups(vaccinations);
  const doneN = vaccinations.filter((v) => v.done).length;
  const totalN = vaccinations.length;
  const pct = totalN > 0 ? Math.round((doneN / totalN) * 100) : 0;

  function handleChipPress(vacc: Vaccination) {
    if (vacc.done) {
      Alert.alert(
        'Odznacz szczepienie?',
        `Czy na pewno chcesz usunąć oznaczenie "${vacc.name}"?`,
        [
          { text: 'Anuluj', style: 'cancel' },
          {
            text: 'Odznacz', style: 'destructive',
            onPress: () => toggleVaccination(vacc.id),
          },
        ],
      );
    } else {
      setPendingVacc(vacc);
    }
  }

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
              {t.vaccinations.title}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header card */}
          <View style={{
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            backgroundColor: colors.surface.DEFAULT, borderWidth: 0.5,
            borderColor: colors.line.DEFAULT, borderRadius: 16,
            padding: 18, marginTop: 4, marginBottom: 18,
          }}>
            <View>
              <Text style={{ fontSize: 11, color: colors.ink.faint, fontFamily: 'Geist_500Medium', letterSpacing: 0.4 }}>
                {t.vaccinations.gisSchedule}
              </Text>
              <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 20, color: colors.ink.DEFAULT, marginTop: 5 }}>
                {t.vaccinations.ofStages(doneN, totalN)}
              </Text>
            </View>
            <View style={{
              width: 56, height: 56, borderRadius: 28,
              borderWidth: 3,
              borderColor: pct > 0 ? colors.evergreen.DEFAULT : colors.line.DEFAULT,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: pct === 100 ? colors.evergreen.DEFAULT : colors.surface.DEFAULT,
            }}>
              <Text style={{
                fontFamily: 'GeistMono_400Regular', fontSize: 12,
                color: pct === 100 ? '#fff' : colors.evergreen.DEFAULT,
              }}>
                {pct}%
              </Text>
            </View>
          </View>

          {/* Timeline */}
          <View style={{ paddingLeft: 6 }}>
            {groups.map((group, gi) => {
              const isLast = gi === groups.length - 1;
              return (
                <View key={group.label} style={{ flexDirection: 'row', gap: 16, paddingBottom: isLast ? 0 : 22 }}>
                  {/* Dot + line */}
                  <View style={{ alignItems: 'center', width: 14 }}>
                    <View style={{
                      width: 14, height: 14, borderRadius: 7,
                      backgroundColor: group.done
                        ? colors.evergreen.DEFAULT
                        : group.next
                        ? colors.terracotta.soft
                        : colors.surface.DEFAULT,
                      borderWidth: 1.5,
                      borderColor: group.done
                        ? colors.evergreen.DEFAULT
                        : group.next
                        ? colors.terracotta.DEFAULT
                        : colors.line.DEFAULT,
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      {group.done && <Icon name="check" size={8} color="#fff" strokeWidth={2.4} />}
                    </View>
                    {!isLast && (
                      <View style={{ width: 1.5, flex: 1, backgroundColor: colors.line.DEFAULT, marginTop: 4 }} />
                    )}
                  </View>

                  {/* Content */}
                  <View style={{ flex: 1, paddingBottom: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, flexWrap: 'wrap', marginBottom: 10 }}>
                      <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
                        {group.label}
                      </Text>
                      {group.next && (
                        <View style={{
                          backgroundColor: colors.terracotta.soft, paddingHorizontal: 10, paddingVertical: 5,
                          borderRadius: 99,
                        }}>
                          <Text style={{ fontSize: 11.5, fontFamily: 'Geist_500Medium', color: '#9C4F33' }}>
                            {t.vaccinations.next}
                          </Text>
                        </View>
                      )}
                      {group.done && (
                        <Text style={{ fontSize: 12, fontFamily: 'GeistMono_400Regular', color: colors.ink.faint }}>
                          {group.items.find((v) => v.completedDate)?.completedDate ?? t.vaccinations.done}
                        </Text>
                      )}
                    </View>

                    {/* Shot chips */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                      {group.items.map((vacc) => (
                        <Pressable
                          key={vacc.id}
                          onPress={() => handleChipPress(vacc)}
                          style={{
                            backgroundColor: vacc.done ? colors.sage.soft : '#EFE9DC',
                            paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                          }}
                        >
                          <Text style={{
                            fontSize: 12,
                            color: vacc.done ? colors.evergreen.DEFAULT : colors.ink.soft,
                          }}>
                            {vacc.name}{vacc.detail ? ` · ${vacc.detail}` : ''}
                          </Text>
                          {vacc.done && vacc.completedDate ? (
                            <Text style={{
                              fontSize: 10, fontFamily: 'GeistMono_400Regular',
                              color: colors.evergreen.DEFAULT, marginTop: 2, opacity: 0.75,
                            }}>
                              {vacc.completedDate}
                            </Text>
                          ) : null}
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>

      <DateModal
        visible={pendingVacc !== null}
        vaccName={pendingVacc ? `${pendingVacc.name}${pendingVacc.detail ? ` · ${pendingVacc.detail}` : ''}` : ''}
        onConfirm={(date) => {
          if (pendingVacc) toggleVaccination(pendingVacc.id, date);
          setPendingVacc(null);
        }}
        onClose={() => setPendingVacc(null)}
      />
    </View>
  );
}
