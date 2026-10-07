import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { API_URL } from "./config";

type Manejadores = Record<string, (datos: any) => void>;

export function useSocket(token: string | null, manejadores: Manejadores) {
  const ref = useRef(manejadores);
  ref.current = manejadores;
  const nombres = Object.keys(manejadores).join(",");

  useEffect(() => {
    if (!token) return;
    const socket = io(API_URL, { auth: { token }, transports: ["websocket"] });
    for (const nombre of nombres.split(",")) {
      socket.on(nombre, (datos) => ref.current[nombre]?.(datos));
    }
    return () => {
      socket.disconnect();
    };
  }, [token, nombres]);
}