import { Router, Request } from "express";
import { prisma } from "../db";
import { autenticar, requiereRol } from "../middleware/auth";
import { EstadoViaje, TipoPago} from "../generated/prisma/client";
import { emitirUsuario, emitirStaff } from "../socket";
import { contarConectados } from "../conductores";


const router = Router();
router.use(autenticar);
router.get("/conectados", async (_req, res) => {
  res.json({ conectados: await contarConectados() });
});

const ACTIVOS: EstadoViaje[] = [EstadoViaje.SOLICITADO, EstadoViaje.ASIGNADO, EstadoViaje.EN_CURSO];

const datosConductor = {
  select: {
    id: true,
    placa: true,
    unidad: true,
    latitud: true,
    longitud: true,
    usuario: { select: { nombre: true, telefono: true, fotoUrl: true } },
  },
} as const;

const datosUsuario = { select: { nombre: true, telefono: true, fotoUrl: true } } as const;

function idDe(req: Request) {
  const id = Number(req.params.id);
  return Number.isInteger(id) ? id : null;
}

// USUARIO: solicitar un viaje
router.post("/", requiereRol("USUARIO"), async (req, res) => {
  const { latitud, longitud, referencia, pasajeros, tipoPago, referenciaPago, estudiantes } = req.body ?? {};
  const n = Number(pasajeros ?? 1);

  if (typeof latitud !== "number" || typeof longitud !== "number") {
    res.status(400).json({ error: "Falta la ubicación (latitud y longitud)" });
    return;
  }
  if (!Number.isInteger(n) || n < 1 || n > 10) {
    res.status(400).json({ error: "La cantidad de pasajeros debe ser entre 1 y 10" });
    return;
  }
  if (!Object.values(TipoPago).includes(tipoPago)) {
    res.status(400).json({ error: "Tipo de pago inválido (EFECTIVO o PAGO_MOVIL)" });
    return;
  }

  const numEstudiantes = Number(estudiantes ?? 0);
  if (!Number.isInteger(numEstudiantes) || numEstudiantes < 0 || numEstudiantes > n) {
    res.status(400).json({ error: "Los estudiantes no pueden ser más que los pasajeros" });
    return;
  }
  const referenciaLimpia = referenciaPago ? String(referenciaPago).trim().slice(0, 30) : "";

  const activo = await prisma.viaje.findFirst({
    where: { usuarioId: req.usuario!.id, estado: { in: ACTIVOS } },
  });
  if (activo) {
    res.status(409).json({ error: "Ya tienes un viaje en curso" });
    return;
  }

  const viaje = await prisma.viaje.create({
    data: {
      usuarioId: req.usuario!.id,
      latitudOrigen: latitud,
      longitudOrigen: longitud,
      referenciaOrigen: referencia ?? null,
      pasajeros: n,
      tipoPago,
      referenciaPago: tipoPago === "PAGO_MOVIL" && referenciaLimpia ? referenciaLimpia : null,
      estudiantes: numEstudiantes,
    },
    include: { usuario: datosUsuario },
  });
  emitirStaff("viaje:nuevo", viaje);
  res.status(201).json(viaje);
});

// USUARIO: ver su viaje activo (con datos del conductor si ya fue asignado)
router.get("/activo", requiereRol("USUARIO"), async (req, res) => {
  const viaje = await prisma.viaje.findFirst({
    where: { usuarioId: req.usuario!.id, estado: { in: ACTIVOS } },
    include: { conductor: datosConductor },
  });
  res.json(viaje);
});

