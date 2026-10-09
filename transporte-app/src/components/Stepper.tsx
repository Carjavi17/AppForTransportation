import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, font, radius, spacing } from "../theme/theme";

type Props = { label: string; value: number; min?: number; max?: number; onChange: (value: number) => void };

export function Stepper({ label, value, min = 1, max = 10, onChange }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <Pressable style={styles.button} onPress={() => onChange(Math.max(min, value - 1))}>
          <Ionicons name="remove" size={22} color={colors.primary} />
        </Pressable>
        <Text style={styles.value}>{value}</Text>
        <Pressable style={styles.button} onPress={() => onChange(Math.min(max, value + 1))}>
          <Ionicons name="add" size={22} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { fontSize: font.lg, fontWeight: "600", color: colors.text },
  controls: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  button: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  value: { fontSize: font.xl, fontWeight: "800", color: colors.text, minWidth: 28, textAlign: "center" },
});