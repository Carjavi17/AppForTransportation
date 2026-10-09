import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { colors, spacing } from "../theme/theme";
import { Avatar } from "./Avatar";

export function HeaderActions() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  return (
    <View style={styles.row}>
      {user ? (
        <Pressable onPress={() => router.push("/profile")} hitSlop={8}>
          <Avatar name={user.name} photoUrl={user.photoUrl} size={40} />
        </Pressable>
      ) : null}
      <Pressable onPress={signOut} hitSlop={10}>
        <Ionicons name="log-out-outline" size={26} color={colors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
});