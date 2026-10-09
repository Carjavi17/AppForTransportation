import { prisma } from "./db";
import { emitirTodos } from "./socket";

export async function contarConectados() {
  return prisma.conductor.count({
    where: { conectado: true, usuario: { activo: true } },
  });
}

export async function avisarCantidad() {
  emitirTodos("conductores:cantidad", { conectados: await contarConectados() });
}