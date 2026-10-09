import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import type { ComponentProps } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  colors,
  font,
  gradients,
  radius,
  shadows,
  spacing,
} from "../theme/theme";

type IconName = ComponentProps<typeof Ionicons>["name"];
type Variant = "primary" | "danger" | "secondary" | "soft";

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
};

const VARIANTS = {
  primary: { text: colors.white, gradient: gradients.primary },
  danger: { text: colors.white, gradient: gradients.danger },
  secondary: {
    text: colors.primary,
    background: colors.surface,
    border: colors.primary,
  },
  soft: {
    text: colors.primary,
    background: colors.primarySoft,
    border: "transparent",
  },
} as const;

export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  loading,
  disabled,
}: Props) {
  const config = VARIANTS[variant];
  const inactive = disabled || loading;

  const content = loading ? (
    <ActivityIndicator color={config.text} />
  ) : (
    <View style={styles.row}>
      {icon ? <Ionicons name={icon} size={20} color={config.text} /> : null}
      <Text style={[styles.label, { color: config.text }]}>{label}</Text>
    </View>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        "gradient" in config && shadows.button,
        inactive && styles.inactive,
        pressed && styles.pressed,
      ]}
    >
      {"gradient" in config ? (
        <LinearGradient
          colors={config.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fill}
        >
          {content}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.fill,
            {
              backgroundColor: config.background,
              borderColor: config.border,
              borderWidth: 1.5,
            },
          ]}
        >
          {content}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.md },
  fill: {
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  label: { fontSize: font.lg, fontWeight: "700" },
  inactive: { opacity: 0.5 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
});
