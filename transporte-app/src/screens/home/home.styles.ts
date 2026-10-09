import { StyleSheet } from "react-native";
import { colors, font, spacing } from "../../theme/theme";

export const styles = StyleSheet.create({
  profile: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  info: { gap: spacing.xs },
  name: { fontSize: font.lg, fontWeight: "700", color: colors.text },
  phone: { fontSize: font.md, color: colors.textMuted },
});