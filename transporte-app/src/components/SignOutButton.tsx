import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable } from "react-native";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme/theme";

export function SignOutButton() {
  const { signOut } = useAuth();
  return (
    <Pressable onPress={signOut} hitSlop={10}>
      <Ionicons name="log-out-outline" size={26} color={colors.white} />
    </Pressable>
  );
}