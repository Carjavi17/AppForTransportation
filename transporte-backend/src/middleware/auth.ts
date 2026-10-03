import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
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

export function autenticar(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Falta el token" });
    return;
  }
  try {
    const datos = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as UsuarioToken;
    req.usuario = { id: datos.id, rol: datos.rol };
    next();
  } catch {
    res.status(401).json({ error: "Token inválido o vencido" });
  }
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