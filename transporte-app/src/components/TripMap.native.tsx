import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, UrlTile } from "react-native-maps";
import { colors, font, radius, shadows, spacing } from "../theme/theme";
import type { MapMarkerKind, TripMapProps } from "./mapTypes";

// Mientras no tengamos una llave de Google propia, el mapa base usa OpenStreetMap.
// Cuando publiquemos la app con la llave de Google, se cambia a false.
const USE_OSM_TILES = true;
const OSM_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const PIN_COLOR: Record<MapMarkerKind, string> = {
  pickup: colors.primary,
  driver: colors.info,
  selected: colors.success,
};

const KIND_LABEL: Record<MapMarkerKind, string> = {
  pickup: "Recogida",
  driver: "Conductor",
  selected: "Seleccionado",
};

const DEFAULT_REGION = {
  latitude: 8.89,
  longitude: -64.25,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

export function TripMap({ markers, height = 240 }: TripMapProps) {
  const mapRef = useRef<MapView>(null);
  const [ready, setReady] = useState(false);
  const idsKey = markers.map((marker) => marker.id).join("|");

  // Re-center only when the map is ready and the set of markers changes
  useEffect(() => {
    if (!ready || markers.length === 0) return;
    if (markers.length === 1) {
      mapRef.current?.animateToRegion(
        {
          latitude: markers[0].latitude,
          longitude: markers[0].longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        400,
      );
    } else {
      mapRef.current?.fitToCoordinates(
        markers.map((marker) => ({
          latitude: marker.latitude,
          longitude: marker.longitude,
        })),
        {
          edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
          animated: true,
        },
      );
    }
  }, [idsKey, ready]);

  const kinds = Array.from(new Set(markers.map((marker) => marker.kind)));

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={DEFAULT_REGION}
        mapType={USE_OSM_TILES ? "none" : "standard"}
        toolbarEnabled={false}
        onMapReady={() => setReady(true)}
      >
        {USE_OSM_TILES ? <UrlTile urlTemplate={OSM_URL} maximumZ={19} /> : null}
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{
              latitude: marker.latitude,
              longitude: marker.longitude,
            }}
            title={marker.title}
            description={marker.description}
            pinColor={PIN_COLOR[marker.kind]}
          />
        ))}
      </MapView>

      <View style={styles.legend}>
        {kinds.map((kind) => (
          <View key={kind} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: PIN_COLOR[kind] }]} />
            <Text style={styles.legendText}>{KIND_LABEL[kind]}</Text>
          </View>
        ))}
      </View>

      {USE_OSM_TILES ? (
        <Text style={styles.attribution}>© OpenStreetMap</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.md,
    overflow: "hidden",
    backgroundColor: colors.border,
    ...shadows.card,
  },
  legend: {
    position: "absolute",
    left: spacing.sm,
    bottom: spacing.sm,
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: font.sm, fontWeight: "600", color: colors.text },
  attribution: {
    position: "absolute",
    right: spacing.sm,
    bottom: spacing.xs,
    fontSize: 10,
    color: colors.text,
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingHorizontal: spacing.xs,
  },
});
