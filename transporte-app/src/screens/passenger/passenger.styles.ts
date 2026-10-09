import { StyleSheet } from "react-native";
import { colors, font, radius, shadows, spacing } from "../../theme/theme";

export const styles = StyleSheet.create({
  paymentBox: { gap: spacing.md },
  paymentLink: { fontSize: font.md, fontWeight: "700", color: colors.primary },
  statusCard: {
    
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius.md,
    ...shadows.card,
    
  },
  statusText: { flex: 1, fontSize: font.xl, fontWeight: "800", color: colors.white },
  sectionTitle: { fontSize: font.lg, fontWeight: "700", color: colors.text },
  driverRow: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  driverInfo: { flex: 1, gap: spacing.xs },
  driverName: { fontSize: font.lg, fontWeight: "700", color: colors.text },
});