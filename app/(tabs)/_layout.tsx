import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '@/components/ui/Icon';
import { colors } from '@/theme/tokens';
import { useT } from '@/i18n';

type TabDef = { name: string; labelKey: keyof ReturnType<typeof useT>['tabs']; icon: IconName };

const TAB_DEFS: TabDef[] = [
  { name: 'trasa',     labelKey: 'route',   icon: 'routeAlt'   },
  { name: 'szkoly',    labelKey: 'schools', icon: 'school'     },
  { name: 'pieniadze', labelKey: 'money',   icon: 'wallet'     },
  { name: 'sklep',     labelKey: 'shop',    icon: 'bag'        },
  { name: 'zdrowie',   labelKey: 'health',  icon: 'heartPulse' },
  { name: 'profil',    labelKey: 'profile', icon: 'user'       },
];

// Wysokość paska bez safe-area — zawartość ikona + etykieta + padding
const TAB_CONTENT_HEIGHT = 56;

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const t = useT();
  // Na każdym telefonie tabBar wyrównany do safe-area (home indicator, pasek gestów)
  const tabBarHeight = TAB_CONTENT_HEIGHT + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        lazy: true,
        tabBarStyle: {
          backgroundColor: colors.cream.DEFAULT,
          borderTopColor: colors.line.DEFAULT,
          borderTopWidth: 0.5,
          height: tabBarHeight,
          paddingTop: 8,
          // paddingBottom = dokładna wielkość safe-area (lub minimum 4px)
          paddingBottom: Math.max(insets.bottom, 4),
        },
        tabBarShowLabel: false,
      }}
    >
      {TAB_DEFS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            tabBarIcon: ({ focused }) => (
              <TabIcon icon={tab.icon} label={t.tabs[tab.labelKey]} focused={focused} />
            ),
          }}
        />
      ))}
      {/* bez ikony w tab barze — dostępne przez nawigację ze ZdrowieScreen */}
      <Tabs.Screen name="notatki" options={{ href: null }} />
      <Tabs.Screen name="lista" options={{ href: null }} />
    </Tabs>
  );
}

function TabIcon({ icon, label, focused }: { icon: IconName; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 3, minWidth: 44 }}>
      <Icon
        name={icon}
        size={22}
        color={focused ? colors.evergreen.DEFAULT : colors.ink.faint}
        strokeWidth={focused ? 1.8 : 1.6}
      />
      <Text
        style={{
          fontSize: 10,
          color: focused ? colors.evergreen.DEFAULT : colors.ink.faint,
          fontWeight: focused ? '500' : '400',
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// Eksportujemy wysokość kontentu zakładki — używana przez NotatkiScreen
// do keyboardVerticalOffset
export { TAB_CONTENT_HEIGHT };
