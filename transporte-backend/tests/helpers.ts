import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { crearApp } from "../src/app";
import { prisma } from "../src/db";

export const app = crearApp();

type Role = "USUARIO" | "CONDUCTOR" | "CONTROLADOR" | "ADMINISTRADOR";

export async function resetDb() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Viaje", "Conductor", "Usuario" RESTART IDENTITY CASCADE');
}

export async function createUser(role: Role, phone: string, options: { password?: string; active?: boolean } = {}) {
  return prisma.usuario.create({
    data: {
      nombre: `Test ${role}`,
      telefono: phone,
      password: bcrypt.hashSync(options.password ?? "secreto1", 4),
      rol: role,
      activo: options.active ?? true,
    },
  });
}

export async function createDriver(phone: string, plate: string, connected = true) {
  const user = await prisma.usuario.create({
    data: {
      nombre: `Conductor ${plate}`,
      telefono: phone,
      password: bcrypt.hashSync("secreto1", 4),
      rol: "CONDUCTOR",
      conductor: { create: { placa: plate, conectado: connected } },
    },
    include: { conductor: true },
  });
  return { user, driverId: user.conductor!.id };
}

export function authHeader(user: { id: number; rol: string }) {
  return { Authorization: `Bearer ${jwt.sign({ id: user.id, rol: user.rol }, process.env.JWT_SECRET!)}` };
}

export const validTrip = {
  latitud: 8.89,
  longitud: -64.25,
  pasajeros: 2,
  estudiantes: 1,
  tipoPago: "EFECTIVO",
};