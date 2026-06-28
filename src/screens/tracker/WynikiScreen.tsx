import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Icon, DateField } from '@/components/ui';
import { useTrackersStore, type TestResult } from '@/stores/trackers';
import { colors } from '@/theme/tokens';
import { useT } from '@/i18n';

const SUGGESTED_TESTS = [
  'Morfologia krwi', 'Ferrytyna', 'TSH (tarczyca)', 'Glukoza na czczo',
  'OGTT 75g (1h)', 'OGTT 75g (2h)', 'Ogólne badanie moczu', 'Posiew moczu',
  'Antygen HBs', 'Anty-HCV', 'HIV', 'VDRL (kiła)', 'Toksoplazmoza IgG',
  'Toksoplazmoza IgM', 'Różyczka IgG', 'Cytomegalia IgG', 'Grupa krwi',
  'Czynnik Rh', 'Posiew GBS', 'Hemoglobina', 'CRP', 'Bilirubina',
];

type StatusType = 'normal' | 'abnormal' | 'unknown';
type TrimesterType = 1 | 2 | 3 | null;

interface FormState {
  name: string;
  value: string;
  unit: string;
  reference: string;
  date: string;
  status: StatusType;
  trimester: TrimesterType;
  note: string;
}

function getStatusLabels(tr: ReturnType<typeof useT>): Record<StatusType, { label: string; color: string; bg: string }> {
  return {
    normal: { label: tr.results.statusNormal, color: colors.evergreen.DEFAULT, bg: colors.sage.soft },
    abnormal: { label: tr.results.statusAbnormal, color: '#9C4F33', bg: colors.terracotta.soft },
    unknown: { label: tr.results.statusNotAssessed, color: colors.ink.faint, bg: colors.line.DEFAULT },
  };
}

const BACK_BTN = {
  width: 40, height: 40, borderRadius: 12, borderWidth: 0.5,
  borderColor: colors.line.DEFAULT, backgroundColor: colors.surface.DEFAULT,
  alignItems: 'center' as const, justifyContent: 'center' as const,
};

