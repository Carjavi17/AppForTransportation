import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";
import { Avatar } from "../../components/Avatar";
import { Badge } from "../../components/Badge";
import { Banner } from "../../components/Banner";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { GradientHeader } from "../../components/GradientHeader";
import { Screen } from "../../components/Screen";
import { useAuth } from "../../context/AuthContext";
import { colors } from "../../theme/theme";
import { ROLE_LABEL } from "../../utils/labels";
import { styles } from "./home.styles";
import DriverHomeScreen from "../driver/DriverHomeScreen";
import PassengerHomeScreen from "../passenger/PassengerHomeScreen";
import AdminHomeScreen from "../admin/AdminHomeScreen";
import DispatcherHomeScreen from "../dispatcher/DispatcherHomeScreen";

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  if (!user) return null;

  if (user.role === "PASSENGER") return <PassengerHomeScreen />;
  if (user.role === "DRIVER") return <DriverHomeScreen />;
  if (user.role === "DISPATCHER") return <DispatcherHomeScreen />;
  if (user.role === "ADMIN") return <AdminHomeScreen />;

  return (
    <Screen
      header={
        <GradientHeader
          title={`Hola, ${user.name}`}
          subtitle="Bienvenido a la app"
          right={
            <Pressable onPress={signOut} hitSlop={10}>
              <Ionicons name="log-out-outline" size={26} color={colors.white} />
            </Pressable>
          }
        />
      }
    >
      <Card style={styles.profile}>
        <Avatar name={user.name} photoUrl={user.photoUrl} size={56} />
        <View style={styles.info}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.phone}>{user.phone}</Text>
          <Badge label={ROLE_LABEL[user.role]} />
        </View>
      </Card>
      <Banner
        tone="info"
        message="Las pantallas de cada perfil se están migrando al nuevo diseño."
      />
      <Button
        label="Cerrar sesión"
        variant="secondary"
        icon="log-out-outline"
        onPress={signOut}
      />
    </Screen>
  );
}
