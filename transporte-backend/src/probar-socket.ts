import { io } from "socket.io-client";

const [telefono, password] = process.argv.slice(2);

const res = await fetch("http://localhost:3000/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ telefono, password }),
});
const { token } = (await res.json()) as { token: string };

const socket = io("http://localhost:3000", { auth: { token } });
socket.on("connect", () => console.log("Conectado, esperando eventos..."));
socket.on("connect_error", (e) => console.log("Error:", e.message));
socket.onAny((evento, datos) => console.log(evento, JSON.stringify(datos)));