export default function WynikiScreen() {
  const router = useRouter();
  const tr = useT();
  const { testResults, addTestResult, deleteTestResult, updateTestResult } = useTrackersStore();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: '', value: '', unit: '', reference: '', date: new Date().toISOString().slice(0, 10),
    status: 'unknown', trimester: null, note: '',
  });

  const setF = (k: keyof FormState, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const openAdd = () => {
    setEditId(null);
    setForm({
      name: '', value: '', unit: '', reference: '',
      date: new Date().toISOString().slice(0, 10),
      status: 'unknown', trimester: null, note: '',
    });
    setShowForm(true);
  };

  const openEdit = (r: TestResult) => {
    setEditId(r.id);
    setForm({
      name: r.name, value: r.value, unit: r.unit,
      reference: r.reference, date: r.date, status: r.status,
      trimester: r.trimester, note: r.note,
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.value.trim()) return;
    if (editId) {
      updateTestResult(editId, form);
    } else {
      addTestResult(form);
    }
    setShowForm(false);
  };

  const STATUS_LABELS = getStatusLabels(tr);
  const outCount = testResults.filter((r) => r.status === 'abnormal').length;
  const okCount = testResults.filter((r) => r.status === 'normal').length;
  const sorted = [...testResults].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
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
              {tr.results.title}
            </Text>
          </View>
          <Pressable
            onPress={openAdd}
            style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="plus" size={22} color={colors.evergreen.DEFAULT} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 22, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {testResults.length === 0 ? (
            <View style={{ alignItems: 'center', paddingHorizontal: 16, paddingTop: 60 }}>
              <Text style={{ fontSize: 48, marginBottom: 20 }}>🔬</Text>
              <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 22, color: colors.ink.DEFAULT, textAlign: 'center', marginBottom: 10 }}>
                {tr.results.noResults}
              </Text>
              <Text style={{ fontSize: 14, color: colors.ink.soft, textAlign: 'center', lineHeight: 20, marginBottom: 28 }}>
                {tr.results.addDesc}
              </Text>
              <Pressable
                onPress={openAdd}
                style={{
                  backgroundColor: colors.evergreen.DEFAULT, borderRadius: 14,
                  paddingVertical: 14, paddingHorizontal: 32,
                }}
              >
                <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.cream.DEFAULT }}>
                  {tr.results.addResult}
                </Text>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Summary bar */}
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                backgroundColor: colors.surface.DEFAULT, borderWidth: 0.5,
                borderColor: colors.line.DEFAULT, borderRadius: 16,
                padding: 16, marginTop: 4, marginBottom: 16,
              }}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 24, color: colors.ink.DEFAULT }}>
                    {testResults.length}
                  </Text>
                  <Text style={{ fontSize: 11.5, color: colors.ink.soft, marginTop: 2 }}>{tr.results.results}</Text>
                </View>
                <View style={{ width: 0.5, alignSelf: 'stretch', backgroundColor: colors.line.DEFAULT, marginVertical: 4 }} />
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 24, color: colors.evergreen.DEFAULT }}>
                    {okCount}
                  </Text>
                  <Text style={{ fontSize: 11.5, color: colors.ink.soft, marginTop: 2 }}>{tr.results.normal}</Text>
                </View>
                <View style={{ width: 0.5, alignSelf: 'stretch', backgroundColor: colors.line.DEFAULT, marginVertical: 4 }} />
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontFamily: 'Newsreader_400Regular', fontSize: 24, color: colors.terracotta.DEFAULT }}>
                    {outCount}
                  </Text>
                  <Text style={{ fontSize: 11.5, color: colors.ink.soft, marginTop: 2 }}>{tr.results.attention}</Text>
                </View>
              </View>

              {/* Test cards */}
              <View style={{ gap: 10 }}>
                {sorted.map((r) => {
                  const st = STATUS_LABELS[r.status];
                  return (
                    <Pressable
                      key={r.id}
                      onPress={() => openEdit(r)}
                      style={{
                        backgroundColor: colors.surface.DEFAULT, borderWidth: 0.5,
                        borderColor: colors.line.DEFAULT, borderRadius: 16, padding: 16,
                      }}
                    >
                      {/* Name + pill */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                        <Text style={{ flex: 1, fontSize: 14.5, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
                          {r.name}
                        </Text>
                        <View style={{ backgroundColor: st.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99 }}>
                          <Text style={{ fontSize: 11.5, fontFamily: 'Geist_500Medium', color: st.color }}>
                            {st.label}
                          </Text>
                        </View>
                      </View>

                      {/* Value + range */}
                      <View style={{
                        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
                        paddingTop: 12, borderTopWidth: 0.5, borderTopColor: '#EDE8DE',
                      }}>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                          <Text style={{ fontFamily: 'GeistMono_400Regular', fontSize: 22, color: colors.ink.DEFAULT, letterSpacing: -0.5 }}>
                            {r.value}
                          </Text>
                          {r.unit ? (
                            <Text style={{ fontSize: 12, color: colors.ink.soft }}>{r.unit}</Text>
                          ) : null}
                        </View>
                        {r.reference ? (
                          <Text style={{ fontSize: 12.5, color: colors.ink.faint }}>
                            {tr.results.normalPrefix(r.reference)}
                          </Text>
                        ) : null}
                      </View>

                      {/* Date */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10 }}>
                        <Icon name="calendar" size={12} color={colors.ink.faint} />
                        <Text style={{ fontSize: 11.5, color: colors.ink.faint }}>{r.date}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </>
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
                <Pressable
                  onPress={() => setShowForm(false)}
                  style={{ paddingHorizontal: 12, paddingVertical: 6 }}
                >
                  <Text style={{ fontSize: 14, color: colors.ink.soft }}>{tr.results.cancel}</Text>
                </Pressable>
                <Text style={{ flex: 1, textAlign: 'center', fontSize: 15, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
                  {editId ? tr.results.editResult : tr.results.newResult}
                </Text>
                <Pressable onPress={handleSave} style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{
                    fontSize: 14, fontFamily: 'Geist_500Medium',
                    color: form.name.trim() && form.value.trim() ? colors.evergreen.DEFAULT : colors.ink.faint,
                  }}>
                    {tr.results.save}
                  </Text>
                </Pressable>
              </View>

              <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
                <View>
                  <Text style={labelStyle}>{tr.results.testName} *</Text>
                  <TextInput
                    value={form.name}
                    onChangeText={(v) => { setF('name', v); setShowSuggestions(v.length > 0); }}
                    placeholder="np. Morfologia krwi"
                    placeholderTextColor={colors.ink.faint}
                    style={inputStyle}
                  />
                  {showSuggestions && form.name.length > 0 && (
                    <View style={{
                      backgroundColor: colors.surface.DEFAULT, borderWidth: 1,
                      borderColor: colors.line.DEFAULT, borderRadius: 10, marginTop: 4, maxHeight: 160,
                    }}>
                      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="always">
                        {SUGGESTED_TESTS.filter((t) => t.toLowerCase().includes(form.name.toLowerCase())).map((t) => (
                          <Pressable
                            key={t}
                            onPress={() => { setF('name', t); setShowSuggestions(false); }}
                            style={{ paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: colors.line.DEFAULT }}
                          >
                            <Text style={{ fontSize: 14, color: colors.ink.DEFAULT }}>{t}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 2 }}>
                    <Text style={labelStyle}>{tr.results.value} *</Text>
                    <TextInput
                      value={form.value}
                      onChangeText={(v) => setF('value', v)}
                      placeholder="np. 14.2"
                      placeholderTextColor={colors.ink.faint}
                      keyboardType="decimal-pad"
                      style={inputStyle}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={labelStyle}>{tr.results.unit}</Text>
                    <TextInput
                      value={form.unit}
                      onChangeText={(v) => setF('unit', v)}
                      placeholder="g/dL"
                      placeholderTextColor={colors.ink.faint}
                      style={inputStyle}
                    />
                  </View>
                </View>

                <View>
                  <Text style={labelStyle}>{tr.results.normalRange}</Text>
                  <TextInput
                    value={form.reference}
                    onChangeText={(v) => setF('reference', v)}
                    placeholder="np. 12-16"
                    placeholderTextColor={colors.ink.faint}
                    style={inputStyle}
                  />
                </View>

                <View>
                  <Text style={labelStyle}>{tr.results.dateLabel}</Text>
                  <DateField
                    value={form.date}
                    onChange={(v) => setF('date', v)}
                    modalTitle={tr.results.dateLabel}
                    placeholder="Wybierz datę"
                    maxYear={2040}
                  />
                </View>

                <View>
                  <Text style={labelStyle}>{tr.results.trimester}</Text>
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {([null, 1, 2, 3] as TrimesterType[]).map((tv) => (
                      <Pressable
                        key={String(tv)}
                        onPress={() => setF('trimester', tv)}
                        style={{
                          paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99,
                          backgroundColor: form.trimester === tv ? colors.evergreen.DEFAULT : colors.surface.DEFAULT,
                          borderWidth: 1, borderColor: form.trimester === tv ? colors.evergreen.DEFAULT : colors.line.DEFAULT,
                        }}
                      >
                        <Text style={{
                          fontSize: 13, fontFamily: 'Geist_500Medium',
                          color: form.trimester === tv ? colors.cream.DEFAULT : colors.ink.DEFAULT,
                        }}>
                          {tv === null ? tr.results.none : tr.results.trimesterN(tv)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View>
                  <Text style={labelStyle}>{tr.results.assessment}</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {(['normal', 'abnormal', 'unknown'] as StatusType[]).map((s) => {
                      const st = STATUS_LABELS[s];
                      return (
                        <Pressable
                          key={s}
                          onPress={() => setF('status', s)}
                          style={{
                            flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center',
                            backgroundColor: form.status === s ? st.bg : colors.surface.DEFAULT,
                            borderWidth: 1,
                            borderColor: form.status === s ? st.color : colors.line.DEFAULT,
                          }}
                        >
                          <Text style={{
                            fontSize: 12, fontFamily: 'Geist_500Medium',
                            color: form.status === s ? st.color : colors.ink.faint,
                          }}>
                            {st.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View>
                  <Text style={labelStyle}>{tr.results.note}</Text>
                  <TextInput
                    value={form.note}
                    onChangeText={(v) => setF('note', v)}
                    placeholder={`${tr.results.note} (${tr.results.none.toLowerCase()})`}
                    placeholderTextColor={colors.ink.faint}
                    multiline
                    numberOfLines={3}
                    style={[inputStyle, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]}
                  />
                </View>

                {editId && (
                  <Pressable
                    onPress={() => { deleteTestResult(editId); setShowForm(false); }}
                    style={{
                      borderWidth: 0.5, borderColor: colors.line.DEFAULT,
                      backgroundColor: colors.surface.DEFAULT, borderRadius: 14,
                      paddingVertical: 14, alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 14, fontFamily: 'Geist_500Medium', color: colors.terracotta.DEFAULT }}>
                      {tr.results.deleteResult}
                    </Text>
                  </Pressable>
                )}
              </ScrollView>
              </KeyboardAvoidingView>
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

const labelStyle = {
  fontSize: 11,
  color: colors.ink.faint,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
  marginBottom: 6,
  fontFamily: 'Geist_500Medium',
};

const inputStyle = {
  backgroundColor: colors.surface.DEFAULT,
  borderWidth: 0.5,
  borderColor: colors.line.DEFAULT,
  borderRadius: 13,
  paddingHorizontal: 15,
  paddingVertical: 14,
  fontSize: 15.5,
  color: colors.ink.DEFAULT,
  fontFamily: 'Geist_400Regular',
};
