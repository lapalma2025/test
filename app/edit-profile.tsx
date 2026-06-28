import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Icon, DateField } from '@/components/ui';
import { useProfileStore, type ProfileState } from '@/stores/profile';
import { VOIVODESHIPS } from '@/constants/voivodeships';
import { type EmploymentType } from '@/engine/eligibility-engine';
import { colors } from '@/theme/tokens';

const EMPLOYMENT_OPTIONS: { value: EmploymentType; label: string }[] = [
  { value: 'uop', label: 'Umowa o pracę' },
  { value: 'b2b_chorobowe', label: 'B2B z chorobowym' },
  { value: 'b2b_no_chorobowe', label: 'B2B bez chorobowego' },
  { value: 'zlecenie_chorobowe', label: 'Zlecenie z chorobowym' },
  { value: 'zlecenie_no_chorobowe', label: 'Zlecenie bez chorobowego' },
  { value: 'student', label: 'Student/ka' },
  { value: 'none', label: 'Bez pracy' },
  { value: 'unemployed', label: 'Bezrobotny/a' },
];

function isValidDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s);
  return !isNaN(d.getTime());
}

export default function EditProfileScreen() {
  const router = useRouter();
  const profile = useProfileStore();

  const [parentName, setParentName] = useState(profile.parentName);
  const [childName, setChildName] = useState(profile.childName);
  const [childDueDate, setChildDueDate] = useState(profile.childDueDate ?? '');
  const [childBirthDate, setChildBirthDate] = useState(profile.childBirthDate ?? '');
  const [city, setCity] = useState(profile.city);
  const [voivodeship, setVoivodeship] = useState(profile.voivodeship);
  const [employment, setEmployment] = useState<EmploymentType>(profile.employment);
  const [firstChild, setFirstChild] = useState(profile.firstChild);
  const [numberOfChildren, setNumberOfChildren] = useState(String(profile.numberOfChildren ?? 2));
  const [monthlyNetIncomePln, setMonthlyNetIncomePln] = useState(
    profile.monthlyNetIncomePln > 0 ? String(profile.monthlyNetIncomePln) : ''
  );
  const [partnerMonthlyNetIncomePln, setPartnerMonthlyNetIncomePln] = useState(
    profile.partnerMonthlyNetIncomePln > 0 ? String(profile.partnerMonthlyNetIncomePln) : ''
  );
  const [householdSize, setHouseholdSize] = useState(String(profile.householdSize ?? 2));
  const [voivodeshipOpen, setVoivodeshipOpen] = useState(false);

  const canSave = true;

  const handleSave = () => {
    const parsedIncome = parseFloat(monthlyNetIncomePln.replace(',', '.')) || 0;
    const parsedPartnerIncome = parseFloat(partnerMonthlyNetIncomePln.replace(',', '.')) || 0;
    const parsedHousehold = parseInt(householdSize) || 2;
    const parsedChildren = parseInt(numberOfChildren) || 2;
    const updates: Partial<ProfileState> = {
      parentName: parentName.trim(),
      childName: childName.trim(),
      childDueDate: childDueDate && isValidDate(childDueDate) ? childDueDate : null,
      childBirthDate: childBirthDate && isValidDate(childBirthDate) ? childBirthDate : null,
      city: city.trim(),
      voivodeship,
      employment,
      firstChild,
      numberOfChildren: firstChild ? 1 : parsedChildren,
      monthlyNetIncomePln: parsedIncome,
      partnerMonthlyNetIncomePln: parsedPartnerIncome,
      householdSize: parsedHousehold,
    };
    profile.setMany(updates);
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }} edges={['top', 'bottom']}>
      {/* Nagłówek */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 12,
        borderBottomWidth: 0.5, borderBottomColor: colors.line.DEFAULT,
      }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="cross" size={20} color={colors.ink.DEFAULT} />
        </Pressable>
        <Text style={{ flex: 1, textAlign: 'center', fontFamily: 'Geist_500Medium', fontSize: 15, color: colors.ink.DEFAULT }}>
          Edytuj profil
        </Text>
        <Pressable
          onPress={canSave ? handleSave : undefined}
          style={{ paddingHorizontal: 16, paddingVertical: 8 }}
        >
          <Text style={{
            fontFamily: 'Geist_500Medium', fontSize: 15,
            color: canSave ? colors.evergreen.DEFAULT : colors.ink.faint,
          }}>
            Zapisz
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Rodzic */}
          <SectionLabel>Rodzic</SectionLabel>
          <FieldBlock>
            <FieldRow label="Twoje imię">
              <TextInput
                value={parentName}
                onChangeText={setParentName}
                placeholder="Imię"
                placeholderTextColor={colors.ink.faint}
                style={inputStyle}
              />
            </FieldRow>
          </FieldBlock>

          {/* Dziecko */}
          <SectionLabel>Dziecko</SectionLabel>
          <FieldBlock>
            <FieldRow label="Imię dziecka">
              <TextInput
                value={childName}
                onChangeText={setChildName}
                placeholder="Imię (opcjonalnie)"
                placeholderTextColor={colors.ink.faint}
                style={inputStyle}
              />
            </FieldRow>
            <Separator />
            <FieldRow label="Termin porodu">
              <DateField
                value={childDueDate}
                onChange={setChildDueDate}
                modalTitle="Termin porodu"
                placeholder="Wybierz datę"
                maxYear={2040}
              />
            </FieldRow>
            <Separator />
            <FieldRow label="Data urodzenia dziecka">
              <DateField
                value={childBirthDate}
                onChange={setChildBirthDate}
                modalTitle="Data urodzenia dziecka"
                placeholder="Wybierz datę"
                maxYear={2040}
              />
            </FieldRow>
            <Separator />
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
              <Text style={{ flex: 1, fontSize: 14, color: colors.ink.DEFAULT }}>Pierwsze dziecko</Text>
              <Switch
                value={firstChild}
                onValueChange={setFirstChild}
                trackColor={{ true: colors.evergreen.DEFAULT, false: colors.line.DEFAULT }}
                thumbColor={colors.cream.DEFAULT}
              />
            </View>
            {!firstChild && (
              <>
                <Separator />
                <FieldRow label="Ile masz dzieci (łącznie z tym)">
                  <TextInput
                    value={numberOfChildren}
                    onChangeText={setNumberOfChildren}
                    placeholder="np. 2"
                    placeholderTextColor={colors.ink.faint}
                    keyboardType="number-pad"
                    maxLength={2}
                    style={inputStyle}
                  />
                </FieldRow>
              </>
            )}
          </FieldBlock>

          {/* Lokalizacja */}
          <SectionLabel>Lokalizacja</SectionLabel>
          <FieldBlock>
            <FieldRow label="Miasto">
              <TextInput
                value={city}
                onChangeText={setCity}
                placeholder="np. Warszawa"
                placeholderTextColor={colors.ink.faint}
                style={inputStyle}
              />
            </FieldRow>
            <Separator />
            <Pressable
              onPress={() => setVoivodeshipOpen((v) => !v)}
              style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}
            >
              <Text style={{ flex: 1, fontSize: 14, color: colors.ink.DEFAULT }}>Województwo</Text>
              <Text style={{ fontSize: 14, color: colors.ink.soft, marginRight: 6 }}>{voivodeship}</Text>
              <Icon name={voivodeshipOpen ? 'chevronDown' : 'chevron'} size={14} color={colors.ink.faint} />
            </Pressable>
            {voivodeshipOpen && (
              <View style={{ borderTopWidth: 0.5, borderTopColor: colors.line.DEFAULT }}>
                {VOIVODESHIPS.map((v, i) => (
                  <Pressable
                    key={v}
                    onPress={() => { setVoivodeship(v); setVoivodeshipOpen(false); }}
                    style={{
                      flexDirection: 'row', alignItems: 'center',
                      paddingHorizontal: 16, paddingVertical: 12,
                      borderTopWidth: i === 0 ? 0 : 0.5,
                      borderTopColor: colors.line.DEFAULT,
                      backgroundColor: v === voivodeship ? `${colors.evergreen.DEFAULT}10` : 'transparent',
                    }}
                  >
                    <Text style={{ flex: 1, fontSize: 14, color: v === voivodeship ? colors.evergreen.DEFAULT : colors.ink.DEFAULT }}>
                      {v}
                    </Text>
                    {v === voivodeship && <Icon name="check" size={14} color={colors.evergreen.DEFAULT} strokeWidth={2} />}
                  </Pressable>
                ))}
              </View>
            )}
          </FieldBlock>

          {/* Forma zatrudnienia */}
          <SectionLabel>Forma zatrudnienia</SectionLabel>
          <View style={{ paddingHorizontal: 20, gap: 8 }}>
            {EMPLOYMENT_OPTIONS.map((opt) => {
              const active = employment === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => setEmployment(opt.value)}
                  style={{
                    flexDirection: 'row', alignItems: 'center',
                    paddingHorizontal: 16, paddingVertical: 13,
                    borderRadius: 14, borderWidth: 1,
                    backgroundColor: active ? `${colors.evergreen.DEFAULT}10` : colors.surface.DEFAULT,
                    borderColor: active ? colors.evergreen.DEFAULT : colors.line.DEFAULT,
                  }}
                >
                  <Text style={{
                    flex: 1, fontSize: 14,
                    fontFamily: active ? 'Geist_500Medium' : 'Geist_400Regular',
                    color: active ? colors.evergreen.DEFAULT : colors.ink.DEFAULT,
                  }}>
                    {opt.label}
                  </Text>
                  {active && <Icon name="check" size={16} color={colors.evergreen.DEFAULT} strokeWidth={2} />}
                </Pressable>
              );
            })}
          </View>

          {/* Finanse */}
          <SectionLabel>Finanse (do liczenia becikowego)</SectionLabel>
          <FieldBlock>
            <FieldRow label="Twoje zarobki netto / mies. (zł)">
              <TextInput
                value={monthlyNetIncomePln}
                onChangeText={setMonthlyNetIncomePln}
                placeholder="np. 4500"
                placeholderTextColor={colors.ink.faint}
                keyboardType="numeric"
                style={inputStyle}
              />
            </FieldRow>
            <Separator />
            <FieldRow label="Zarobki ojca netto / mies. (zł)">
              <TextInput
                value={partnerMonthlyNetIncomePln}
                onChangeText={setPartnerMonthlyNetIncomePln}
                placeholder="np. 5000"
                placeholderTextColor={colors.ink.faint}
                keyboardType="numeric"
                style={inputStyle}
              />
            </FieldRow>
            <Separator />
            <FieldRow label="Liczba osób w gosp. domowym">
              <TextInput
                value={householdSize}
                onChangeText={setHouseholdSize}
                placeholder="np. 3"
                placeholderTextColor={colors.ink.faint}
                keyboardType="number-pad"
                maxLength={2}
                style={inputStyle}
              />
            </FieldRow>
          </FieldBlock>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============ HELPERS ============

