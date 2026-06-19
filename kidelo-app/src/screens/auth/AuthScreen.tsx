/**
 * AuthScreen.tsx — logowanie do Supabase: email magic link + OAuth.
 * Opcjonalne — można używać aplikacji w trybie "guest" (local only).
 */

import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Button, Icon } from '@/components/ui';
import { signInWithEmail, signInWithOAuth } from '@/services/auth';
import { isSupabaseConfigured } from '@/services/supabase';
import { colors } from '@/theme/tokens';

export default function AuthScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  if (!isSupabaseConfigured()) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center px-8">
        <Text className="font-serif text-[24px] text-ink text-center">Tryb offline</Text>
        <Text className="text-ink-soft text-[14px] text-center mt-2 leading-snug">
          Supabase nie jest skonfigurowane. Aplikacja działa lokalnie, dane są zapisywane tylko na tym urządzeniu.
        </Text>
        <View className="mt-6 w-full">
          <Button variant="primary" full onPress={() => router.replace('/(tabs)/trasa')}>
            Kontynuuj jako gość
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const handleEmail = async () => {
    if (!email.includes('@')) {
      Alert.alert('Niepoprawny email');
      return;
    }
    setIsLoading(true);
    const result = await signInWithEmail(email);
    setIsLoading(false);
    if (result.ok) {
      setEmailSent(true);
    } else {
      Alert.alert('Błąd', result.error ?? 'Nieznany błąd');
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    const result = await signInWithOAuth(provider);
    setIsLoading(false);
    if (result.ok) {
      router.replace('/(tabs)/trasa');
    } else if (result.error !== 'cancel') {
      Alert.alert('Błąd', result.error ?? 'Nieznany błąd');
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center px-8">
        <View className="w-20 h-20 bg-sage-soft rounded-full items-center justify-center">
          <Icon name="check" size={36} color={colors.evergreen.DEFAULT} strokeWidth={2} />
        </View>
        <Text className="font-serif text-[26px] text-ink text-center mt-5 leading-tight">
          Sprawdź skrzynkę
        </Text>
        <Text className="text-ink-soft text-[14px] text-center mt-2 leading-snug">
          Wysłaliśmy magiczny link na {email}. Otwórz go na tym telefonie żeby się zalogować.
        </Text>
        <Pressable onPress={() => setEmailSent(false)} className="mt-6">
          <Text className="text-sage text-[13px] font-sans-medium">Wpisz inny adres →</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
      <View className="flex-1 px-5 justify-center">
        <View className="items-center mb-8">
          <View className="w-16 h-16 bg-evergreen rounded-card items-center justify-center">
            <Icon name="routeAlt" size={32} color={colors.cream.DEFAULT} />
          </View>
          <Text className="font-serif text-[32px] text-ink mt-4">Kidelo</Text>
          <Text className="text-ink-soft text-[14px] text-center mt-2 leading-snug">
            Twoja trasa przez ciążę i pierwsze miesiące — terminy, świadczenia i dokumenty w jednym miejscu.
          </Text>
        </View>

        <View className="gap-3">
          <View className="bg-surface border border-line rounded-card px-4 py-3.5">
            <Text className="text-[11px] text-ink-faint uppercase tracking-wide mb-1">Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="anna@kidelo.pl"
              placeholderTextColor={colors.ink.faint}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              className="text-ink text-[15px]"
            />
          </View>

          <Button variant="primary" full iconRight="arrow" onPress={handleEmail} disabled={isLoading}>
            {isLoading ? 'Wysyłam...' : 'Wyślij magiczny link'}
          </Button>

          <View className="flex-row items-center gap-3 my-2">
            <View className="flex-1 h-px bg-line" />
            <Text className="text-ink-faint text-[12px]">lub</Text>
            <View className="flex-1 h-px bg-line" />
          </View>

          <Button variant="light" full icon="shield" onPress={() => handleOAuth('apple')}>
            Kontynuuj z Apple
          </Button>
          <Button variant="light" full icon="globe" onPress={() => handleOAuth('google')}>
            Kontynuuj z Google
          </Button>

          <Pressable onPress={() => router.replace('/(tabs)/trasa')} className="py-3 items-center">
            <Text className="text-ink-soft text-[13px]">Kontynuuj jako gość (offline)</Text>
          </Pressable>
        </View>

        {isLoading && (
          <View className="absolute inset-0 bg-cream/80 items-center justify-center">
            <ActivityIndicator color={colors.evergreen.DEFAULT} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
