import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { io } from "socket.io-client";
import { reportUnauthorized } from "../api/client";
import { API_URL } from "../api/config";

type Handlers = Record<string, (data: any) => void>;

export function useSocket(token: string | null, handlers: Handlers, onReconnect?: () => void) {
  const [connected, setConnected] = useState(false);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const reconnectRef = useRef(onReconnect);
  reconnectRef.current = onReconnect;
  const names = Object.keys(handlers).join(",");

  useEffect(() => {
    if (!token) {
      setConnected(false);
      return;
    }

    const socket = io(API_URL, { auth: { token }, transports: ["websocket"], reconnectionDelayMax: 10000 });
    let connectedBefore = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    socket.on("connect", () => {
      setConnected(true);
      if (connectedBefore) reconnectRef.current?.();
      connectedBefore = true;
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("connect_error", (error) => {
      if (error.message === "Token inválido" || error.message === "Cuenta desactivada") {
        reportUnauthorized();
        return;
      }
      // Si Socket.IO dejó de reintentar solo (error del middleware del servidor), reintentamos a mano
      if (!socket.active) {
        if (retryTimer) clearTimeout(retryTimer);
        retryTimer = setTimeout(() => socket.connect(), 3000);
      }
    });

    for (const name of names.split(",").filter(Boolean)) {
      socket.on(name, (data) => handlersRef.current[name]?.(data));
    }

    // Al volver la app desde segundo plano, reconectar si el socket quedó caído
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active" && !socket.connected) socket.connect();
    });

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      appStateSub.remove();
      socket.removeAllListeners();
      socket.disconnect();
      setConnected(false);
    };
  }, [token, names]);

  return connected;
}