import React, { useState, useRef, forwardRef } from 'react';
import {
  View, Text, TextInput, Pressable, ActivityIndicator,
  KeyboardAvoidingView, ScrollView, Platform,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Icon } from '@/components/ui';
import { signInWithPassword, signUpWithPassword, resetPassword } from '@/services/auth';
import { useProfileStore } from '@/stores/profile';
import { colors } from '@/theme/tokens';

type Tab = 'login' | 'register';

// ─── MAIN SCREEN ──────────────────────────────────────────────────────────────

export default function AuthScreen() {
  const router = useRouter();
  const skipAuth = useProfileStore((s) => s.skipAuth);
  const isOnboarded = useProfileStore((s) => s.isOnboarded);
  const nextRoute = isOnboarded ? '/(tabs)/trasa' : '/onboarding';
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const switchTab = (t: Tab) => {
    setTab(t);
    setError('');
    setPassword('');
    setConfirmPassword('');
    setConfirmed(false);
    setForgotMode(false);
    setResetSent(false);
    setPrivacyAccepted(false);
  };

  const validate = (): string | null => {
    if (!email.includes('@') || !email.includes('.'))
      return 'Podaj prawidłowy adres e-mail.';
    if (forgotMode) return null;
    if (password.length < 8)
      return 'Hasło musi mieć co najmniej 8 znaków.';
    if (tab === 'register' && password !== confirmPassword)
      return 'Hasła nie są takie same.';
    if (tab === 'register' && !privacyAccepted)
      return 'Wyraź zgodę na przetwarzanie danych, aby kontynuować.';
    return null;
  };

  const handleSubmit = async () => {
    setError('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setBusy(true);
    const trimmedEmail = email.trim().toLowerCase();

    try {
      if (tab === 'login') {
        const result = await signInWithPassword(trimmedEmail, password);
        if (!result.ok) { setError(result.error ?? 'Nieznany błąd.'); return; }
        router.replace(nextRoute);
      } else {
        const result = await signUpWithPassword(trimmedEmail, password);
        if (!result.ok) { setError(result.error ?? 'Nieznany błąd.'); return; }
        if (result.needsConfirmation) {
          setConfirmed(true);
        } else {
          router.replace(nextRoute);
        }
      }
    } catch (e: any) {
      setError(e?.message ?? 'Błąd połączenia. Sprawdź internet i spróbuj ponownie.');
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setError('');
    if (!email.includes('@') || !email.includes('.')) {
      setError('Podaj prawidłowy adres e-mail.');
      return;
    }
    setBusy(true);
    const result = await resetPassword(email);
    setBusy(false);
    if (!result.ok) { setError(result.error ?? 'Nieznany błąd.'); return; }
    setResetSent(true);
  };

  // ── Stan: link resetujący wysłany ──────────────────────────────────────────
  if (resetSent) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }} edges={['top', 'bottom']}>
        <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: colors.sage.soft,
            alignItems: 'center', justifyContent: 'center', marginBottom: 24,
          }}>
            <Icon name="check" size={34} color={colors.evergreen.DEFAULT} strokeWidth={2} />
          </View>
          <Text style={{
            fontFamily: 'Newsreader_400Regular', fontSize: 26,
            color: colors.ink.DEFAULT, textAlign: 'center', marginBottom: 10,
          }}>
            Sprawdź skrzynkę
          </Text>
          <Text style={{
            fontSize: 15, color: colors.ink.soft, textAlign: 'center', lineHeight: 22,
          }}>
            Wysłaliśmy link do zresetowania hasła na{' '}
            <Text style={{ color: colors.ink.DEFAULT, fontFamily: 'Geist_500Medium' }}>{email}</Text>
            .{'\n'}Kliknij go, a następnie wróć i zaloguj się nowym hasłem.
          </Text>
          <Pressable
            onPress={() => { setResetSent(false); setForgotMode(false); }}
            style={{
              marginTop: 32, backgroundColor: colors.evergreen.DEFAULT,
              borderRadius: 16, paddingVertical: 17, paddingHorizontal: 32,
            }}
          >
            <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: '#FFFFFF' }}>
              Wróć do logowania
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Stan: potwierdzenie e-mail po rejestracji ──────────────────────────────
  if (confirmed) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }} edges={['top', 'bottom']}>
        <View style={{ flex: 1, paddingHorizontal: 28, justifyContent: 'center', alignItems: 'center' }}>
          <View style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: colors.sage.soft,
            alignItems: 'center', justifyContent: 'center', marginBottom: 24,
          }}>
            <Icon name="check" size={34} color={colors.evergreen.DEFAULT} strokeWidth={2} />
          </View>
          <Text style={{
            fontFamily: 'Newsreader_400Regular', fontSize: 26,
            color: colors.ink.DEFAULT, textAlign: 'center', marginBottom: 10,
          }}>
            Sprawdź skrzynkę
          </Text>
          <Text style={{
            fontSize: 15, color: colors.ink.soft, textAlign: 'center', lineHeight: 22,
          }}>
            Wysłaliśmy link aktywacyjny na{' '}
            <Text style={{ color: colors.ink.DEFAULT, fontFamily: 'Geist_500Medium' }}>
              {email}
            </Text>
            .{'\n'}Kliknij go, a następnie wróć i się zaloguj.
          </Text>
          <Pressable
            onPress={() => { setConfirmed(false); setTab('login'); }}
            style={{
              marginTop: 32, backgroundColor: colors.evergreen.DEFAULT,
              borderRadius: 16, paddingVertical: 17, paddingHorizontal: 32,
            }}
          >
            <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: '#FFFFFF' }}>
              Przejdź do logowania
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Główny widok ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 22, paddingBottom: 32 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo ─────────────────────────────────────────────────────── */}
          <View style={{ alignItems: 'center', paddingTop: 44, marginBottom: 32 }}>
            <View style={{
              width: 76, height: 76, borderRadius: 24,
              backgroundColor: colors.evergreen.DEFAULT,
              alignItems: 'center', justifyContent: 'center', marginBottom: 18,
              shadowColor: colors.evergreen.DEFAULT,
              shadowOpacity: 0.25, shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 }, elevation: 6,
            }}>
              <Icon name="baby" size={36} color="#FFFFFF" />
            </View>
            <Text style={{
              fontFamily: 'Newsreader_400Regular', fontSize: 32,
              color: colors.ink.DEFAULT, letterSpacing: -0.5,
            }}>
              Filipek
            </Text>
            <Text style={{ fontSize: 14, color: colors.ink.soft, marginTop: 5 }}>
              Towarzysz w ciąży i po porodzie
            </Text>
          </View>

          {/* ── Karta z formularzem ───────────────────────────────────────── */}
          <View style={{
            backgroundColor: colors.surface.DEFAULT,
            borderRadius: 24, padding: 22,
            shadowColor: '#000',
            shadowOpacity: 0.06, shadowRadius: 16,
            shadowOffset: { width: 0, height: 4 }, elevation: 3,
          }}>
            {/* Tab switcher */}
            <View style={{
              flexDirection: 'row', backgroundColor: colors.cream.DEFAULT,
              borderRadius: 14, padding: 4, marginBottom: 22,
            }}>
              {(['login', 'register'] as Tab[]).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => switchTab(t)}
                  style={{
                    flex: 1, paddingVertical: 11, borderRadius: 11, alignItems: 'center',
                    backgroundColor: tab === t ? '#FFFFFF' : 'transparent',
                    shadowColor: tab === t ? '#000' : 'transparent',
                    shadowOpacity: tab === t ? 0.07 : 0,
                    shadowRadius: 4, elevation: tab === t ? 2 : 0,
                  }}
                >
                  <Text style={{
                    fontSize: 14,
                    fontFamily: tab === t ? 'Geist_500Medium' : 'Geist_400Regular',
                    color: tab === t ? colors.ink.DEFAULT : colors.ink.soft,
                  }}>
                    {t === 'login' ? 'Zaloguj się' : 'Utwórz konto'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* E-mail */}
            <AuthInput
              label="E-mail"
              value={email}
              onChangeText={setEmail}
              placeholder="anna@example.pl"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />

            {/* Hasło — ukryte w trybie reset */}
            {!forgotMode && (
              <View style={{ marginTop: 11 }}>
                <AuthInput
                  ref={passwordRef}
                  label="Hasło"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Minimum 8 znaków"
                  secureTextEntry={!showPassword}
                  returnKeyType={tab === 'login' ? 'done' : 'next'}
                  onSubmitEditing={() =>
                    tab === 'register' ? confirmRef.current?.focus() : handleSubmit()
                  }
                  rightElement={
                    <Pressable
                      onPress={() => setShowPassword((v) => !v)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={{
                        fontSize: 12.5, color: colors.ink.faint,
                        fontFamily: 'Geist_500Medium',
                      }}>
                        {showPassword ? 'Ukryj' : 'Pokaż'}
                      </Text>
                    </Pressable>
                  }
                />
              </View>
            )}

            {/* Potwierdź hasło — tylko przy rejestracji */}
            {tab === 'register' && !forgotMode && (
              <View style={{ marginTop: 11 }}>
                <AuthInput
                  ref={confirmRef}
                  label="Potwierdź hasło"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Wpisz hasło ponownie"
                  secureTextEntry={!showPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                />
              </View>
            )}

            {/* Zgoda RODO — tylko przy rejestracji */}
            {tab === 'register' && !forgotMode && (
              <Pressable
                onPress={() => setPrivacyAccepted((v) => !v)}
                style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginTop: 16 }}
              >
                <View style={{
                  width: 20, height: 20, borderRadius: 5, marginTop: 1,
                  borderWidth: 1.5,
                  borderColor: privacyAccepted ? colors.evergreen.DEFAULT : colors.line.DEFAULT,
                  backgroundColor: privacyAccepted ? colors.evergreen.DEFAULT : 'transparent',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {privacyAccepted && (
                    <Icon name="check" size={12} color="#FFFFFF" strokeWidth={2.5} />
                  )}
                </View>
                <Text style={{ flex: 1, fontSize: 13, color: colors.ink.soft, lineHeight: 20 }}>
                  Akceptuję{' '}
                  <Text
                    onPress={() => router.push('/info?section=privacy' as any)}
                    style={{ color: colors.evergreen.DEFAULT, fontFamily: 'Geist_500Medium' }}
                  >
                    Politykę Prywatności
                  </Text>
                  {' '}i wyrażam zgodę na przetwarzanie moich danych osobowych, w tym danych o stanie zdrowia, w celu korzystania z aplikacji.
                </Text>
              </Pressable>
            )}

            {/* Błąd */}
            {error ? (
              <View style={{
                flexDirection: 'row', gap: 9, alignItems: 'flex-start',
                backgroundColor: colors.terracotta.soft, borderRadius: 12,
                padding: 13, marginTop: 14,
              }}>
                <Icon name="info" size={15} color={colors.terracotta.DEFAULT} />
                <Text style={{ flex: 1, fontSize: 13.5, color: colors.ink.DEFAULT, lineHeight: 20 }}>
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Przycisk CTA */}
            <Pressable
              onPress={forgotMode ? handleReset : handleSubmit}
              disabled={busy}
              style={{
                marginTop: 18, backgroundColor: colors.evergreen.DEFAULT,
                borderRadius: 16, paddingVertical: 17, alignItems: 'center',
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={{ fontSize: 15, fontFamily: 'Geist_500Medium', color: '#FFFFFF' }}>
                  {forgotMode ? 'Wyślij link resetujący' : tab === 'login' ? 'Zaloguj się' : 'Utwórz konto'}
                </Text>
              )}
            </Pressable>

            {/* Zapomniane hasło — tylko login */}
            {tab === 'login' && !forgotMode && (
              <Pressable
                onPress={() => { setForgotMode(true); setError(''); setPassword(''); }}
                style={{ alignItems: 'center', marginTop: 14 }}
              >
                <Text style={{ fontSize: 13, color: colors.ink.faint }}>
                  Nie pamiętasz hasła?{' '}
                  <Text style={{ color: colors.evergreen.DEFAULT, fontFamily: 'Geist_500Medium' }}>
                    Zresetuj
                  </Text>
                </Text>
              </Pressable>
            )}

            {/* Wróć z trybu reset */}
            {forgotMode && (
              <Pressable
                onPress={() => { setForgotMode(false); setError(''); }}
                style={{ alignItems: 'center', marginTop: 14 }}
              >
                <Text style={{ fontSize: 13, color: colors.ink.faint }}>
                  ← Wróć do logowania
                </Text>
              </Pressable>
            )}
          </View>

          {/* ── Bez konta ─────────────────────────────────────────────────── */}
          <View style={{ alignItems: 'center', marginTop: 20 }}>
            <Pressable
              onPress={() => { skipAuth(); router.replace(nextRoute); }}
              style={{ paddingVertical: 12, paddingHorizontal: 16 }}
            >
              <Text style={{ fontSize: 13.5, color: colors.ink.soft }}>
                Kontynuuj bez konta
              </Text>
            </Pressable>
            <Text style={{ fontSize: 11.5, color: colors.ink.faint, textAlign: 'center', marginTop: 4, paddingHorizontal: 32, lineHeight: 17 }}>
              Dane będą przechowywane tylko na tym urządzeniu
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── INPUT COMPONENT ─────────────────────────────────────────────────────────

interface AuthInputProps extends TextInputProps {
  label: string;
  rightElement?: React.ReactNode;
}

const AuthInput = forwardRef<TextInput, AuthInputProps>(
  ({ label, rightElement, ...textInputProps }, ref) => {
    return (
      <View style={{
        backgroundColor: colors.cream.DEFAULT,
        borderRadius: 14, borderWidth: 1, borderColor: colors.line.DEFAULT,
        paddingHorizontal: 16, paddingTop: 11, paddingBottom: 13,
      }}>
        <Text style={{
          fontSize: 11, fontFamily: 'Geist_500Medium',
          color: colors.ink.faint, letterSpacing: 0.5,
          textTransform: 'uppercase', marginBottom: 5,
        }}>
          {label}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            ref={ref}
            placeholderTextColor={colors.ink.faint}
            style={{
              flex: 1, fontSize: 15,
              color: colors.ink.DEFAULT,
              fontFamily: 'Geist_400Regular',
              paddingVertical: 0,
            }}
            {...textInputProps}
          />
          {rightElement && (
            <View style={{ marginLeft: 8 }}>
              {rightElement}
            </View>
          )}
        </View>
      </View>
    );
  }
);
