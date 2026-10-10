import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useConnection } from "./useConnection";

export function useAutoRefresh(refresh: () => void) {
  const online = useConnection();
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const wasOnline = useRef(online);

  // Refresh when the app returns to the foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshRef.current();
    });
    return () => subscription.remove();
  }, []);

  // Refresh when the connection comes back
  useEffect(() => {
    if (online && !wasOnline.current) refreshRef.current();
    wasOnline.current = online;
  }, [online]);

  // While offline, retry every 15 seconds
  useEffect(() => {
    if (online) return;
    const timer = setInterval(() => refreshRef.current(), 15000);
    return () => clearInterval(timer);
  }, [online]);
}