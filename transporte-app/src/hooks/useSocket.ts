import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { API_URL } from "../api/config";

type Handlers = Record<string, (data: any) => void>;

export function useSocket(token: string | null, handlers: Handlers) {
  const ref = useRef(handlers);
  ref.current = handlers;
  const names = Object.keys(handlers).join(",");

  useEffect(() => {
    if (!token) return;
    const socket = io(API_URL, { auth: { token }, transports: ["websocket"] });
    for (const name of names.split(",")) {
      socket.on(name, (data) => ref.current[name]?.(data));
    }
    return () => {
      socket.disconnect();
    };
  }, [token, names]);
}