import Ionicons from "@expo/vector-icons/Ionicons";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, font, spacing } from "../theme/theme";
import { Card } from "./Card";
import type { TripMapProps } from "./mapTypes";

export function TripMap({ markers }: TripMapProps) {
  return (
    <Card>
      <View style={styles.header}>
        <Ionicons name="map-outline" size={22} color={colors.primary} />
        <Text style={styles.title}>El mapa se ve en la app del celular</Text>
      </View>
      {markers.map((marker) => (
        <Pressable
          key={marker.id}
          onPress={() =>
            Linking.openURL(
              `https://www.google.com/maps/search/?api=1&query=${marker.latitude},${marker.longitude}`,
            )
          }
        >
          <Text style={styles.link}>{marker.title} · abrir en Google Maps</Text>
        </Pressable>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  title: { flex: 1, fontSize: font.md, fontWeight: "700", color: colors.text },
  link: { fontSize: font.md, fontWeight: "600", color: colors.primary },
});
