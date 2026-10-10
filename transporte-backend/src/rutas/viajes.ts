import { Router, Request } from "express";
import { prisma } from "../db";
import { autenticar, requiereRol } from "../middleware/auth";
import { EstadoViaje, Prisma, TipoPago } from "../generated/prisma/client";
import { emitirUsuario, emitirStaff } from "../socket";
import { contarConectados } from "../conductores";

const router = Router();
router.use(autenticar);

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

// Bloquea la fila del viaje: dos peticiones sobre el mismo viaje se ejecutan una tras otra
async function bloquearViaje(tx: Prisma.TransactionClient, id: number) {
  await tx.$queryRaw`SELECT id FROM "Viaje" WHERE id = ${id} FOR UPDATE`;
}

type Fallo = { ok: false; codigo: number; error: string };

function fallo(codigo: number, error: string): Fallo {
  return { ok: false, codigo, error };
}

// Cantidad de conductores conectados (la ven todos los perfiles)
router.get("/conectados", async (_req, res) => {
  res.json({ conectados: await contarConectados() });
});

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

  const usuarioId = req.usuario!.id;
  const viaje = await prisma.$transaction(async (tx) => {
    // Bloquea al pasajero: dos pedidos suyos a la vez se ejecutan uno tras otro
    await tx.$queryRaw`SELECT id FROM "Usuario" WHERE id = ${usuarioId} FOR UPDATE`;
    const activo = await tx.viaje.findFirst({ where: { usuarioId, estado: { in: ACTIVOS } } });
    if (activo) return null;
    return tx.viaje.create({
      data: {
        usuarioId,
        latitudOrigen: latitud,
        longitudOrigen: longitud,
        referenciaOrigen: referencia ? String(referencia).trim().slice(0, 200) : null,
        pasajeros: n,
        estudiantes: numEstudiantes,
        tipoPago,
        referenciaPago: tipoPago === "PAGO_MOVIL" && referenciaLimpia ? referenciaLimpia : null,
      },
      include: { usuario: datosUsuario },
    });
  });

  if (!viaje) {
    res.status(409).json({ error: "Ya tienes un viaje en curso" });
    return;
  }
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

// USUARIO: ver su último viaje completado (últimas 24 horas), para pagos pendientes
router.get("/ultimo-completado", requiereRol("USUARIO"), async (req, res) => {
  const desde = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const viaje = await prisma.viaje.findFirst({
    where: { usuarioId: req.usuario!.id, estado: EstadoViaje.COMPLETADO, actualizadoEn: { gte: desde } },
    orderBy: { actualizadoEn: "desc" },
  });
  res.json(viaje);
});

// USUARIO: cancelar su viaje
router.patch("/:id/cancelar", requiereRol("USUARIO"), async (req, res) => {
  const id = idDe(req);
  if (!id) {
    res.status(404).json({ error: "Viaje no encontrado" });
    return;
  }
  const resultado = await prisma.$transaction(async (tx) => {
    await bloquearViaje(tx, id);
    const viaje = await tx.viaje.findUnique({ where: { id }, include: { conductor: true } });
    if (!viaje || viaje.usuarioId !== req.usuario!.id) {
      return fallo(404, "Viaje no encontrado");
    }
    if (viaje.estado !== EstadoViaje.SOLICITADO && viaje.estado !== EstadoViaje.ASIGNADO) {
      return fallo(409, "Este viaje ya no se puede cancelar");
    }
    const actualizado = await tx.viaje.update({ where: { id }, data: { estado: EstadoViaje.CANCELADO } });
    return { ok: true as const, viaje, actualizado };
  });

  if (!resultado.ok) {
    res.status(resultado.codigo).json({ error: resultado.error });
    return;
  }
  const { viaje, actualizado } = resultado;
  emitirStaff("viaje:actualizado", actualizado);
  if (viaje.conductor) emitirUsuario(viaje.conductor.usuarioId, "viaje:cancelado", actualizado);
  res.json(actualizado);
});

