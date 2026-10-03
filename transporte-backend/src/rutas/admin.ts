import { Router } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../db";
import { autenticar, requiereRol } from "../middleware/auth";

const router = Router();
router.use(autenticar, requiereRol("ADMINISTRADOR"));

router.post("/usuarios", async (req, res) => {
  const { nombre, telefono, password, rol, placa, unidad } = req.body ?? {};
  const rolesValidos = ["CONDUCTOR", "CONTROLADOR", "ADMINISTRADOR"];

  if (!nombre || !telefono || !password || String(password).length < 6 || !rolesValidos.includes(rol)) {
    res.status(400).json({ error: "Nombre, teléfono, contraseña (mínimo 6) y un rol válido son obligatorios" });
    return;
  }
  if (rol === "CONDUCTOR" && !placa) {
    res.status(400).json({ error: "El conductor necesita una placa" });
    return;
  }
  const existe = await prisma.usuario.findUnique({ where: { telefono } });
  if (existe) {
    res.status(409).json({ error: "Ese teléfono ya está registrado" });
    return;
  }

  const usuario = await prisma.usuario.create({
    data: {
      nombre,
      telefono,
      password: await bcrypt.hash(String(password), 10),
      rol,
      ...(rol === "CONDUCTOR" ? { conductor: { create: { placa, unidad } } } : {}),
    },
    select: { id: true, nombre: true, telefono: true, rol: true },
  });
  res.status(201).json(usuario);
});

router.get("/usuarios", async (_req, res) => {
  const usuarios = await prisma.usuario.findMany({
    select: {
      id: true, nombre: true, telefono: true, rol: true, fotoUrl: true,
      conductor: { select: { id: true, placa: true, unidad: true, conectado: true } },
    },
    orderBy: { id: "asc" },
  });
  res.json(usuarios);
});

export default router;