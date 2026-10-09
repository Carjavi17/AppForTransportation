import { StyleSheet } from "react-native";
import { colors, font, spacing } from "../../theme/theme";

export const styles = StyleSheet.create({
  sectionTitle: { fontSize: font.lg, fontWeight: "800", color: colors.text, marginTop: spacing.sm },
  empty: { fontSize: font.md, color: colors.textMuted, textAlign: "center" },
  hint: { fontSize: font.sm, color: colors.textMuted, textAlign: "center" },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  headerInfo: { flex: 1, gap: spacing.xs },
  name: { fontSize: font.lg, fontWeight: "700", color: colors.text },
});