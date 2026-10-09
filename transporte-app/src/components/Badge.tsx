import { StyleSheet, Text, View } from "react-native";
import { colors, font, radius, spacing } from "../theme/theme";

type Tone = "primary" | "success" | "warning" | "danger" | "info" | "neutral";

const TONES = {
  primary: { background: colors.primarySoft, color: colors.primary },
  success: { background: colors.successSoft, color: colors.success },
  warning: { background: colors.warningSoft, color: colors.warning },
  danger: { background: colors.dangerSoft, color: colors.danger },
  info: { background: colors.infoSoft, color: colors.info },
  neutral: { background: colors.border, color: colors.textMuted },
} as const;

export function Badge({
  label,
  tone = "primary",
}: {
  label: string;
  tone?: Tone;
}) {
  const config = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: config.background }]}>
      <Text style={[styles.label, { color: config.color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  label: { fontSize: font.sm, fontWeight: "700" },
});
