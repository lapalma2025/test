/**
 * OnboardingScreen.tsx — 5-stopniowy wizard onboardingu.
 *
 * Krok 0: etap (przed/po porodzie) + data
 * Krok 1: pierwsze dziecko czy kolejne
 * Krok 2: forma zatrudnienia
 * Krok 3: lokalizacja (województwo, miasto)
 * Krok 4: partner
 * Krok 5: podsumowanie + projekcja
 *
 * Po ukończeniu: completeOnboarding() → router nawiguje na (tabs)/trasa.
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Button, Progress, Icon, Field, type IconName } from '@/components/ui';
import { useProfileStore } from '@/stores/profile';
import { checkEligibility, calculateTotalYearOneProjection, type EmploymentType } from '@/engine/eligibility-engine';
import benefitsData from '@/data/benefits.json';
import { colors } from '@/theme/tokens';

const VOIVODESHIPS = [
  'dolnośląskie', 'kujawsko-pomorskie', 'lubelskie', 'lubuskie',
  'łódzkie', 'małopolskie', 'mazowieckie', 'opolskie',
  'podkarpackie', 'podlaskie', 'pomorskie', 'śląskie',
  'świętokrzyskie', 'warmińsko-mazurskie', 'wielkopolskie', 'zachodniopomorskie',
] as const;

const TOTAL_STEPS = 5;

// ============ OPTION CARD (wybór typu radio) ============

interface OptionProps {
  title: string;
  note?: string;
  icon?: IconName;
  active: boolean;
  onPress: () => void;
}

function Option({ title, note, icon, active, onPress }: OptionProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3 p-4 rounded-card border ${
        active ? 'border-evergreen bg-sage-soft/40' : 'border-line bg-surface'
      } active:opacity-80`}
    >
      {icon && (
        <View
          className={`items-center justify-center rounded-card ${
            active ? 'bg-evergreen' : 'bg-cream'
          }`}
          style={{ width: 40, height: 40 }}
        >
          <Icon
            name={icon}
            size={20}
            color={active ? colors.cream.DEFAULT : colors.ink.DEFAULT}
          />
        </View>
      )}
      <View className="flex-1">
        <Text className="text-ink font-sans-medium text-[15px]">{title}</Text>
        {note && <Text className="text-ink-soft text-[13px] mt-0.5">{note}</Text>}
      </View>
      <View
        className={`items-center justify-center rounded-full border-2 ${
          active ? 'bg-evergreen border-evergreen' : 'bg-cream border-line-strong'
        }`}
        style={{ width: 22, height: 22 }}
      >
        {active && <Icon name="check" size={14} color={colors.cream.DEFAULT} strokeWidth={2.6} />}
      </View>
    </Pressable>
  );
}

// ============ EKRAN GŁÓWNY ============

export default function OnboardingScreen() {
  const router = useRouter();
  const profile = useProfileStore();
  const [step, setStep] = useState(0);

  // Lokalny stan, commit do storu na koniec lub przy zmianie kroku
  const [stage, setStage] = useState<'preg' | 'born'>(profile.childBirthDate ? 'born' : 'preg');
  const [dateInput, setDateInput] = useState<string>(
    profile.childBirthDate ?? profile.childDueDate ?? ''
  );
  const [firstChild, setFirstChild] = useState<boolean>(profile.firstChild);
  const [employment, setEmployment] = useState<EmploymentType>(profile.employment);
  const [voivodeship, setVoivodeship] = useState<string>(profile.voivodeship);
  const [city, setCity] = useState<string>(profile.city);
  const [parentName, setParentName] = useState<string>(profile.parentName);
  const [childName, setChildName] = useState<string>(profile.childName);
  const [partnerIncluded, setPartnerIncluded] = useState<boolean>(profile.partnerIncluded);
  const [partnerName, setPartnerName] = useState<string>(profile.partnerName ?? '');

  const next = () => {
    if (step < TOTAL_STEPS) {
      // Commit aktualnego kroku przed przejściem
      commitStep();
      setStep(step + 1);
    } else {
      // Ostatni krok: ukończenie
      commitFinal();
      profile.completeOnboarding();
      router.replace('/(tabs)/trasa');
    }
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  const commitStep = () => {
    profile.setMany({
      childBirthDate: stage === 'born' ? dateInput || null : null,
      childDueDate: stage === 'preg' ? dateInput || null : null,
      firstChild,
      employment,
      voivodeship,
      city,
      parentName,
      childName,
      partnerIncluded,
      partnerName: partnerIncluded ? partnerName : null,
    });
  };

  const commitFinal = () => {
    commitStep();
  };

  // Walidacja czy można iść dalej
  const canProceed = (): boolean => {
    switch (step) {
      case 0: return dateInput.length > 0;
      case 1: return true;
      case 2: return true;
      case 3: return voivodeship.length > 0 && city.length > 0;
      case 4: return !partnerIncluded || partnerName.length > 0;
      default: return true;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
      {/* Header z progress barem */}
      <View className="flex-row items-center gap-3 px-4 py-3">
        <Pressable
          onPress={back}
          className="w-10 h-10 items-center justify-center rounded-full"
          disabled={step === 0}
        >
          {step > 0 && <Icon name="back" size={20} color={colors.ink.DEFAULT} />}
        </Pressable>
        <View className="flex-1">
          <Progress value={step + 1} max={TOTAL_STEPS + 1} />
        </View>
        <Text className="font-mono text-[12px] text-ink-faint">
          {step < TOTAL_STEPS ? `${step + 1}/${TOTAL_STEPS}` : '✓'}
        </Text>
      </View>

      <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingBottom: 20 }}>
        {step === 0 && (
          <StepStage
            stage={stage}
            setStage={setStage}
            dateInput={dateInput}
            setDateInput={setDateInput}
            childName={childName}
            setChildName={setChildName}
          />
        )}
        {step === 1 && <StepParity firstChild={firstChild} setFirstChild={setFirstChild} />}
        {step === 2 && <StepEmployment employment={employment} setEmployment={setEmployment} />}
        {step === 3 && (
          <StepLocation
            voivodeship={voivodeship}
            setVoivodeship={setVoivodeship}
            city={city}
            setCity={setCity}
            parentName={parentName}
            setParentName={setParentName}
          />
        )}
        {step === 4 && (
          <StepPartner
            partnerIncluded={partnerIncluded}
            setPartnerIncluded={setPartnerIncluded}
            partnerName={partnerName}
            setPartnerName={setPartnerName}
          />
        )}
        {step === 5 && <StepSummary />}
      </ScrollView>

      <View className="px-5 py-4 border-t border-line">
        <Button
          variant="primary"
          full
          iconRight={step < TOTAL_STEPS ? 'arrow' : 'check'}
          disabled={!canProceed()}
          onPress={next}
        >
          {step < TOTAL_STEPS ? 'Dalej' : 'Zobacz trasę'}
        </Button>
      </View>
    </SafeAreaView>
  );
}