function SectionLabel({ children }: { children: string }) {
  return (
    <Text style={{
      fontSize: 11, fontFamily: 'Geist_500Medium',
      color: colors.ink.soft, textTransform: 'uppercase',
      letterSpacing: 0.8, paddingHorizontal: 20,
      marginTop: 24, marginBottom: 6,
    }}>
      {children}
    </Text>
  );
}

function FieldBlock({ children }: { children: React.ReactNode }) {
  return (
    <View style={{
      marginHorizontal: 20,
      backgroundColor: colors.surface.DEFAULT,
      borderWidth: 1, borderColor: colors.line.DEFAULT,
      borderRadius: 14, overflow: 'hidden',
    }}>
      {children}
    </View>
  );
}

function Separator() {
  return <View style={{ height: 0.5, backgroundColor: colors.line.DEFAULT, marginLeft: 16 }} />;
}

function FieldRow({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: boolean;
  children: React.ReactNode;
}) {
  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <Text style={{ fontSize: 12, color: colors.ink.soft }}>{label}</Text>
        {hint && (
          <Text style={{ fontSize: 11, color: error ? colors.terracotta.DEFAULT : colors.ink.faint }}>
            {hint}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}

const inputStyle = {
  fontSize: 14,
  fontFamily: 'Geist_400Regular',
  color: colors.ink.DEFAULT,
  padding: 0,
  margin: 0,
};
