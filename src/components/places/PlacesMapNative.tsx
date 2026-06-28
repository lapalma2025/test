import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform, Pressable, Linking } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';

import { resolveCoords } from '@/services/geo';
import { VOIVODESHIP_CAPITAL_COORDS, type Voivodeship } from '@/constants/voivodeships';
import { colors } from '@/theme/tokens';
import type { MapPlace } from './PlacesMap';

interface PlacesMapNativeProps {
  places: MapPlace[];
  voivodeship?: string;
  onSelect?: (id: string) => void;
  expanded?: boolean;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyDsTb0fLqvBzHUBDlY3wbTLZawAyiC9bOQ';

export function PlacesMapNative({ places, voivodeship, onSelect, expanded }: PlacesMapNativeProps) {

  const markers = useMemo(
    () =>
      places
        .map((place) => {
          const coords = resolveCoords(place.id, place.lat, place.lng, place.city, place.voivodeship);
          return coords ? { ...place, ...coords } : null;
        })
        .filter((m): m is MapPlace & { lat: number; lng: number } => m !== null),
    [places],
  );

  const region = useMemo(() => {
    if (markers.length > 0) {
      const lats = markers.map((m) => m.lat);
      const lngs = markers.map((m) => m.lng);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLng = Math.min(...lngs);
      const maxLng = Math.max(...lngs);
      return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max(0.08, (maxLat - minLat) * 1.4 + 0.05),
        longitudeDelta: Math.max(0.08, (maxLng - minLng) * 1.4 + 0.05),
      };
    }

    const capital = voivodeship
      ? VOIVODESHIP_CAPITAL_COORDS[voivodeship as Voivodeship]
      : VOIVODESHIP_CAPITAL_COORDS.mazowieckie;

    return {
      latitude: capital.lat,
      longitude: capital.lng,
      latitudeDelta: voivodeship ? 1.2 : 5.5,
      longitudeDelta: voivodeship ? 1.2 : 5.5,
    };
  }, [markers, voivodeship]);

  // Na Android bez skonfigurowanego klucza API pokazujemy fallback zamiast crashować.
  const androidNeedsKey = Platform.OS === 'android' && !GOOGLE_MAPS_API_KEY;

  if (androidNeedsKey) {
    const firstMarker = markers[0];
    const mapsQuery = firstMarker
      ? `${firstMarker.lat},${firstMarker.lng}`
      : voivodeship ?? 'Polska';

    return (
      <View style={[styles.fallback, expanded ? styles.expanded : styles.compact]}>
        <Text style={styles.fallbackTitle}>Mapa niedostępna</Text>
        <Text style={styles.fallbackDesc}>
          Mapa wbudowana wymaga klucza Google Maps API. Dotknij, by otworzyć mapę zewnętrznie.
        </Text>
        <Pressable
          onPress={() =>
            Linking.openURL(
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`,
            ).catch(() => {})
          }
          style={styles.fallbackBtn}
        >
          <Text style={styles.fallbackBtnText}>Otwórz w Google Maps</Text>
        </Pressable>
        {markers.length > 0 && (
          <Text style={styles.fallbackCount}>{markers.length} placówek w wybranym regionie</Text>
        )}
      </View>
    );
  }

  return (
    <View style={expanded ? styles.expanded : styles.compact}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        initialRegion={region}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{ latitude: marker.lat, longitude: marker.lng }}
            pinColor={marker.is_nfz ? 'green' : 'red'}
            onPress={() => onSelect?.(marker.id)}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  compact: { height: 260 },
  expanded: { flex: 1, minHeight: 280 },
  fallback: {
    backgroundColor: colors.surface.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  fallbackTitle: {
    fontSize: 15,
    fontFamily: 'Geist_500Medium',
    color: colors.ink.DEFAULT,
  },
  fallbackDesc: {
    fontSize: 13,
    color: colors.ink.soft,
    textAlign: 'center',
    lineHeight: 19,
  },
  fallbackBtn: {
    marginTop: 4,
    backgroundColor: colors.evergreen.DEFAULT,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  fallbackBtnText: {
    fontSize: 14,
    fontFamily: 'Geist_500Medium',
    color: '#FFFFFF',
  },
  fallbackCount: {
    fontSize: 12,
    color: colors.ink.faint,
    marginTop: 4,
  },
});
