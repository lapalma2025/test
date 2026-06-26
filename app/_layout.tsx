import '@/bootstrap';
import '../global.css';
import 'react-native-gesture-handler';

// Musi być na poziomie modułu, przed jakimkolwiek renderem.
// Bez tego powiadomienia nie są wyświetlane gdy aplikacja jest na pierwszym planie.
import * as Notifications from 'expo-notifications';
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Newsreader_400Regular, Newsreader_500Medium } from '@expo-google-fonts/newsreader';
import { Geist_400Regular, Geist_500Medium } from '@expo-google-fonts/geist';
import { GeistMono_400Regular } from '@expo-google-fonts/geist-mono';
import { AppState, type AppStateStatus, View, Text, Pressable, Platform, ScrollView } from 'react-native';

import { AppErrorBoundary } from '@/components/ErrorBoundary';
import { useProfileStore } from '@/stores/profile';
import { useAuth } from '@/hooks/useAuth';
import { initSentry } from '@/services/monitoring';
import { colors } from '@/theme/tokens';

SplashScreen.preventAutoHideAsync();

/** Expo Router — zamiast niebieskiego ekranu pokazuje treść błędu (StyleSheet, bez NativeWind). */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT, padding: 24, justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: '600', color: colors.ink.DEFAULT, marginBottom: 8 }}>
        Coś poszło nie tak
      </Text>
      <Text style={{ fontSize: 14, color: colors.danger, marginBottom: 16 }} selectable>
        {error.message}
      </Text>
      <ScrollView style={{ maxHeight: 200, marginBottom: 20 }}>
        <Text style={{ fontSize: 11, color: colors.ink.soft, fontFamily: 'monospace' }} selectable>
          {error.stack ?? ''}
        </Text>
      </ScrollView>
      <Pressable
        onPress={retry}
        style={{ backgroundColor: colors.evergreen.DEFAULT, paddingVertical: 14, borderRadius: 14 }}
      >
        <Text style={{ color: colors.cream.DEFAULT, textAlign: 'center', fontWeight: '600' }}>
          Spróbuj ponownie
        </Text>
      </Pressable>
    </View>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
}

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    Newsreader_400Regular,
    Newsreader_500Medium,
    Geist_400Regular,
    Geist_500Medium,
    GeistMono_400Regular,
  });

  useEffect(() => {
    initSentry();
    const sub = AppState.addEventListener('change', onAppStateChange);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (fontError) {
      console.error('[fonts]', fontError);
    }
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      setAppReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!appReady) {
    return <View style={{ flex: 1, backgroundColor: colors.cream.DEFAULT }} />;
  }

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <StatusBar style="dark" backgroundColor={colors.cream.DEFAULT} />
          <NavGuard />
        </SafeAreaProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}

function NavGuard() {
  const router = useRouter();
  const segments = useSegments();
  const isOnboarded = useProfileStore((s) => s.isOnboarded);
  const auth = useAuth();

  useEffect(() => {
    const first = segments[0] as string | undefined;
    if (!first) return;
    const inOnboarding = first === 'onboarding';
    const inAuth = first === 'auth';

    if (!isOnboarded && !inOnboarding && !inAuth) {
      router.replace('/onboarding');
    } else if (isOnboarded && inOnboarding) {
      router.replace('/(tabs)/trasa');
    }
  }, [isOnboarded, segments, auth.isAuthenticated]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.cream.DEFAULT },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="benefit/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="task/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="school/[id]" options={{ presentation: 'card' }} />
      <Stack.Screen name="compare" options={{ presentation: 'card' }} />
      <Stack.Screen name="timeline" options={{ presentation: 'card' }} />
      <Stack.Screen name="info" options={{ presentation: 'card' }} />
      <Stack.Screen name="week/[week]" options={{ presentation: 'card' }} />
      <Stack.Screen name="edit-profile" options={{ presentation: 'card' }} />
      <Stack.Screen name="kalkulator" options={{ presentation: 'card' }} />
      <Stack.Screen name="kalkulator-finansowy" options={{ presentation: 'card' }} />
      <Stack.Screen name="partner" options={{ presentation: 'card' }} />
      <Stack.Screen name="tygodnie" options={{ presentation: 'card' }} />
      <Stack.Screen name="tracker/kopniecia" options={{ presentation: 'card' }} />
      <Stack.Screen name="tracker/skurcze" options={{ presentation: 'card' }} />
      <Stack.Screen name="tracker/wyniki" options={{ presentation: 'card' }} />
      <Stack.Screen name="tracker/karmienie" options={{ presentation: 'card' }} />
      <Stack.Screen name="tracker/szczepienia" options={{ presentation: 'card' }} />
      <Stack.Screen name="tracker/brzuszek" options={{ presentation: 'card' }} />
      <Stack.Screen name="tracker/album" options={{ presentation: 'card' }} />
      <Stack.Screen name="tracker/badania" options={{ presentation: 'card' }} />
      <Stack.Screen name="tracker/leki" options={{ presentation: 'card' }} />
    </Stack>
  );
}
