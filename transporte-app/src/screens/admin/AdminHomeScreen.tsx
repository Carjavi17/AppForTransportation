import { useState } from "react";
import { View } from "react-native";
import { BottomTabs } from "../../components/BottomTabs";
import DispatcherHomeScreen from "../dispatcher/DispatcherHomeScreen";
import { styles } from "./admin.styles";
import UsersScreen from "./UsersScreen";

type Tab = "operation" | "users";

export default function AdminHomeScreen() {
  const [tab, setTab] = useState<Tab>("operation");

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {tab === "operation" ? <DispatcherHomeScreen /> : <UsersScreen />}
      </View>
      <BottomTabs
        tabs={[
          { value: "operation", label: "Operación", icon: "bus-outline" },
          { value: "users", label: "Usuarios", icon: "people-outline" },
        ]}
        value={tab}
        onChange={setTab}
      />
    </View>
  );
}
