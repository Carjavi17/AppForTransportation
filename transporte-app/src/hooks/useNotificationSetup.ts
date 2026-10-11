import { useEffect } from "react";
import { setupNotifications } from "../utils/notify";

export function useNotificationSetup() {
  useEffect(() => {
    setupNotifications();
  }, []);
}