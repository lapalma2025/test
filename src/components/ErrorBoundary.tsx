import React from 'react';
import { View, Text, Pressable } from 'react-native';

import { colors } from '@/theme/tokens';
import { useLanguageStore } from '@/stores/language';
import { pl as plT } from '@/i18n/pl';
import { en as enT } from '@/i18n/en';

interface Props {
  children: React.ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error);
  }

  render() {
    if (this.state.hasError) {
      const lang = useLanguageStore.getState().lang;
      const t = (lang === 'en' ? enT : plT).errorBoundary;
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream.DEFAULT, padding: 32 }}>
          <Text style={{ fontFamily: 'Newsreader_500Medium', fontSize: 22, color: colors.ink.DEFAULT, textAlign: 'center' }}>
            {this.props.fallbackTitle ?? t.title}
          </Text>
          <Text style={{ fontSize: 13, color: colors.ink.soft, textAlign: 'center', marginTop: 8 }}>
            {t.subtitle}
          </Text>
          <Pressable
            onPress={() => this.setState({ hasError: false })}
            style={{ marginTop: 16, backgroundColor: colors.evergreen.DEFAULT, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14 }}
          >
            <Text style={{ color: colors.cream.DEFAULT, fontSize: 14, fontWeight: '500' }}>{t.retry}</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
