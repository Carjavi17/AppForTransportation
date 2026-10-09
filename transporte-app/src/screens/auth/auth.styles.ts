import { StyleSheet } from "react-native";
import { colors, font, spacing } from "../../theme/theme";

export const styles = StyleSheet.create({
  footer: { textAlign: "center", color: colors.textMuted, fontSize: font.md, marginTop: spacing.sm },
  link: { color: colors.primary, fontWeight: "700" },
});