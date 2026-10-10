import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { reportUnauthorized } from "../api/client";
import { API_URL } from "../api/config";

type Handlers = Record<string, (data: any) => void>;

export function useSocket(token: string | null, handlers: Handlers, onReconnect?: () => void) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const reconnectRef = useRef(onReconnect);
  reconnectRef.current = onReconnect;
  const names = Object.keys(handlers).join(",");

  useEffect(() => {
    if (!token) return;
    const socket = io(API_URL, { auth: { token }, transports: ["websocket"], reconnectionDelayMax: 10000 });
    let connectedBefore = false;

    socket.on("connect", () => {
      if (connectedBefore) reconnectRef.current?.();
      connectedBefore = true;
    });
    socket.on("connect_error", (error) => {
      if (error.message === "Token inválido" || error.message === "Cuenta desactivada") reportUnauthorized();
    });
    for (const name of names.split(",")) {
      socket.on(name, (data) => handlersRef.current[name]?.(data));
    }
    return () => {
      socket.disconnect();
    };
  }, [token, names]);
}