// ============ POSZCZEGÓLNE KROKI ============

interface StepStageProps {
  stage: 'preg' | 'born';
  setStage: (s: 'preg' | 'born') => void;
  dateInput: string;
  setDateInput: (v: string) => void;
  childName: string;
  setChildName: (v: string) => void;
}

function StepStage({ stage, setStage, dateInput, setDateInput, childName, setChildName }: StepStageProps) {
  return (
    <View className="gap-4 py-4">
      <Text className="font-serif text-[28px] text-ink leading-tight">
        Na jakim etapie jesteś?
      </Text>
      <Text className="text-ink-soft text-[15px]">
        Ułożymy oś czasu z konkretnymi datami.
      </Text>

      <View className="gap-2.5 mt-2">
        <Option
          icon="heart"
          title="Jestem w ciąży"
          note="podasz tydzień lub planowaną datę porodu"
          active={stage === 'preg'}
          onPress={() => setStage('preg')}
        />
        <Option
          icon="sparkle"
          title="Dziecko już się urodziło"
          note="podasz datę urodzenia"
          active={stage === 'born'}
          onPress={() => setStage('born')}
        />
      </View>

      <Field label={stage === 'born' ? 'Data urodzenia (YYYY-MM-DD)' : 'Planowana data porodu (YYYY-MM-DD)'}>
        <TextInput
          value={dateInput}
          onChangeText={setDateInput}
          placeholder="2026-05-26"
          className="bg-surface border border-line rounded-card px-4 py-3.5 text-[15px] text-ink"
          placeholderTextColor={colors.ink.faint}
        />
      </Field>

      {stage === 'born' && (
        <Field label="Imię dziecka (opcjonalnie)">
          <TextInput
            value={childName}
            onChangeText={setChildName}
            placeholder="np. Maja"
            className="bg-surface border border-line rounded-card px-4 py-3.5 text-[15px] text-ink"
            placeholderTextColor={colors.ink.faint}
          />
        </Field>
      )}
    </View>
  );
}

