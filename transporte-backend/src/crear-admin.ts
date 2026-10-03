import bcrypt from "bcrypt";
import { prisma } from "./db";

async function main() {
  const [telefono, password] = process.argv.slice(2);
  if (!telefono || !password) {
    console.log("Uso: npx tsx src/crear-admin.ts TELEFONO CONTRASEÑA");
    return;
  }
  await prisma.usuario.create({
    data: {
      nombre: "Administrador",
      telefono,
      password: await bcrypt.hash(password, 10),
      rol: "ADMINISTRADOR",
    },
  });
  console.log("Administrador creado");
}

main().finally(() => prisma.$disconnect());