// USUARIO: cancelar su viaje
router.patch("/:id/cancelar", requiereRol("USUARIO"), async (req, res) => {
  const id = idDe(req);
  const viaje = id
    ? await prisma.viaje.findUnique({ where: { id }, include: { conductor: true } })
    : null;
  if (!viaje || viaje.usuarioId !== req.usuario!.id) {
    res.status(404).json({ error: "Viaje no encontrado" });
    return;
  }
  if (viaje.estado !== "SOLICITADO" && viaje.estado !== "ASIGNADO") {
    res.status(409).json({ error: "Este viaje ya no se puede cancelar" });
    return;
  }
  const actualizado = await prisma.viaje.update({
    where: { id: viaje.id },
    data: { estado: EstadoViaje.CANCELADO },
  });
  emitirStaff("viaje:actualizado", actualizado);
  if (viaje.conductor) {
    emitirUsuario(viaje.conductor.usuarioId, "viaje:cancelado", actualizado);
  }
  res.json(actualizado);
});

// CONTROLADOR / ADMINISTRADOR: ver todos los viajes activos
router.get("/activos", requiereRol("CONTROLADOR", "ADMINISTRADOR"), async (_req, res) => {
  const viajes = await prisma.viaje.findMany({
    where: { estado: { in: ACTIVOS } },
    orderBy: { creadoEn: "asc" },
    include: { usuario: datosUsuario, conductor: datosConductor },
  });
  res.json(viajes);
});

// CONTROLADOR / ADMINISTRADOR: ver conductores conectados
router.get("/conductores-disponibles", requiereRol("CONTROLADOR", "ADMINISTRADOR"), async (_req, res) => {
  const conductores = await prisma.conductor.findMany({
    where: { conectado: true },
    select: {
      id: true,
      placa: true,
      unidad: true,
      latitud: true,
      longitud: true,
      usuario: datosUsuario,
      viajes: {
        where: { estado: { in: [EstadoViaje.ASIGNADO, EstadoViaje.EN_CURSO] } },
        select: { id: true, pasajeros: true },
      },
    },
  });
  res.json(conductores);
});

// CONTROLADOR / ADMINISTRADOR: asignar un viaje a un conductor
router.patch("/:id/asignar", requiereRol("CONTROLADOR", "ADMINISTRADOR"), async (req, res) => {
  const id = idDe(req);
  const conductorId = Number(req.body?.conductorId);
  const viaje = id
    ? await prisma.viaje.findUnique({ where: { id }, include: { conductor: true } })
    : null;
  if (!viaje) {
    res.status(404).json({ error: "Viaje no encontrado" });
    return;
  }
  if (!ACTIVOS.includes(viaje.estado)) {
    res.status(409).json({ error: "Este viaje ya no se puede asignar" });
    return;
  }
  const conductor = Number.isInteger(conductorId)
    ? await prisma.conductor.findUnique({ where: { id: conductorId } })
    : null;
  if (!conductor || !conductor.conectado) {
    res.status(400).json({ error: "El conductor no existe o no está conectado" });
    return;
  }
    if (viaje.conductor && viaje.conductor.id === conductor.id) {
    res.status(409).json({ error: "Este viaje ya está con ese conductor" });
    return;
  }
  const actualizado = await prisma.viaje.update({
    where: { id: viaje.id },
    data: { conductorId: conductor.id, estado: EstadoViaje.ASIGNADO },
    include: { usuario: datosUsuario, conductor: datosConductor },
  });

  // Si el viaje cambió de conductor, avisar al anterior
  if (viaje.conductor && viaje.conductor.id !== conductor.id) {
    emitirUsuario(viaje.conductor.usuarioId, "viaje:cancelado", actualizado);
  }
  emitirUsuario(actualizado.usuarioId, "viaje:asignado", actualizado);
  emitirUsuario(conductor.usuarioId, "viaje:asignado", actualizado);
  emitirStaff("viaje:actualizado", actualizado);
  res.json(actualizado);
});

