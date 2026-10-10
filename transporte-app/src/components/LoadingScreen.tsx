import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useConnection } from "../hooks/useConnection";
import { colors, font, spacing } from "../theme/theme";

export function LoadingScreen() {
  const online = useConnection();

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      {!online ? (
        <Text style={styles.message}>
          Sin conexión con el servidor. Reintentando…
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  message: { fontSize: font.md, color: colors.textMuted, textAlign: "center" },
});
