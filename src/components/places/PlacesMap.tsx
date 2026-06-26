/**
 * Mapa placówek — react-native-maps (lazy). Marker → profil w aplikacji.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

import { colors } from '@/theme/tokens';

export interface MapPlace {
  id: string;
  name: string;
  city?: string | null;
  voivodeship?: string | null;
  lat?: number | null;
  lng?: number | null;
  is_nfz?: boolean;
}

interface PlacesMapProps {
  places: MapPlace[];
  voivodeship?: string;
  onSelect?: (id: string) => void;
  expanded?: boolean;
}

type NativeMapComponent = React.ComponentType<PlacesMapProps>;

export function PlacesMap(props: PlacesMapProps) {
  const [NativeMap, setNativeMap] = useState<NativeMapComponent | null>(null);
  const [mapError, setMapError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    import('./PlacesMapNative')
      .then((mod) => {
        if (active) {
          setNativeMap(() => mod.PlacesMapNative);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('[PlacesMap] react-native-maps niedostępne:', err);
        if (active) {
          setMapError(true);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const mapHeight = props.expanded ? undefined : 260;
  const containerClass = props.expanded
    ? 'flex-1 mx-5 mb-3 rounded-card overflow-hidden border border-line'
    : 'mx-5 mb-3 rounded-card overflow-hidden border border-line';

  if (loading) {
    return (
      <View
        className={`${containerClass} items-center justify-center bg-surface`}
        style={mapHeight ? { height: mapHeight } : { flex: 1, minHeight: 280 }}
      >
        <ActivityIndicator color={colors.evergreen.DEFAULT} />
      </View>
    );
  }

  if (mapError || !NativeMap) {
    return (
      <View className="mx-5 mb-3 p-4 bg-surface border border-line rounded-card">
        <Text className="text-ink-soft text-[12px] text-center">
          Nie udało się załadować mapy. Przełącz na listę i wybierz placówkę.
        </Text>
      </View>
    );
  }

  return (
    <View className={containerClass} style={props.expanded ? { flex: 1, minHeight: 280 } : undefined}>
      <NativeMap {...props} />
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: '#2E7D32' }]} />
          <Text style={styles.legendLabel}>NFZ</Text>
        </View>
        <View style={styles.legendRow}>
          <View style={[styles.dot, { backgroundColor: '#C62828' }]} />
          <Text style={styles.legendLabel}>Prywatnie</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  legend: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.93)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 5,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: 12,
    color: colors.ink.DEFAULT,
    fontFamily: 'Geist_500Medium',
  },
});
