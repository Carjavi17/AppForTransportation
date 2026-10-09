import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { prisma } from "./db";
import type { UsuarioToken } from "./middleware/auth";

let io: Server | null = null;

export function iniciarSocket(servidor: HttpServer) {
  io = new Server(servidor, { cors: { origin: "*" } });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const datos = jwt.verify(token, process.env.JWT_SECRET!) as UsuarioToken;
      const u = await prisma.usuario.findUnique({
        where: { id: datos.id },
        select: { activo: true, rol: true },
      });
      if (!u || !u.activo) {
        next(new Error("Cuenta desactivada"));
        return;
      }
      socket.data.usuario = { id: datos.id, rol: u.rol };
      next();
    } catch {
      next(new Error("Token inválido"));
    }
  });

  io.on("connection", (socket) => {
    const { id, rol } = socket.data.usuario as UsuarioToken;
    socket.join(`usuario:${id}`);
    if (rol === "CONTROLADOR" || rol === "ADMINISTRADOR") {
      socket.join("staff");
    }
  });
}

export function emitirUsuario(usuarioId: number, evento: string, datos: unknown) {
  io?.to(`usuario:${usuarioId}`).emit(evento, datos);
}

export function emitirStaff(evento: string, datos: unknown) {
  io?.to("staff").emit(evento, datos);
}

export function emitirTodos(evento: string, datos: unknown) {
  io?.emit(evento, datos);
}

export function desconectarUsuario(usuarioId: number) {
  io?.in(`usuario:${usuarioId}`).disconnectSockets(true);
}