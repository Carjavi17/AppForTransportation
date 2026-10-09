import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, font, spacing } from "../theme/theme";

type IconName = ComponentProps<typeof Ionicons>["name"];

export function InfoRow({ icon, text }: { icon: IconName; text: string }) {
  return (
    <View style={styles.row}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  text: { flex: 1, fontSize: font.md, color: colors.text },
});