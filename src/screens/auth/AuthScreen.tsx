import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Button, Icon } from '@/components/ui';
import { signInWithEmail, signInWithOAuth } from '@/services/auth';
import { isSupabaseConfigured } from '@/services/supabase';
import { colors } from '@/theme/tokens';
import { useT } from '@/i18n';

export default function AuthScreen() {
  const router = useRouter();
  const t = useT();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  if (!isSupabaseConfigured()) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center px-8">
        <Text className="font-serif text-[24px] text-ink text-center">{t.auth.offlineTitle}</Text>
        <Text className="text-ink-soft text-[14px] text-center mt-2 leading-snug">
          {t.auth.offlineDesc}
        </Text>
        <View className="mt-6 w-full">
          <Button variant="primary" full onPress={() => router.replace('/(tabs)/trasa')}>
            {t.auth.continueAsGuest}
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const handleEmail = async () => {
    if (!email.includes('@')) {
      Alert.alert(t.auth.invalidEmail);
      return;
    }
    setIsLoading(true);
    const result = await signInWithEmail(email);
    setIsLoading(false);
    if (result.ok) {
      setEmailSent(true);
    } else {
      Alert.alert(t.auth.error, result.error ?? t.auth.unknownError);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setIsLoading(true);
    const result = await signInWithOAuth(provider);
    setIsLoading(false);
    if (result.ok) {
      router.replace('/(tabs)/trasa');
    } else if (result.error !== 'cancel') {
      Alert.alert(t.auth.error, result.error ?? t.auth.unknownError);
    }
  };

  if (emailSent) {
    return (
      <SafeAreaView className="flex-1 bg-cream items-center justify-center px-8">
        <View className="w-20 h-20 bg-sage-soft rounded-full items-center justify-center">
          <Icon name="check" size={36} color={colors.evergreen.DEFAULT} strokeWidth={2} />
        </View>
        <Text className="font-serif text-[26px] text-ink text-center mt-5 leading-tight">
          {t.auth.checkInbox}
        </Text>
        <Text className="text-ink-soft text-[14px] text-center mt-2 leading-snug">
          {t.auth.magicLinkSentTo(email)}
        </Text>
        <Pressable onPress={() => setEmailSent(false)} className="mt-6">
          <Text className="text-sage text-[13px] font-sans-medium">{t.auth.changeEmail}</Text>
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
            {t.auth.tagline}
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
            {isLoading ? t.auth.sending : t.auth.sendMagicLink}
          </Button>

          <View className="flex-row items-center gap-3 my-2">
            <View className="flex-1 h-px bg-line" />
            <Text className="text-ink-faint text-[12px]">{t.common.or}</Text>
            <View className="flex-1 h-px bg-line" />
          </View>

          <Button variant="light" full icon="shield" onPress={() => handleOAuth('apple')}>
            {t.auth.continueWithApple}
          </Button>
          <Button variant="light" full icon="globe" onPress={() => handleOAuth('google')}>
            {t.auth.continueWithGoogle}
          </Button>

          <Pressable onPress={() => router.replace('/(tabs)/trasa')} className="py-3 items-center">
            <Text className="text-ink-soft text-[13px]">{t.auth.continueOffline}</Text>
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
