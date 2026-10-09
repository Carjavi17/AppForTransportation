import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, font, shadows, spacing } from "../theme/theme";

type IconName = ComponentProps<typeof Ionicons>["name"];
type Tab<T extends string> = { value: T; label: string; icon: IconName };
type Props<T extends string> = { tabs: Tab<T>[]; value: T; onChange: (value: T) => void };

export function BottomTabs<T extends string>({ tabs, value, onChange }: Props<T>) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + spacing.sm }]}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        const color = active ? colors.primary : colors.textMuted;
        return (
          <Pressable key={tab.value} style={styles.tab} onPress={() => onChange(tab.value)}>
            <Ionicons name={tab.icon} size={24} color={color} />
            <Text style={[styles.label, { color }]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    paddingTop: spacing.sm,
        ...shadows.tabBar,
  },
  tab: { flex: 1, alignItems: "center", gap: 2, paddingVertical: spacing.xs },
  label: { fontSize: font.sm, fontWeight: "700" },
});