/**
 * Wspólne tło głównych ekranów: kolor cream + dekoracyjna ilustracja bg.png.
 * Obrazek ładowany leniwie — nie blokuje startu aplikacji.
 */

import React, { useEffect, useState } from 'react';
import { Image, Platform, View, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { colors } from '@/theme/tokens';

interface MainScreenShellProps {
  children: React.ReactNode;
  edges?: Edge[];
  className?: string;
}

function ScreenBgImage() {
  const { width, height } = useWindowDimensions();
  const tabBarInset = Platform.OS === 'ios' ? 88 : 70;
  const [source, setSource] = useState<ImageSourcePropType | null>(null);

  useEffect(() => {
    try {
      setSource(require('../../../assets/bg.png'));
    } catch (e) {
      console.warn('[MainScreenShell] bg.png niedostępny:', e);
    }
  }, []);

  if (!source) return null;

  return (
    <View pointerEvents="none" style={{ position: 'absolute', right: -18, bottom: tabBarInset * 0.15 }}>
      <Image
        source={source}
        accessibilityIgnoresInvertColors
        resizeMode="contain"
        style={{
          width: width * 0.82,
          height: Math.min(height * 0.42, 360),
          opacity: 0.3,
        }}
      />
    </View>
  );
}

export function MainScreenShell({
  children,
  edges = ['top'],
  className,
}: MainScreenShellProps) {
  return (
    <View className="flex-1 bg-cream">
      <ScreenBgImage />
      <SafeAreaView
        className={`flex-1 ${className ?? ''}`}
        edges={edges}
        style={{ backgroundColor: 'transparent' }}
      >
        {children}
      </SafeAreaView>
    </View>
  );
}

/** Kolor tła ekranów — do pasków dolnych itp. */
export const mainScreenBg = colors.cream.DEFAULT;
