import { Router } from "express";
import { prisma } from "../db";
import { autenticar, requiereRol } from "../middleware/auth";
import { EstadoViaje } from "../generated/prisma/client";
import { emitirUsuario, emitirStaff } from "../socket";

const router = Router();
router.use(autenticar, requiereRol("CONDUCTOR"));

router.patch("/estado", async (req, res) => {
  if (typeof req.body?.conectado !== "boolean") {
    res.status(400).json({ error: "Falta el campo conectado (true o false)" });
    return;
  }
  const conductor = await prisma.conductor.update({
    where: { usuarioId: req.usuario!.id },
    data: { conectado: req.body.conectado },
    select: { id: true, conectado: true },
  });
  emitirStaff("conductor:estado", conductor);
  res.json({ conectado: conductor.conectado });
});

router.patch("/ubicacion", async (req, res) => {
  const { latitud, longitud } = req.body ?? {};
  if (typeof latitud !== "number" || typeof longitud !== "number") {
    res.status(400).json({ error: "Faltan latitud y longitud" });
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

export default router;