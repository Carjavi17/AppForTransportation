import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const CHANNEL_ID = "trips";

// Cuando la app está abierta, la notificación igual se muestra y suena
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function prepare(): Promise<boolean> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Viajes",
      importance: Notifications.AndroidImportance.HIGH,
      sound: "default",
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

let preparing: Promise<boolean> | null = null;

// Se ejecuta una sola vez; si el permiso fue negado, se vuelve a intentar la próxima vez
export function setupNotifications(): Promise<boolean> {
  if (!preparing) {
    preparing = prepare()
      .then((allowed) => {
        if (!allowed) preparing = null;
        return allowed;
      })
      .catch(() => {
        preparing = null;
        return false;
      });
  }
  return preparing;
}

export async function notify(title: string, body: string) {
  try {
    const allowed = await setupNotifications();
    if (!allowed) return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: "default" },
      trigger: Platform.OS === "android" ? { channelId: CHANNEL_ID } : null,
    });
  } catch {
    // Un fallo en la notificación nunca debe romper la pantalla
  }
}