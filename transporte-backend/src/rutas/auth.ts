import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../db";
import { autenticar } from "../middleware/auth";

const router = Router();

function crearToken(id: number, rol: string) {
  return jwt.sign({ id, rol }, process.env.JWT_SECRET!, { expiresIn: "30d" });
}

router.post("/registro", async (req, res) => {
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
  res.status(201).json({
    token: crearToken(usuario.id, usuario.rol),
    usuario: { id: usuario.id, nombre: usuario.nombre, telefono: usuario.telefono, rol: usuario.rol, fotoUrl: usuario.fotoUrl },
  });
});

router.post("/login", async (req, res) => {
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
  res.json({
    token: crearToken(usuario.id, usuario.rol),
    usuario: { id: usuario.id, nombre: usuario.nombre, telefono: usuario.telefono, rol: usuario.rol, fotoUrl: usuario.fotoUrl },
  });
});

router.get("/yo", autenticar, async (req, res) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.usuario!.id },
    select: { id: true, nombre: true, telefono: true, rol: true, fotoUrl: true },
  });
  res.json(usuario);
});

export default router;