import { useSyncExternalStore } from "react";
import { getOnline, subscribeConnection } from "../api/client";

export function useConnection() {
  return useSyncExternalStore(subscribeConnection, getOnline);
}