function StepParity({ firstChild, setFirstChild }: { firstChild: boolean; setFirstChild: (v: boolean) => void }) {
  return (
    <View className="gap-4 py-4">
      <Text className="font-serif text-[28px] text-ink leading-tight">
        To pierwsze dziecko?
      </Text>
      <Text className="text-ink-soft text-[15px]">
        Dopasujemy podpowiedzi. Drugie/kolejne dziecko ma dodatkowo RKO (12 000 zł).
      </Text>
      <View className="gap-2.5 mt-2">
        <Option
          title="Tak, pierwsze"
          note="pokażemy wszystko krok po kroku"
          active={firstChild}
          onPress={() => setFirstChild(true)}
        />
        <Option
          title="Kolejne dziecko"
          note="pominiemy podstawy, dodamy RKO"
          active={!firstChild}
          onPress={() => setFirstChild(false)}
        />
      </View>
    </View>
  );
}

const EMPLOYMENT_OPTIONS: Array<{ id: EmploymentType; title: string; note: string }> = [
  { id: 'uop', title: 'Umowa o pracę', note: 'zasiłek macierzyński z ZUS' },
  { id: 'b2b_chorobowe', title: 'B2B z chorobowym', note: 'zasiłek macierzyński przysługuje' },
  { id: 'b2b_no_chorobowe', title: 'B2B bez chorobowego', note: 'kosiniakowe (1000 zł/mies × 12 mies)' },
  { id: 'zlecenie_chorobowe', title: 'Zlecenie z chorobowym', note: 'zasiłek macierzyński przysługuje' },
  { id: 'zlecenie_no_chorobowe', title: 'Zlecenie bez chorobowego', note: 'kosiniakowe' },
  { id: 'student', title: 'Student / uczeń', note: 'kosiniakowe' },
  { id: 'none', title: 'Bez pracy', note: 'kosiniakowe' },
];

function StepEmployment({ employment, setEmployment }: { employment: EmploymentType; setEmployment: (e: EmploymentType) => void }) {
  return (
    <View className="gap-4 py-4">
      <Text className="font-serif text-[28px] text-ink leading-tight">
        Twoja forma zatrudnienia?
      </Text>
      <Text className="text-ink-soft text-[15px]">
        Od tego zależy zasiłek macierzyński albo kosiniakowe.
      </Text>
      <View className="gap-2.5 mt-2">
        {EMPLOYMENT_OPTIONS.map((opt) => (
          <Option
            key={opt.id}
            title={opt.title}
            note={opt.note}
            active={employment === opt.id}
            onPress={() => setEmployment(opt.id)}
          />
        ))}
      </View>
    </View>
  );
}

