import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useLanguageStore, type Lang } from '@/stores/language';
import { colors } from '@/theme/tokens';

interface Props {
  size?: 'sm' | 'md';
}

const FLAGS: Record<Lang, string> = { pl: '🇵🇱', en: '🇬🇧' };

export function LanguageSwitcher({ size = 'md' }: Props) {
  const { lang, setLang } = useLanguageStore();
  const fontSize = size === 'sm' ? 18 : 22;
  const padding = size === 'sm' ? 4 : 6;

  return (
    <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
      {(['pl', 'en'] as Lang[]).map((l) => (
        <Pressable
          key={l}
          onPress={() => setLang(l)}
          hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
          style={{
            padding,
            borderRadius: 8,
            backgroundColor: lang === l ? colors.line.DEFAULT : 'transparent',
            opacity: lang === l ? 1 : 0.45,
          }}
        >
          <Text style={{ fontSize }}>{FLAGS[l]}</Text>
        </Pressable>
      ))}
    </View>
  );
}
