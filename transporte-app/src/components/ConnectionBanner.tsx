import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useConnection } from "../hooks/useConnection";
import { spacing } from "../theme/theme";
import { Banner } from "./Banner";

type Props = {
  // Pass the value returned by useSocket on screens that use the socket
  socketConnected?: boolean;
};

export function ConnectionBanner({ socketConnected }: Props) {
  const online = useConnection();
  const [socketHasConnected, setSocketHasConnected] = useState(false);

  useEffect(() => {
    if (socketConnected) setSocketHasConnected(true);
  }, [socketConnected]);

  // The socket only counts as down after it has connected at least once,
  // so the banner doesn't flash while the screen is first opening
  const socketDown = socketConnected === false && socketHasConnected;

  if (online && !socketDown) return null;

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
