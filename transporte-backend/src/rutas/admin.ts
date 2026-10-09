import { Router } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../db";
import { autenticar, requiereRol } from "../middleware/auth";
import { EstadoViaje } from "../generated/prisma/client";
import { emitirStaff, emitirUsuario, desconectarUsuario } from "../socket";
import { avisarCantidad } from "../conductores";

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
      id: true, nombre: true, telefono: true, rol: true, fotoUrl: true, activo: true,
      conductor: { select: { id: true, placa: true, unidad: true, conectado: true } },
    },
    orderBy: { id: "asc" },
  });
  res.json(usuarios);
});

router.patch("/usuarios/:id/activo", async (req, res) => {
  const id = Number(req.params.id);
  const { activo } = req.body ?? {};
  if (!Number.isInteger(id) || typeof activo !== "boolean") {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const usuario = await prisma.usuario.findUnique({ where: { id }, include: { conductor: true } });
  if (!usuario) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }

  if (!activo) {
    if (id === req.usuario!.id) {
      res.status(400).json({ error: "No puedes desactivar tu propia cuenta" });
      return;
    }
    if (usuario.rol === "ADMINISTRADOR") {
      const otros = await prisma.usuario.count({
        where: { rol: "ADMINISTRADOR", activo: true, id: { not: id } },
      });
      if (otros === 0) {
        res.status(409).json({ error: "Debe quedar al menos un administrador activo" });
        return;
      }
    }
    if (usuario.conductor) {
      const asignados = await prisma.viaje.count({
        where: {
          conductorId: usuario.conductor.id,
          estado: { in: [EstadoViaje.ASIGNADO, EstadoViaje.EN_CURSO] },
        },
      });
      if (asignados > 0) {
        res.status(409).json({ error: "Tiene pasajeros asignados. Pásalos a otro conductor o termínalos primero" });
        return;
      }
    }
    const enCurso = await prisma.viaje.count({
      where: { usuarioId: id, estado: EstadoViaje.EN_CURSO },
    });
    if (enCurso > 0) {
      res.status(409).json({ error: "Tiene un viaje en curso" });
      return;
    }

    // Cancelar sus solicitudes pendientes
    const abiertos = await prisma.viaje.findMany({
      where: { usuarioId: id, estado: { in: [EstadoViaje.SOLICITADO, EstadoViaje.ASIGNADO] } },
      include: { conductor: true },
    });
    for (const v of abiertos) {
      const cancelado = await prisma.viaje.update({
        where: { id: v.id },
        data: { estado: EstadoViaje.CANCELADO },
      });
      emitirStaff("viaje:actualizado", cancelado);
      if (v.conductor) emitirUsuario(v.conductor.usuarioId, "viaje:cancelado", cancelado);
    }
  }

  await prisma.usuario.update({ where: { id }, data: { activo } });

  if (!activo && usuario.conductor) {
    await prisma.conductor.update({ where: { id: usuario.conductor.id }, data: { conectado: false } });
    emitirStaff("conductor:estado", { id: usuario.conductor.id, conectado: false });
    await avisarCantidad();
  }
  if (!activo) desconectarUsuario(id);

  res.json({ id, activo });
});

router.patch("/usuarios/:id/password", async (req, res) => {
  const id = Number(req.params.id);
  const { password } = req.body ?? {};
  if (!Number.isInteger(id) || !password || String(password).length < 6) {
    res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres" });
    return;
  }
  const existe = await prisma.usuario.findUnique({ where: { id }, select: { id: true } });
  if (!existe) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }
  await prisma.usuario.update({
    where: { id },
    data: { password: await bcrypt.hash(String(password), 10) },
  });
  res.json({ ok: true });
});

router.patch("/usuarios/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, telefono, placa, unidad } = req.body ?? {};
  if (!Number.isInteger(id)) {
    res.status(400).json({ error: "Datos inválidos" });
    return;
  }
  const usuario = await prisma.usuario.findUnique({ where: { id }, include: { conductor: true } });
  if (!usuario) {
    res.status(404).json({ error: "Usuario no encontrado" });
    return;
  }

  const datos: { nombre?: string; telefono?: string } = {};

  if (nombre !== undefined) {
    if (!String(nombre).trim()) {
      res.status(400).json({ error: "El nombre no puede estar vacío" });
      return;
    }
    datos.nombre = String(nombre).trim();
  }

  if (telefono !== undefined) {
    const tel = String(telefono).trim();
    if (!tel) {
      res.status(400).json({ error: "El teléfono no puede estar vacío" });
      return;
    }
    if (tel !== usuario.telefono) {
      const repetido = await prisma.usuario.findUnique({ where: { telefono: tel } });
      if (repetido) {
        res.status(409).json({ error: "Ese teléfono ya está registrado" });
        return;
      }
    }
    datos.telefono = tel;
  }

  if (usuario.conductor && (placa !== undefined || unidad !== undefined)) {
    if (placa !== undefined && !String(placa).trim()) {
      res.status(400).json({ error: "La placa no puede estar vacía" });
      return;
    }
    await prisma.conductor.update({
      where: { id: usuario.conductor.id },
      data: {
        ...(placa !== undefined ? { placa: String(placa).trim() } : {}),
        ...(unidad !== undefined ? { unidad: String(unidad).trim() || null } : {}),
      },
    });
    emitirStaff("conductor:estado", { id: usuario.conductor.id });
  }

  if (Object.keys(datos).length > 0) {
    await prisma.usuario.update({ where: { id }, data: datos });
  }
  res.json({ ok: true });
});

export default router;