function StepLocation({
  voivodeship, setVoivodeship, city, setCity, parentName, setParentName,
}: {
  voivodeship: string; setVoivodeship: (v: string) => void;
  city: string; setCity: (v: string) => void;
  parentName: string; setParentName: (v: string) => void;
}) {
  return (
    <View className="gap-4 py-4">
      <Text className="font-serif text-[28px] text-ink leading-tight">
        Gdzie mieszkasz?
      </Text>
      <Text className="text-ink-soft text-[15px]">
        Pokażemy szkoły rodzenia i szpitale w okolicy.
      </Text>

      <Field label="Imię (jak masz na imię)">
        <TextInput
          value={parentName}
          onChangeText={setParentName}
          placeholder="np. Anna"
          className="bg-surface border border-line rounded-card px-4 py-3.5 text-[15px] text-ink"
          placeholderTextColor={colors.ink.faint}
        />
      </Field>

      <Field label="Województwo">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {VOIVODESHIPS.map((v) => (
            <Pressable
              key={v}
              onPress={() => setVoivodeship(v)}
              className={`px-3.5 py-2.5 rounded-full ${
                voivodeship === v ? 'bg-evergreen' : 'bg-surface border border-line'
              }`}
            >
              <Text className={`text-[13px] font-sans-medium ${voivodeship === v ? 'text-cream' : 'text-ink'}`}>
                {v}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </Field>

      <Field label="Miasto">
        <TextInput
          value={city}
          onChangeText={setCity}
          placeholder="np. Wrocław"
          className="bg-surface border border-line rounded-card px-4 py-3.5 text-[15px] text-ink"
          placeholderTextColor={colors.ink.faint}
        />
      </Field>
    </View>
  );
}

function StepPartner({
  partnerIncluded, setPartnerIncluded, partnerName, setPartnerName,
}: {
  partnerIncluded: boolean; setPartnerIncluded: (v: boolean) => void;
  partnerName: string; setPartnerName: (v: string) => void;
}) {
  return (
    <View className="gap-4 py-4">
      <Text className="font-serif text-[28px] text-ink leading-tight">
        Uwzględnić partnera?
      </Text>
      <Text className="text-ink-soft text-[15px]">
        Część urlopów (9 tygodni ojcowskie nieprzenoszalne) i Aktywni Rodzice w pracy wymagają obojga.
      </Text>
      <View className="gap-2.5 mt-2">
        <Option
          icon="user"
          title="Tak, jest ze mną partner"
          note="dodamy jego urlopy i dokumenty"
          active={partnerIncluded}
          onPress={() => setPartnerIncluded(true)}
        />
        <Option
          title="Nie teraz"
          note="możesz dodać później w profilu"
          active={!partnerIncluded}
          onPress={() => setPartnerIncluded(false)}
        />
      </View>
      {partnerIncluded && (
        <Field label="Imię partnera">
          <TextInput
            value={partnerName}
            onChangeText={setPartnerName}
            placeholder="np. Marek"
            className="bg-surface border border-line rounded-card px-4 py-3.5 text-[15px] text-ink"
            placeholderTextColor={colors.ink.faint}
          />
        </Field>
      )}
    </View>
  );
}

function StepSummary() {
  const profile = useProfileStore();
  const userProfile = profile.toUserProfile();
  // @ts-ignore - JSON import shape
  const results = checkEligibility(userProfile, benefitsData, new Date());
  const total = calculateTotalYearOneProjection(results);

  return (
    <View className="gap-5 py-4 items-center">
      <View className="w-16 h-16 bg-sage-soft rounded-full items-center justify-center">
        <Icon name="sparkle" size={32} color={colors.evergreen.DEFAULT} />
      </View>
      <Text className="font-serif text-[28px] text-ink leading-tight text-center">
        Gotowe{profile.parentName ? `, ${profile.parentName}` : ''}.
      </Text>
      <Text className="text-ink-soft text-[15px] text-center">
        Ułożyliśmy Twoją trasę. Zaczynamy od najpilniejszego.
      </Text>

      <View className="w-full bg-surface border border-line rounded-card p-4 gap-3">
        <SumRow k="Etap" v={profile.childBirthDate ? `Po porodzie` : 'W ciąży'} />
        <SumRow k="Zatrudnienie" v={getEmploymentLabel(profile.employment)} />
        <SumRow k="Miejsce" v={`${profile.city || '—'}, ${profile.voivodeship}`} />
        <View className="h-px bg-line my-1" />
        <SumRow
          k="Należy Ci się"
          v={total > 0 ? new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(total) : '—'}
          highlight
        />
      </View>
    </View>
  );
}

function SumRow({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <View className="flex-row justify-between items-baseline">
      <Text className="text-ink-soft text-[13px]">{k}</Text>
      <Text className={`${highlight ? 'font-serif text-[22px] text-evergreen' : 'text-[15px] text-ink font-sans-medium'}`}>
        {v}
      </Text>
    </View>
  );
}

function getEmploymentLabel(e: EmploymentType): string {
  return EMPLOYMENT_OPTIONS.find((o) => o.id === e)?.title ?? e;
}
