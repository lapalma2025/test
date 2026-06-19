import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import { resolveCoords } from '@/services/geo';
import { VOIVODESHIP_CAPITAL_COORDS, type Voivodeship } from '@/constants/voivodeships';
import type { MapPlace } from './PlacesMap';

interface PlacesMapNativeProps {
  places: MapPlace[];
  voivodeship?: string;
  onSelect?: (id: string) => void;
  expanded?: boolean;
}

export function PlacesMapNative({ places, voivodeship, onSelect, expanded }: PlacesMapNativeProps) {
  const markers = useMemo(
    () =>
      places
        .map((place) => {
          const coords = resolveCoords(place.id, place.lat, place.lng, place.city, place.voivodeship);
          return coords ? { ...place, ...coords } : null;
        })
        .filter((m): m is MapPlace & { lat: number; lng: number } => m !== null),
    [places]
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

  return (
    <View style={expanded ? styles.expanded : styles.compact}>
      <MapView style={StyleSheet.absoluteFillObject} initialRegion={region}>
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
});
