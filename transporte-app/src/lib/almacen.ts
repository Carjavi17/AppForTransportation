import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const almacen = {
  async leer(clave: string) {
    if (Platform.OS === "web") return localStorage.getItem(clave);
    return SecureStore.getItemAsync(clave);
  },
  async guardar(clave: string, valor: string) {
    if (Platform.OS === "web") {
      localStorage.setItem(clave, valor);
      return;
    }
    await SecureStore.setItemAsync(clave, valor);
  },
  async borrar(clave: string) {
    if (Platform.OS === "web") {
      localStorage.removeItem(clave);
      return;
    }
    await SecureStore.deleteItemAsync(clave);
  },
};