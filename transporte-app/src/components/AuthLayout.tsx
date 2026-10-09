import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, font, gradients, radius, spacing } from "../theme/theme";

const logo = require("../assets/images/logo.jpg");

type Props = { title: string; subtitle: string; children: ReactNode };

export function AuthLayout({ title, subtitle, children }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <LinearGradient
        colors={gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + spacing.xxl }]}
      >
        <Image source={logo} style={styles.logo} resizeMode="contain" />

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </LinearGradient>

      <ScrollView
        style={styles.sheet}
        contentContainerStyle={styles.sheetContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primary },
  hero: {
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl + radius.lg,
    gap: spacing.sm,
  },
  logo: { width: 150, height: 150, marginBottom: spacing.sm },
  title: { fontSize: font.xxl, fontWeight: "800", color: colors.white },
  subtitle: {
    fontSize: font.md,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
  },
  sheet: {
    flex: 1,
    marginTop: -radius.lg,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  sheetContent: { padding: spacing.xl, gap: spacing.lg },
});
