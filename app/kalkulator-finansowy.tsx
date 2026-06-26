/**
 * app/kalkulator-finansowy.tsx
 * Kalkulator zasiłków urlopowych. Kwoty zasiłków są BRUTTO (przed zaliczką PIT ~12%).
 * 800+ i becikowe są wolne od podatku.
 */

import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, TextInput, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Icon } from '@/components/ui';
import { colors } from '@/theme/tokens';

// ─── stałe ─────────────────────────────────────────────────────────────────

const ZUS_EMPLOYEE = 0.1371; // 9,76% emerytura + 1,5% renta + 2,45% chorobowe
const DAYS_PER_MONTH = 30;
const MIN_WAGE_2025 = 4_666;  // minimalne wynagrodzenie 2025

type Variant = 'v815' | 'std';

// ─── helpers ───────────────────────────────────────────────────────────────

function base(brutto: number): number {
  return brutto * (1 - ZUS_EMPLOYEE);
}

/** Kwota za N tygodni: ZUS liczy miesiąc = 30 dni, tydzień = 7 dni */
function weeksAmount(monthlyBase: number, weeks: number, rate: number): number {
  return (monthlyBase / DAYS_PER_MONTH) * 7 * weeks * rate;
}

function pln(n: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency', currency: 'PLN', maximumFractionDigits: 0,
  }).format(Math.round(n));
}

function calcAll(
  motherBrutto: number,
  fatherBrutto: number,
  withFather: boolean,
  variant: Variant,
) {
  const mBase = base(motherBrutto);
  const fBase = base(fatherBrutto);

  // matka: macierzyński 20 tyg. + rodzicielski 32 tyg.
  let mMacierzynski: number;
  let mParental: number;
  if (variant === 'v815') {
    // wniosek złożony w 21 dni od porodu → cały urlop @ 81,5%
    mMacierzynski = weeksAmount(mBase, 20, 0.815);
    mParental     = weeksAmount(mBase, 32, 0.815);
  } else {
    mMacierzynski = weeksAmount(mBase, 20, 1.0);
    mParental     = weeksAmount(mBase, 32, 0.70);
  }
  const mTotal = mMacierzynski + mParental;

  // ojciec: ojcowski 2 tyg. @ 100% + rodzicielski (nieprzenoszalne) 9 tyg. @ 70%
  const fPaternity = withFather ? weeksAmount(fBase, 2,  1.0)  : 0;
  const fParental  = withFather ? weeksAmount(fBase, 9,  0.70) : 0;
  const fTotal     = fPaternity + fParental;

  const s800plus = 800 * 12; // pierwszy rok

  return {
    mMacierzynski, mParental, mTotal,
    fPaternity, fParental, fTotal,
    s800plus,
    total: mTotal + fTotal + s800plus,
  };
}

// ─── style ─────────────────────────────────────────────────────────────────

const c = colors;

const BACK_BTN = {
  width: 40, height: 40, borderRadius: 12,
  borderWidth: 0.5, borderColor: c.line.DEFAULT,
  backgroundColor: c.surface.DEFAULT,
  alignItems: 'center' as const, justifyContent: 'center' as const,
};

// ─── główny ekran ──────────────────────────────────────────────────────────

