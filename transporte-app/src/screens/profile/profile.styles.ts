import { StyleSheet } from "react-native";
import { colors, font, spacing } from "../../theme/theme";

export const styles = StyleSheet.create({
  card: { alignItems: "center", gap: spacing.md },
  name: { fontSize: font.xl, fontWeight: "800", color: colors.text },
  phone: { fontSize: font.md, color: colors.textMuted },
});