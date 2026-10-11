import { Router } from "express";
import { prisma } from "../db";
import { autenticar, requiereRol } from "../middleware/auth";
import { EstadoViaje } from "../generated/prisma/client";
import { emitirUsuario, emitirStaff } from "../socket";
import { avisarCantidad } from "../conductores";

const router = Router();
router.use(autenticar, requiereRol("CONDUCTOR"));

router.patch("/estado", async (req, res) => {
  if (typeof req.body?.conectado !== "boolean") {
    res.status(400).json({ error: "Falta el campo conectado (true o false)" });
    return;
  }

  // El servidor también comprueba esto: la app puede tener la lista de viajes desactualizada
  if (!req.body.conectado) {
    const asignados = await prisma.viaje.count({
      where: {
        conductor: { usuarioId: req.usuario!.id },
        estado: { in: [EstadoViaje.ASIGNADO, EstadoViaje.EN_CURSO] },
      },
    });
    if (asignados > 0) {
      res.status(409).json({ error: "Termina tus viajes antes de desconectarte" });
      return;
    }
  }

  const conductor = await prisma.conductor.update({
    where: { usuarioId: req.usuario!.id },
    data: { conectado: req.body.conectado },
    select: { id: true, conectado: true },
  });
  emitirStaff("conductor:estado", conductor);
  await avisarCantidad();
  res.json({ conectado: conductor.conectado });
});

router.patch("/ubicacion", async (req, res) => {
  const { latitud, longitud } = req.body ?? {};
  if (
    typeof latitud !== "number" ||
    typeof longitud !== "number" ||
    Math.abs(latitud) > 90 ||
    Math.abs(longitud) > 180
  ) {
    res.status(400).json({ error: "Faltan latitud y longitud válidas" });
    return;
  }
  const conductor = await prisma.conductor.update({
    where: { usuarioId: req.usuario!.id },
    data: { latitud, longitud },
    select: { id: true },
  });

  const datos = { conductorId: conductor.id, latitud, longitud };
  emitirStaff("conductor:ubicacion", datos);

  // Avisar a los usuarios que viajan (o esperan) con este conductor
  const viajes = await prisma.viaje.findMany({
    where: {
      conductorId: conductor.id,
      estado: { in: [EstadoViaje.ASIGNADO, EstadoViaje.EN_CURSO] },
    },
    select: { usuarioId: true },
  });
  for (const v of viajes) {
    emitirUsuario(v.usuarioId, "conductor:ubicacion", datos);
  }
  res.json({ ok: true });
});

router.get("/viajes", async (req, res) => {
  const viajes = await prisma.viaje.findMany({
    where: {
      conductor: { usuarioId: req.usuario!.id },
      estado: { in: [EstadoViaje.ASIGNADO, EstadoViaje.EN_CURSO] },
    },
    orderBy: { creadoEn: "asc" },
    include: { usuario: { select: { nombre: true, telefono: true, fotoUrl: true } } },
  });
  res.json(viajes);
});

router.get("/yo", async (req, res) => {
  const conductor = await prisma.conductor.findUnique({
    where: { usuarioId: req.usuario!.id },
    select: { conectado: true, placa: true, unidad: true },
  });
  res.json(conductor);
});

export default router;