export default function KalkulatorFinansowyScreen() {
  const router = useRouter();

  const [motherInput, setMotherInput] = useState('');
  const [fatherInput, setFatherInput] = useState('');
  const [withFather, setWithFather]   = useState(false);
  const [variant, setVariant]         = useState<Variant>('v815');
  const [result, setResult]           = useState<ReturnType<typeof calcAll> | null>(null);

  const mBrutto = parseFloat(motherInput.replace(',', '.').replace(/\s/g, ''));
  const fBrutto = parseFloat(fatherInput.replace(',', '.').replace(/\s/g, ''));
  const canCalc = !isNaN(mBrutto) && mBrutto > 0;
  const lowSalary = canCalc && mBrutto < MIN_WAGE_2025;

  const calculate = () => {
    if (!canCalc) return;
    const fVal = withFather && !isNaN(fBrutto) && fBrutto > 0 ? fBrutto : 0;
    setResult(calcAll(mBrutto, fVal, withFather, variant));
  };

  // przelicz po zmianie wariantu jeśli już jest wynik
  const changeVariant = (v: Variant) => {
    setVariant(v);
    if (result && canCalc) {
      const fVal = withFather && !isNaN(fBrutto) && fBrutto > 0 ? fBrutto : 0;
      setResult(calcAll(mBrutto, fVal, withFather, v));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.cream.DEFAULT }}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* TopBar */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 8,
          paddingHorizontal: 18, paddingVertical: 14,
        }}>
          <Pressable onPress={() => router.back()} style={BACK_BTN}>
            <Icon name="back" size={20} color={c.ink.DEFAULT} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: c.ink.DEFAULT }}>
              Kalkulator urlopowy
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Lead */}
          <Text style={{
            fontFamily: 'Newsreader_400Regular', fontSize: 24,
            color: c.ink.DEFAULT, lineHeight: 32, marginTop: 4, marginBottom: 8,
          }}>
            Ile dostaniesz{'\n'}na urlopach?
          </Text>
          <Text style={{ fontSize: 13, color: c.ink.soft, lineHeight: 19, marginBottom: 24 }}>
            Wpisz zarobki brutto. Kwoty zasiłków to wartości{' '}
            <Text style={{ fontFamily: 'Geist_500Medium', color: c.ink.DEFAULT }}>brutto przed PIT</Text>
            {' '}(~12% zaliczka). 800+ jest wolne od podatku.
          </Text>

          {/* Wariant */}
          <VariantTabs value={variant} onChange={changeVariant} />

          {/* Matka */}
          <SalaryInput
            label="Zarobki matki"
            sublabel="brutto miesięcznie"
            value={motherInput}
            onChange={(v) => { setMotherInput(v); setResult(null); }}
          />

          {lowSalary && (
            <View style={{
              flexDirection: 'row', gap: 8, alignItems: 'flex-start',
              backgroundColor: '#FFF8E6', borderRadius: 12, padding: 12, marginBottom: 10,
            }}>
              <Icon name="info" size={14} color={c.ink.soft} />
              <Text style={{ flex: 1, fontSize: 12, color: c.ink.soft, lineHeight: 17 }}>
                Dla UoP: minimalna podstawa zasiłku = {pln(base(MIN_WAGE_2025))} / mies.
                (płaca minimalna {pln(MIN_WAGE_2025)} × 86,29%). Twój zasiłek może być wyższy niż tu pokazany.
              </Text>
            </View>
          )}

          {/* Ojciec toggle */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: c.surface.DEFAULT, borderWidth: 0.5, borderColor: c.line.DEFAULT,
            borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, marginBottom: 12,
          }}>
            <View>
              <Text style={{ fontSize: 14, fontFamily: 'Geist_500Medium', color: c.ink.DEFAULT }}>
                Uwzględnij ojca
              </Text>
              <Text style={{ fontSize: 12, color: c.ink.soft, marginTop: 2 }}>
                ojcowski 2 tyg. + rodzicielski 9 tyg.
              </Text>
            </View>
            <Switch
              value={withFather}
              onValueChange={(v) => { setWithFather(v); setResult(null); }}
              trackColor={{ true: c.evergreen.DEFAULT, false: c.line.DEFAULT }}
              thumbColor={c.cream.DEFAULT}
            />
          </View>

          {withFather && (
            <SalaryInput
              label="Zarobki ojca"
              sublabel="brutto miesięcznie"
              value={fatherInput}
              onChange={(v) => { setFatherInput(v); setResult(null); }}
            />
          )}

          {/* Przycisk */}
          <Pressable
            onPress={calculate}
            disabled={!canCalc}
            style={{
              backgroundColor: canCalc ? c.evergreen.DEFAULT : c.line.DEFAULT,
              borderRadius: 14, paddingVertical: 16,
              alignItems: 'center', marginTop: 4,
            }}
          >
            <Text style={{
              fontSize: 16, fontFamily: 'Geist_500Medium',
              color: canCalc ? c.cream.DEFAULT : c.ink.faint,
            }}>
              Oblicz zasiłki
            </Text>
          </Pressable>

          {result && (
            <Results r={result} withFather={withFather} variant={variant} />
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─── VariantTabs ───────────────────────────────────────────────────────────

function VariantTabs({ value, onChange }: { value: Variant; onChange: (v: Variant) => void }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{
        fontSize: 11, color: c.ink.faint, textTransform: 'uppercase',
        letterSpacing: 0.6, fontFamily: 'Geist_500Medium', marginBottom: 8,
      }}>
        Wariant urlopu
      </Text>
      <View style={{
        flexDirection: 'row', backgroundColor: c.surface.DEFAULT,
        borderWidth: 0.5, borderColor: c.line.DEFAULT,
        borderRadius: 14, padding: 4,
      }}>
        {([
          { id: 'v815' as Variant, label: '81,5%', sub: 'wniosek w 21 dni' },
          { id: 'std'  as Variant, label: '100%/70%', sub: 'standardowy' },
        ] as const).map((opt) => (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            style={{
              flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 11,
              backgroundColor: value === opt.id ? c.evergreen.DEFAULT : 'transparent',
            }}
          >
            <Text style={{
              fontSize: 13, fontFamily: 'Geist_500Medium',
              color: value === opt.id ? c.cream.DEFAULT : c.ink.DEFAULT,
            }}>
              {opt.label}
            </Text>
            <Text style={{
              fontSize: 11,
              color: value === opt.id ? 'rgba(255,255,255,0.65)' : c.ink.faint,
              marginTop: 1,
            }}>
              {opt.sub}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ─── SalaryInput ───────────────────────────────────────────────────────────

function SalaryInput({
  label, sublabel, value, onChange,
}: { label: string; sublabel: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{
        fontSize: 11, color: c.ink.faint, textTransform: 'uppercase',
        letterSpacing: 0.6, fontFamily: 'Geist_500Medium', marginBottom: 6,
      }}>
        {label}{' '}
        <Text style={{ textTransform: 'none', letterSpacing: 0 }}>({sublabel})</Text>
      </Text>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: c.surface.DEFAULT,
        borderWidth: 0.5, borderColor: c.line.DEFAULT,
        borderRadius: 13, paddingHorizontal: 16, overflow: 'hidden',
      }}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="np. 6 000"
          placeholderTextColor={c.ink.faint}
          keyboardType="number-pad"
          style={{
            flex: 1, paddingVertical: 15, fontSize: 20,
            color: c.ink.DEFAULT, fontFamily: 'GeistMono_400Regular',
          }}
        />
        <Text style={{ fontSize: 14, color: c.ink.soft, fontFamily: 'Geist_500Medium' }}>zł</Text>
      </View>
    </View>
  );
}

// ─── Results ───────────────────────────────────────────────────────────────

function Results({
  r, withFather, variant,
}: { r: ReturnType<typeof calcAll>; withFather: boolean; variant: Variant }) {
  const mRate1 = variant === 'v815' ? '81,5%' : '100%';
  const mRate2 = variant === 'v815' ? '81,5%' : '70%';

  return (
    <View style={{ marginTop: 28, gap: 12 }}>
      {/* Ostrzeżenie 21 dni */}
      {variant === 'v815' && (
        <View style={{
          flexDirection: 'row', gap: 10, alignItems: 'flex-start',
          backgroundColor: '#FFF0E0', borderRadius: 14, padding: 14,
          borderWidth: 0.5, borderColor: '#E8A75A',
        }}>
          <Icon name="clock" size={16} color="#C07030" />
          <Text style={{ flex: 1, fontSize: 13, color: '#7A4010', lineHeight: 19 }}>
            <Text style={{ fontFamily: 'Geist_500Medium' }}>Deadline: 21 dni od porodu.</Text>
            {' '}Wniosek o urlop rodzicielski złożony w tym terminie aktywuje stawkę 81,5% przez cały urlop.
          </Text>
        </View>
      )}

      {/* Hero total */}
      <View style={{ backgroundColor: c.evergreen.DEFAULT, borderRadius: 20, padding: 22 }}>
        <Text style={{
          fontSize: 11, color: 'rgba(255,255,255,0.6)',
          textTransform: 'uppercase', letterSpacing: 0.8,
          fontFamily: 'Geist_500Medium', marginBottom: 6,
        }}>
          Szacunkowe zasiłki łącznie
        </Text>
        <Text style={{
          fontFamily: 'Newsreader_400Regular', fontSize: 40,
          color: c.cream.DEFAULT, lineHeight: 44,
        }}>
          {pln(r.total)}
        </Text>
        <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>
          urlopy (brutto przed PIT) + 800+ przez 12 miesięcy
        </Text>
      </View>

      {/* Matka */}
      <SectionCard title="Matka — zasiłki z ZUS" badge="BRUTTO przed PIT">
        <CalcRow label={`Macierzyński (20 tyg. @ ${mRate1})`} value={pln(r.mMacierzynski)} />
        <CalcRow label={`Rodzicielski (32 tyg. @ ${mRate2})`}  value={pln(r.mParental)} />
        <Divider />
        <CalcRow label="Łącznie matka" value={pln(r.mTotal)} bold />
      </SectionCard>

      {/* Ojciec */}
      {withFather && r.fTotal > 0 && (
        <SectionCard title="Ojciec — zasiłki z ZUS" badge="BRUTTO przed PIT">
          <CalcRow label="Ojcowski (2 tyg. @ 100%)"              value={pln(r.fPaternity)} />
          <CalcRow label="Rodzicielski nieprzenoszalny (9 tyg. @ 70%)" value={pln(r.fParental)} />
          <Divider />
          <CalcRow label="Łącznie ojciec" value={pln(r.fTotal)} bold />
        </SectionCard>
      )}

      {/* Stałe — wolne od PIT */}
      <SectionCard title="Świadczenia stałe" badge="WOLNE OD PIT">
        <CalcRow label="800+ (12 miesięcy, pierwszy rok)" value={pln(r.s800plus)} />
      </SectionCard>

      {/* Łącznie */}
      <View style={{
        backgroundColor: c.surface.DEFAULT,
        borderWidth: 0.5, borderColor: c.line.DEFAULT,
        borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Text style={{ fontSize: 14, fontFamily: 'Geist_500Medium', color: c.ink.DEFAULT }}>
            ŁĄCZNIE
          </Text>
          <Text style={{
            fontSize: 22, fontFamily: 'Newsreader_400Regular', color: c.evergreen.DEFAULT,
          }}>
            {pln(r.total)}
          </Text>
        </View>
      </View>

      {/* Noty */}
      <View style={{
        flexDirection: 'row', gap: 10, alignItems: 'flex-start',
        backgroundColor: c.sage.soft, borderRadius: 14, padding: 14,
      }}>
        <Icon name="info" size={16} color={c.evergreen.DEFAULT} />
        <Text style={{ flex: 1, fontSize: 12, color: c.ink.soft, lineHeight: 18 }}>
          <Text style={{ fontFamily: 'Geist_500Medium' }}>Założenia:</Text>
          {' '}matka korzysta z max 32 tyg. rodzicielskiego; ojciec z 9 tyg. nieprzenoszalnych. Przy innym podziale kwoty się zmienią.{'\n\n'}
          <Text style={{ fontFamily: 'Geist_500Medium' }}>Zasiłki są brutto</Text>
          {' '}— ZUS pobiera zaliczkę PIT ~12% (wyjątek: ulga 4+, na powrót, senior — wtedy PIT = 0).{'\n\n'}
          <Text style={{ fontFamily: 'Geist_500Medium' }}>800+</Text>
          {' '}trwa do 18. r.ż. — pokazuję tylko 1. rok. Obliczenie bazuje na stałych zarobkach; rzeczywisty zasiłek to średnia z 12 mies.
        </Text>
      </View>
    </View>
  );
}

function SectionCard({
  title, badge, children,
}: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <View style={{
      backgroundColor: c.surface.DEFAULT,
      borderWidth: 0.5, borderColor: c.line.DEFAULT,
      borderRadius: 16, padding: 16, gap: 10,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        <Text style={{
          fontSize: 11, color: c.ink.faint, textTransform: 'uppercase',
          letterSpacing: 0.6, fontFamily: 'Geist_500Medium', flex: 1,
        }}>
          {title}
        </Text>
        {badge && (
          <View style={{
            backgroundColor: badge.includes('WOLNE') ? c.sage.soft : '#FFF0E0',
            borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
          }}>
            <Text style={{
              fontSize: 9, letterSpacing: 0.4, fontFamily: 'Geist_500Medium',
              color: badge.includes('WOLNE') ? c.evergreen.DEFAULT : '#C07030',
            }}>
              {badge}
            </Text>
          </View>
        )}
      </View>
      {children}
    </View>
  );
}

function CalcRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <Text style={{
        flex: 1, fontSize: 13, color: bold ? c.ink.DEFAULT : c.ink.soft,
        fontFamily: bold ? 'Geist_500Medium' : 'Geist_400Regular', paddingRight: 8,
      }}>
        {label}
      </Text>
      <Text style={{
        fontSize: bold ? 16 : 14,
        color: bold ? c.evergreen.DEFAULT : c.ink.DEFAULT,
        fontFamily: bold ? 'Geist_600SemiBold' : 'GeistMono_400Regular',
      }}>
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  return <View style={{ height: 0.5, backgroundColor: c.line.DEFAULT }} />;
}
