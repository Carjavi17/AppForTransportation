import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../db";
import { Rol } from "../generated/prisma/client";

export interface UsuarioToken {
  id: number;
  rol: Rol;
}

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioToken;
    }
  }
}

export async function autenticar(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Falta el token" });
    return;
  }
  let datos: UsuarioToken;
  try {
    datos = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as UsuarioToken;
  } catch {
    res.status(401).json({ error: "Token inválido o vencido" });
    return;
  }
  const u = await prisma.usuario.findUnique({
    where: { id: datos.id },
    select: { activo: true, rol: true },
  });
  if (!u || !u.activo) {
    res.status(401).json({ error: "Cuenta desactivada o inexistente" });
    return;
  }
  req.usuario = { id: datos.id, rol: u.rol };
  next();
}

export function requiereRol(...roles: Rol[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.usuario || !roles.includes(req.usuario.rol)) {
      res.status(403).json({ error: "No tienes permiso para esto" });
      return;
    }
    next();
  };
}