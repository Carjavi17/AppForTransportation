import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { rateLimit } from "express-rate-limit";
import { prisma } from "../db";
import { autenticar } from "../middleware/auth";

const router = Router();

const limiteLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo" },
});

const limiteRegistro = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados registros desde este dispositivo. Inténtalo más tarde" },
});

function crearToken(id: number, rol: string) {
  return jwt.sign({ id, rol }, process.env.JWT_SECRET!, { expiresIn: "30d" });
}

function datosPublicos(u: { id: number; nombre: string; telefono: string; rol: string; fotoUrl: string | null }) {
  return { id: u.id, nombre: u.nombre, telefono: u.telefono, rol: u.rol, fotoUrl: u.fotoUrl };
}

router.post("/registro", limiteRegistro, async (req, res) => {
  const { nombre, telefono, password } = req.body ?? {};
  if (!nombre || !telefono || !password || String(password).length < 6) {
    res.status(400).json({ error: "Nombre, teléfono y contraseña (mínimo 6 caracteres) son obligatorios" });
    return;
  }
  const existe = await prisma.usuario.findUnique({ where: { telefono } });
  if (existe) {
    res.status(409).json({ error: "Ese teléfono ya está registrado" });
    return;
  }
  const hash = await bcrypt.hash(String(password), 10);
  const usuario = await prisma.usuario.create({
    data: { nombre, telefono, password: hash },
  });
  res.status(201).json({ token: crearToken(usuario.id, usuario.rol), usuario: datosPublicos(usuario) });
});

router.post("/login", limiteLogin, async (req, res) => {
  const { telefono, password } = req.body ?? {};
  if (!telefono || !password) {
    res.status(400).json({ error: "Teléfono y contraseña son obligatorios" });
    return;
  }
  const usuario = await prisma.usuario.findUnique({ where: { telefono } });
  const valido = usuario && (await bcrypt.compare(String(password), usuario.password));
  if (!usuario || !valido) {
    res.status(401).json({ error: "Teléfono o contraseña incorrectos" });
    return;
  }
  if (!usuario.activo) {
    res.status(403).json({ error: "Tu cuenta está desactivada. Comunícate con la administración" });
    return;
  }
  res.json({ token: crearToken(usuario.id, usuario.rol), usuario: datosPublicos(usuario) });
});

router.get("/yo", autenticar, async (req, res) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.usuario!.id },
    select: { id: true, nombre: true, telefono: true, rol: true, fotoUrl: true },
  });
  res.json(usuario);
});

export default router;