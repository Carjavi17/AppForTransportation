import { StyleSheet } from "react-native";
import { colors, font, spacing } from "../../theme/theme";

export const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  headerInfo: { flex: 1, gap: spacing.xs },
  dimmed: { opacity: 0.5 },
  name: { fontSize: font.lg, fontWeight: "700", color: colors.text },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg },
  actionLink: { fontSize: font.md, fontWeight: "700", color: colors.primary },
  actionDanger: { fontSize: font.md, fontWeight: "700", color: colors.danger },
  panel: { gap: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  empty: { fontSize: font.md, color: colors.textMuted, textAlign: "center" },
  sectionTitle: { fontSize: font.lg, fontWeight: "800", color: colors.text },
});