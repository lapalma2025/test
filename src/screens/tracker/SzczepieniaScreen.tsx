import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
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

export default function SzczepieniaScreen() {
  const router = useRouter();
  const t = useT();
  const { vaccinations, initVaccinations, toggleVaccination } = useTrackersStore();

  useEffect(() => { initVaccinations(); }, []);

  const groups = buildGroups(vaccinations);
  const doneN = vaccinations.filter((v) => v.done).length;
  const totalN = vaccinations.length;
  const pct = totalN > 0 ? Math.round((doneN / totalN) * 100) : 0;

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

        <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Header card */}
          <View style={{
            flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            backgroundColor: colors.surface.DEFAULT, borderWidth: 0.5,
            borderColor: colors.line.DEFAULT, borderRadius: 16, padding: 18, marginTop: 4, marginBottom: 18,
          }}>
            <View>
              <Text style={{ fontSize: 11, color: colors.ink.faint, fontFamily: 'Geist_500Medium', letterSpacing: 0.4 }}>
                {t.vaccinations.gisSchedule}
              </Text>
              <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 20, color: colors.ink.DEFAULT, marginTop: 5 }}>
                {t.vaccinations.ofStages(doneN, totalN)}
              </Text>
            </View>
            {/* Ring indicator */}
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
                  {/* Left: dot + line */}
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
                          onPress={() => toggleVaccination(vacc.id)}
                          style={{
                            backgroundColor: vacc.done ? colors.sage.soft : '#EFE9DC',
                            paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
                          }}
                        >
                          <Text style={{
                            fontSize: 12, color: vacc.done ? colors.evergreen.DEFAULT : colors.ink.soft,
                          }}>
                            {vacc.name}{vacc.detail ? ` · ${vacc.detail}` : ''}
                          </Text>
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
    </View>
  );
}
