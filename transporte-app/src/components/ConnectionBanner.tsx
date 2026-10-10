import { StyleSheet, View } from "react-native";
import { useConnection } from "../hooks/useConnection";
import { spacing } from "../theme/theme";
import { Banner } from "./Banner";

export function ConnectionBanner() {
  const online = useConnection();
  if (online) return null;

  return (
    <View style={styles.wrapper}>
      <Banner
        tone="warning"
        message="Sin conexión con el servidor. Reintentando automáticamente…"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
});
