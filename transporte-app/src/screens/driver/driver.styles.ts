import { StyleSheet } from "react-native";
import { colors, font, radius, shadows, spacing } from "../../theme/theme";

export const styles = StyleSheet.create({
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.md,
    ...shadows.card,
  },
  toggleTexts: { flex: 1, gap: spacing.xs },
  toggleTitle: { fontSize: font.xl, fontWeight: "800", color: colors.white },
  toggleHint: { fontSize: font.md, color: "rgba(255,255,255,0.9)" },
  stats: { flexDirection: "row", gap: spacing.md },
  stat: { flex: 1, alignItems: "center", gap: spacing.xs },
  statValue: { fontSize: font.xxl, fontWeight: "800", color: colors.primary },
  statLabel: { fontSize: font.md, color: colors.textMuted },
  empty: { fontSize: font.md, color: colors.textMuted, textAlign: "center" },
  tripHeader: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  tripInfo: { flex: 1, gap: spacing.xs },
  passengerName: { fontSize: font.lg, fontWeight: "700", color: colors.text },
});