import type { ReactNode } from "react";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { colors, radius, shadows, spacing } from "../theme/theme";

type Props = { children: ReactNode; style?: StyleProp<ViewStyle>; highlighted?: boolean };

export function Card({ children, style, highlighted }: Props) {
  return <View style={[styles.card, highlighted && styles.highlighted, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadows.card,
  },
  highlighted: { borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primarySoft },
});