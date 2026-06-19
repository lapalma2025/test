import React from 'react';
import { Modal, View, Text, Pressable, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from './Icon';
import { colors } from '@/theme/tokens';

interface MapSheetProps {
  visible: boolean;
  onClose: () => void;
  name: string;
  city?: string | null;
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  secondaryLabel: string;
  secondaryIcon?: IconName;
  onSecondary: () => void;
}

export function MapSheet({
  visible,
  onClose,
  name,
  city,
  lat,
  lng,
  address,
  secondaryLabel,
  secondaryIcon = 'school',
  onSecondary,
}: MapSheetProps) {
  const insets = useSafeAreaInsets();

  const openGoogleMaps = () => {
    let url: string;
    if (lat && lng) {
      url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    } else {
      const query = address ?? `${name}${city ? ` ${city}` : ''}`;
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    }
    Linking.openURL(url);
    onClose();
  };

  const handleSecondary = () => {
    onClose();
    onSecondary();
  };

  const hasLocation = !!(lat && lng) || !!address;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        {/* Sheet — stop tap propagation so it doesn't close when tapping inside */}
        <Pressable
          onPress={() => undefined}
          style={{
            backgroundColor: colors.cream.DEFAULT,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 20),
            paddingHorizontal: 20,
          }}
        >
          {/* Drag handle */}
          <View style={{
            width: 36, height: 4, borderRadius: 2,
            backgroundColor: colors.line.DEFAULT,
            alignSelf: 'center',
            marginBottom: 20,
          }} />

          {/* Place info */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <View style={{
              width: 46, height: 46, borderRadius: 23,
              backgroundColor: `${colors.evergreen.DEFAULT}18`,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="pin" size={22} color={colors.evergreen.DEFAULT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={2}
                style={{ fontFamily: 'Geist_500Medium', fontSize: 15, color: colors.ink.DEFAULT, lineHeight: 21 }}
              >
                {name}
              </Text>
              {city ? (
                <Text style={{ fontSize: 12, color: colors.ink.faint, marginTop: 2 }}>{city}</Text>
              ) : null}
            </View>
          </View>

          {/* Open in Google Maps */}
          {hasLocation && (
            <Pressable
              onPress={openGoogleMaps}
              style={{
                flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 8, backgroundColor: colors.evergreen.DEFAULT,
                borderRadius: 16, paddingVertical: 15, marginBottom: 10,
              }}
            >
              <Icon name="pin" size={18} color={colors.cream.DEFAULT} />
              <Text style={{ fontFamily: 'Geist_500Medium', fontSize: 15, color: colors.cream.DEFAULT }}>
                Otwórz w Google Maps
              </Text>
              <Icon name="arrow" size={16} color={colors.cream.DEFAULT} />
            </Pressable>
          )}

          {/* Secondary action */}
          <Pressable
            onPress={handleSecondary}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
              gap: 8, backgroundColor: colors.surface.DEFAULT,
              borderWidth: 1, borderColor: colors.line.DEFAULT,
              borderRadius: 16, paddingVertical: 15, marginBottom: 8,
            }}
          >
            <Icon name={secondaryIcon} size={18} color={colors.ink.DEFAULT} />
            <Text style={{ fontFamily: 'Geist_500Medium', fontSize: 15, color: colors.ink.DEFAULT }}>
              {secondaryLabel}
            </Text>
          </Pressable>

          {/* Cancel */}
          <Pressable onPress={onClose} style={{ alignItems: 'center', paddingVertical: 12 }}>
            <Text style={{ fontSize: 14, color: colors.ink.faint }}>Anuluj</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
