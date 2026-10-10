import type { ReactNode } from "react";
import { RefreshControl, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, spacing } from "../theme/theme";
import { ConnectionBanner } from "./ConnectionBanner";

type Props = {
  header?: ReactNode;
  children: ReactNode;
  onRefresh?: () => void;
};

export function Screen({ header, children, onRefresh }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {header}
      <ConnectionBanner />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + spacing.xl },
          !header && { paddingTop: insets.top + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={false} onRefresh={onRefresh} />
          ) : undefined
        }
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, gap: spacing.lg },
});