// USUARIO: enviar o corregir la referencia del pago móvil
router.patch("/:id/pago", requiereRol("USUARIO"), async (req, res) => {
  const id = idDe(req);
  const referencia = String(req.body?.referenciaPago ?? "").trim();
  if (!referencia || referencia.length > 30) {
    res.status(400).json({ error: "Escribe el número de referencia (máximo 30 caracteres)" });
    return;
  }
  if (!id) {
    res.status(404).json({ error: "Viaje no encontrado" });
    return;
  }
  const resultado = await prisma.$transaction(async (tx) => {
    await bloquearViaje(tx, id);
    const viaje = await tx.viaje.findUnique({ where: { id }, include: { conductor: true } });
    if (!viaje || viaje.usuarioId !== req.usuario!.id) {
      return fallo(404, "Viaje no encontrado");
    }
    const reciente =
      viaje.estado === EstadoViaje.COMPLETADO &&
      Date.now() - viaje.actualizadoEn.getTime() < 24 * 60 * 60 * 1000;
    if (!ACTIVOS.includes(viaje.estado) && !reciente) {
      return fallo(409, "Este viaje ya no admite cambios de pago");
    }
    const actualizado = await tx.viaje.update({
      where: { id },
      data: { tipoPago: TipoPago.PAGO_MOVIL, referenciaPago: referencia },
      include: { usuario: datosUsuario, conductor: datosConductor },
    });
    return { ok: true as const, viaje, actualizado };
  });

  if (!resultado.ok) {
    res.status(resultado.codigo).json({ error: resultado.error });
    return;
  }
  const { viaje, actualizado } = resultado;
  if (viaje.conductor) emitirUsuario(viaje.conductor.usuarioId, "viaje:pago", actualizado);
  emitirStaff("viaje:actualizado", actualizado);
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
  if (!id) {
    res.status(404).json({ error: "Viaje no encontrado" });
    return;
  }

  const resultado = await prisma.$transaction(async (tx) => {
    await bloquearViaje(tx, id);
    const viaje = await tx.viaje.findUnique({ where: { id }, include: { conductor: true } });
    if (!viaje) return fallo(404, "Viaje no encontrado");
    if (!ACTIVOS.includes(viaje.estado)) return fallo(409, "Este viaje ya no se puede asignar");

    const conductor = Number.isInteger(conductorId)
      ? await tx.conductor.findUnique({ where: { id: conductorId } })
      : null;
    if (!conductor || !conductor.conectado) {
      return fallo(400, "El conductor no existe o no está conectado");
    }
    if (viaje.conductor && viaje.conductor.id === conductor.id) {
      return fallo(409, "Este viaje ya está con ese conductor");
    }

    const actualizado = await tx.viaje.update({
      where: { id },
      data: { conductorId: conductor.id, estado: EstadoViaje.ASIGNADO },
      include: { usuario: datosUsuario, conductor: datosConductor },
    });
    return { ok: true as const, viaje, conductor, actualizado };
  });

  if (!resultado.ok) {
    res.status(resultado.codigo).json({ error: resultado.error });
    return;
  }
  const { viaje, conductor, actualizado } = resultado;
  if (viaje.conductor && viaje.conductor.id !== conductor.id) {
    emitirUsuario(viaje.conductor.usuarioId, "viaje:cancelado", actualizado);
  }
  emitirUsuario(actualizado.usuarioId, "viaje:asignado", actualizado);
  emitirUsuario(conductor.usuarioId, "viaje:asignado", actualizado);
  emitirStaff("viaje:actualizado", actualizado);
  res.json(actualizado);
});

// CONTROLADOR / ADMINISTRADOR: quitar el conductor y devolver el viaje a solicitudes
router.patch("/:id/desasignar", requiereRol("CONTROLADOR", "ADMINISTRADOR"), async (req, res) => {
  const id = idDe(req);
  if (!id) {
    res.status(404).json({ error: "Viaje no encontrado" });
    return;
  }
  const resultado = await prisma.$transaction(async (tx) => {
    await bloquearViaje(tx, id);
    const viaje = await tx.viaje.findUnique({ where: { id }, include: { conductor: true } });
    if (!viaje) return fallo(404, "Viaje no encontrado");
    if (!viaje.conductor || (viaje.estado !== EstadoViaje.ASIGNADO && viaje.estado !== EstadoViaje.EN_CURSO)) {
      return fallo(409, "Este viaje no tiene conductor asignado");
    }
    const actualizado = await tx.viaje.update({
      where: { id },
      data: { conductorId: null, estado: EstadoViaje.SOLICITADO },
      include: { usuario: datosUsuario, conductor: datosConductor },
    });
    return { ok: true as const, conductor: viaje.conductor, actualizado };
  });

  if (!resultado.ok) {
    res.status(resultado.codigo).json({ error: resultado.error });
    return;
  }
  const { conductor, actualizado } = resultado;
  emitirUsuario(conductor.usuarioId, "viaje:cancelado", actualizado);
  emitirUsuario(actualizado.usuarioId, "viaje:actualizado", actualizado);
  emitirStaff("viaje:actualizado", actualizado);
  res.json(actualizado);
});

// CONDUCTOR: iniciar o terminar un viaje asignado a él
router.patch("/:id/estado", requiereRol("CONDUCTOR"), async (req, res) => {
  const id = idDe(req);
  if (!id) {
    res.status(404).json({ error: "Viaje no encontrado" });
    return;
  }
  const resultado = await prisma.$transaction(async (tx) => {
    await bloquearViaje(tx, id);
    const viaje = await tx.viaje.findUnique({ where: { id }, include: { conductor: true } });
    if (!viaje || viaje.conductor?.usuarioId !== req.usuario!.id) {
      return fallo(404, "Viaje no encontrado");
    }
    const siguiente: Partial<Record<EstadoViaje, EstadoViaje>> = {
      [EstadoViaje.ASIGNADO]: EstadoViaje.EN_CURSO,
      [EstadoViaje.EN_CURSO]: EstadoViaje.COMPLETADO,
    };
    if (siguiente[viaje.estado] !== req.body?.estado) {
      return fallo(409, "Cambio de estado no permitido");
    }
    const actualizado = await tx.viaje.update({ where: { id }, data: { estado: req.body.estado } });
    return { ok: true as const, viaje, actualizado };
  });

  if (!resultado.ok) {
    res.status(resultado.codigo).json({ error: resultado.error });
    return;
  }
  const { viaje, actualizado } = resultado;
  emitirUsuario(viaje.usuarioId, "viaje:actualizado", actualizado);
  emitirStaff("viaje:actualizado", actualizado);
  res.json(actualizado);
});

export default router;