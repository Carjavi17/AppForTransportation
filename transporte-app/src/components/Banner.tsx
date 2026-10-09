import Ionicons from "@expo/vector-icons/Ionicons";
import { StyleSheet, Text, View } from "react-native";
import { colors, font, radius, spacing } from "../theme/theme";

type Tone = "success" | "error" | "info" | "warning";

const TONES = {
  success: {
    background: colors.successSoft,
    color: colors.success,
    icon: "checkmark-circle",
  },
  error: {
    background: colors.dangerSoft,
    color: colors.danger,
    icon: "alert-circle",
  },
  info: {
    background: colors.infoSoft,
    color: colors.info,
    icon: "information-circle",
  },
  warning: {
    background: colors.warningSoft,
    color: colors.warning,
    icon: "warning",
  },
} as const;

export function Banner({ tone, message }: { tone: Tone; message: string }) {
  const config = TONES[tone];
  return (
    <View style={[styles.banner, { backgroundColor: config.background }]}>
      <Ionicons name={config.icon} size={22} color={config.color} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  message: { flex: 1, fontSize: font.md, color: colors.text },
});
