import { LinearGradient } from "expo-linear-gradient";
import { Image, Text } from "react-native";
import { colors, gradients } from "../theme/theme";
import { getInitials } from "../utils/text";

type Props = { name: string; photoUrl?: string | null; size?: number };

export function Avatar({ name, photoUrl, size = 48 }: Props) {
  const shape = { width: size, height: size, borderRadius: size / 2 };

  if (photoUrl) {
    return <Image source={{ uri: photoUrl }} style={shape} />;
  }
  return (
    <LinearGradient
      colors={gradients.accent}
      style={[shape, { alignItems: "center", justifyContent: "center" }]}
    >
      <Text
        style={{
          color: colors.white,
          fontWeight: "700",
          fontSize: size * 0.38,
        }}
      >
        {getInitials(name)}
      </Text>
    </LinearGradient>
  );
}