// CONDUCTOR: iniciar o terminar un viaje asignado a él
router.patch("/:id/estado", requiereRol("CONDUCTOR"), async (req, res) => {
  const id = idDe(req);
  const viaje = id
    ? await prisma.viaje.findUnique({ where: { id }, include: { conductor: true } })
    : null;
  if (!viaje || viaje.conductor?.usuarioId !== req.usuario!.id) {
    res.status(404).json({ error: "Viaje no encontrado" });
    return;
  }
  const siguiente: Record<string, string> = { ASIGNADO: "EN_CURSO", EN_CURSO: "COMPLETADO" };
  if (siguiente[viaje.estado] !== req.body?.estado) {
    res.status(409).json({ error: "Cambio de estado no permitido" });
    return;
  }
  const actualizado = await prisma.viaje.update({
    where: { id: viaje.id },
    data: { estado: req.body.estado },
  });
  emitirUsuario(viaje.usuarioId, "viaje:actualizado", actualizado);
  emitirStaff("viaje:actualizado", actualizado);
  res.json(actualizado);
});

// CONTROLADOR / ADMINISTRADOR: quitar el conductor y devolver el viaje a solicitudes
router.patch("/:id/desasignar", requiereRol("CONTROLADOR", "ADMINISTRADOR"), async (req, res) => {
  const id = idDe(req);
  const viaje = id
    ? await prisma.viaje.findUnique({ where: { id }, include: { conductor: true } })
    : null;
  if (!viaje) {
    res.status(404).json({ error: "Viaje no encontrado" });
    return;
  }
  if (!viaje.conductor || (viaje.estado !== "ASIGNADO" && viaje.estado !== "EN_CURSO")) {
    res.status(409).json({ error: "Este viaje no tiene conductor asignado" });
    return;
  }
  const actualizado = await prisma.viaje.update({
    where: { id: viaje.id },
    data: { conductorId: null, estado: EstadoViaje.SOLICITADO },
    include: { usuario: datosUsuario, conductor: datosConductor },
  });
  emitirUsuario(viaje.conductor.usuarioId, "viaje:cancelado", actualizado);
  emitirUsuario(actualizado.usuarioId, "viaje:actualizado", actualizado);
  emitirStaff("viaje:actualizado", actualizado);
  res.json(actualizado);
});

// USUARIO: ver su último viaje completado (últimas 24 horas), para pagos pendientes
router.get("/ultimo-completado", requiereRol("USUARIO"), async (req, res) => {
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const viaje = await prisma.viaje.findFirst({
    where: { usuarioId: req.usuario!.id, estado: EstadoViaje.COMPLETADO, actualizadoEn: { gte: desde } },
    orderBy: { actualizadoEn: "desc" },
  });
  res.json(viaje);
});

// USUARIO: enviar o corregir la referencia del pago móvil
router.patch("/:id/pago", requiereRol("USUARIO"), async (req, res) => {
  const id = idDe(req);
  const referencia = String(req.body?.referenciaPago ?? "").trim();
  if (!referencia || referencia.length > 30) {
    res.status(400).json({ error: "Escribe el número de referencia (máximo 30 caracteres)" });
    return;
  }
  const viaje = id
    ? await prisma.viaje.findUnique({ where: { id }, include: { conductor: true } })
    : null;
  if (!viaje || viaje.usuarioId !== req.usuario!.id) {
    res.status(404).json({ error: "Viaje no encontrado" });
    return;
  }
  const reciente =
    viaje.estado === EstadoViaje.COMPLETADO &&
    Date.now() - viaje.actualizadoEn.getTime() < 24 * 60 * 60 * 1000;
  if (!ACTIVOS.includes(viaje.estado) && !reciente) {
    res.status(409).json({ error: "Este viaje ya no admite cambios de pago" });
    return;
  }
  const actualizado = await prisma.viaje.update({
    where: { id: viaje.id },
    data: { tipoPago: TipoPago.PAGO_MOVIL, referenciaPago: referencia },
    include: { usuario: datosUsuario, conductor: datosConductor },
  });
  if (viaje.conductor) emitirUsuario(viaje.conductor.usuarioId, "viaje:pago", actualizado);
  emitirStaff("viaje:actualizado", actualizado);
  res.json(actualizado);
});

export default router;