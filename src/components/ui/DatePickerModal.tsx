import React, { useEffect, useRef, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Modal, Platform,
  Pressable, Text, TextInput, View,
} from 'react-native';

import { colors } from '@/theme/tokens';
import { Icon } from './Icon';

// ── helpers ─────────────────────────────────────────────────────────────────

function todayParts(): { day: string; month: string; year: string } {
  const d = new Date();
  return {
    day:   String(d.getDate()).padStart(2, '0'),
    month: String(d.getMonth() + 1).padStart(2, '0'),
    year:  String(d.getFullYear()),
  };
}

function todayDisplay(): string {
  const { day, month, year } = todayParts();
  return `${day}.${month}.${year}`;
}

/** "DD", "MM", "YYYY" → "YYYY-MM-DD" */
function partsToISO(d: string, m: string, y: string): string {
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

// ── DatePickerModal ──────────────────────────────────────────────────────────

export interface DatePickerModalProps {
  visible: boolean;
  title?: string;
  subtitle?: string;
  /** Already-selected date as YYYY-MM-DD (pre-fills "Inna data" fields) */
  initialISO?: string;
  onConfirm: (isoDate: string) => void;
  onClose: () => void;
  minYear?: number;
  maxYear?: number;
}

export function DatePickerModal({
  visible,
  title = 'Wybierz datę',
  subtitle,
  initialISO,
  onConfirm,
  onClose,
  minYear = 2015,
  maxYear = 2040,
}: DatePickerModalProps) {
  const [useToday, setUseToday] = useState(true);
  const [day,   setDay]   = useState('');
  const [month, setMonth] = useState('');
  const [year,  setYear]  = useState('');

  const monthRef = useRef<TextInput>(null);
  const yearRef  = useRef<TextInput>(null);

  useEffect(() => {
    if (!visible) return;
    if (initialISO && initialISO.length === 10) {
      const [y, m, d] = initialISO.split('-');
      setDay(d ?? '');
      setMonth(m ?? '');
      setYear(y ?? '');
      setUseToday(false);
    } else {
      setDay('');
      setMonth('');
      setYear('');
      setUseToday(true);
    }
  }, [visible]);

  const today = todayDisplay();

  function handleConfirm() {
    if (useToday) {
      const { day: d, month: m, year: y } = todayParts();
      onConfirm(partsToISO(d, m, y));
      return;
    }
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (
      !day || !month || !year || year.length < 4 ||
      d < 1 || d > 31 || m < 1 || m > 12 || y < minYear || y > maxYear
    ) {
      Alert.alert('Niepoprawna data', `Sprawdź wpisaną datę (DD.MM.RRRR).\nRok powinien być między ${minYear} a ${maxYear}.`);
      return;
    }
    onConfirm(partsToISO(
      String(d).padStart(2, '0'),
      String(m).padStart(2, '0'),
      String(y),
    ));
  }

  function handleDayChange(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 2);
    setDay(digits);
    if (digits.length === 2) monthRef.current?.focus();
  }

  function handleMonthChange(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 2);
    setMonth(digits);
    if (digits.length === 2) yearRef.current?.focus();
  }

  function handleYearChange(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    setYear(digits);
  }

  const inputBox = {
    textAlign: 'center' as const,
    fontSize: 20,
    fontFamily: 'Geist_500Medium',
    color: colors.ink.DEFAULT,
    backgroundColor: colors.cream.DEFAULT,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line.DEFAULT,
    paddingVertical: 10,
  };

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
            {/* Handle */}
            <View style={{
              width: 36, height: 4, borderRadius: 2,
              backgroundColor: colors.line.DEFAULT,
              alignSelf: 'center', marginBottom: 20,
            }} />

            <Text style={{ fontSize: 16, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT, marginBottom: subtitle ? 4 : 20 }}>
              {title}
            </Text>
            {subtitle && (
              <Text style={{ fontSize: 13, color: colors.ink.soft, marginBottom: 20 }} numberOfLines={2}>
                {subtitle}
              </Text>
            )}

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
              <RadioDot active={useToday} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>Dziś</Text>
                <Text style={{ fontSize: 13, color: colors.ink.soft, marginTop: 1 }}>{today}</Text>
              </View>
            </Pressable>

            {/* Opcja: Inna data */}
            <Pressable
              onPress={() => setUseToday(false)}
              style={{
                padding: 14, borderRadius: 14, borderWidth: 1.5,
                borderColor: !useToday ? colors.evergreen.DEFAULT : colors.line.DEFAULT,
                backgroundColor: !useToday ? `${colors.evergreen.DEFAULT}0D` : colors.surface.DEFAULT,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: !useToday ? 14 : 0 }}>
                <RadioDot active={!useToday} />
                <Text style={{ fontSize: 14, fontFamily: 'Geist_500Medium', color: colors.ink.DEFAULT }}>
                  Inna data
                </Text>
              </View>

              {!useToday && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <TextInput
                    value={day}
                    onChangeText={handleDayChange}
                    placeholder="DD"
                    placeholderTextColor={colors.ink.faint}
                    keyboardType="number-pad"
                    maxLength={2}
                    autoFocus
                    style={{ ...inputBox, width: 54 }}
                  />
                  <Text style={{ fontSize: 18, color: colors.ink.faint, marginBottom: 2 }}>.</Text>
                  <TextInput
                    ref={monthRef}
                    value={month}
                    onChangeText={handleMonthChange}
                    placeholder="MM"
                    placeholderTextColor={colors.ink.faint}
                    keyboardType="number-pad"
                    maxLength={2}
                    style={{ ...inputBox, width: 54 }}
                  />
                  <Text style={{ fontSize: 18, color: colors.ink.faint, marginBottom: 2 }}>.</Text>
                  <TextInput
                    ref={yearRef}
                    value={year}
                    onChangeText={handleYearChange}
                    placeholder="RRRR"
                    placeholderTextColor={colors.ink.faint}
                    keyboardType="number-pad"
                    maxLength={4}
                    style={{ ...inputBox, width: 78 }}
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
                  Zatwierdź
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

function RadioDot({ active }: { active: boolean }) {
  return (
    <View style={{
      width: 22, height: 22, borderRadius: 11, borderWidth: 2,
      borderColor: active ? colors.evergreen.DEFAULT : colors.line.DEFAULT,
      backgroundColor: active ? colors.evergreen.DEFAULT : 'transparent',
      alignItems: 'center', justifyContent: 'center',
    }}>
      {active && <Icon name="check" size={12} color="#fff" strokeWidth={2.5} />}
    </View>
  );
}

// ── DateField ────────────────────────────────────────────────────────────────

/** "2026-06-15" → "15.06.2026" */
function isoToDisplay(iso: string): string {
  if (!iso || iso.length < 10) return '';
  const [y, m, d] = iso.split('-');
  return `${d ?? ''}.${m ?? ''}.${y ?? ''}`;
}

export interface DateFieldProps {
  value: string; // YYYY-MM-DD lub ''
  onChange: (isoDate: string) => void;
  label?: string;
  placeholder?: string;
  modalTitle?: string;
  minYear?: number;
  maxYear?: number;
}

export function DateField({
  value,
  onChange,
  label,
  placeholder = 'Wybierz datę',
  modalTitle,
  minYear,
  maxYear,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const display = isoToDisplay(value);

  return (
    <>
      <View>
        {label && (
          <Text style={{
            fontSize: 11, fontFamily: 'Geist_500Medium',
            color: colors.ink.faint, textTransform: 'uppercase',
            letterSpacing: 0.6, marginBottom: 6,
          }}>
            {label}
          </Text>
        )}
        <Pressable
          onPress={() => setOpen(true)}
          style={{
            backgroundColor: colors.surface.DEFAULT,
            borderWidth: 0.5, borderColor: colors.line.DEFAULT,
            borderRadius: 13, paddingHorizontal: 16, paddingVertical: 15,
            flexDirection: 'row', alignItems: 'center', gap: 10,
          }}
        >
          <Icon name="calendar" size={18} color={display ? colors.ink.DEFAULT : colors.ink.faint} />
          <Text style={{
            flex: 1, fontSize: 16,
            fontFamily: display ? 'Geist_500Medium' : 'Geist_400Regular',
            color: display ? colors.ink.DEFAULT : colors.ink.faint,
          }}>
            {display || placeholder}
          </Text>
          {display && (
            <Pressable
              onPress={() => onChange('')}
              hitSlop={8}
              style={{ padding: 2 }}
            >
              <Icon name="cross" size={14} color={colors.ink.faint} />
            </Pressable>
          )}
        </Pressable>
      </View>

      <DatePickerModal
        visible={open}
        title={modalTitle ?? label ?? 'Wybierz datę'}
        initialISO={value}
        onConfirm={(iso) => { onChange(iso); setOpen(false); }}
        onClose={() => setOpen(false)}
        minYear={minYear}
        maxYear={maxYear}
      />
    </>
  );
}
