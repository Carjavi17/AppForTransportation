import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../src/db";

async function main() {
  const existe = await prisma.usuario.findFirst({ where: { rol: "ADMINISTRADOR" } });
  if (existe) {
    console.log("Ya existe un administrador, no se crea otro");
    return;
  }

  const nombre = process.env.ADMIN_NOMBRE;
  const telefono = process.env.ADMIN_TELEFONO;
  const password = process.env.ADMIN_PASSWORD;
  if (!nombre || !telefono || !password || password.length < 6) {
    console.log("Faltan ADMIN_NOMBRE, ADMIN_TELEFONO o ADMIN_PASSWORD (mínimo 6): no se crea el administrador");
    return;
  }

  await prisma.usuario.create({
    data: { nombre, telefono, password: await bcrypt.hash(password, 10), rol: "ADMINISTRADOR" },
  });
  console.log("Administrador creado");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());