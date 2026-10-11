import "dotenv/config";
import { createServer } from "http";
import { crearApp } from "./app";
import { prisma } from "./db";
import { iniciarSocket } from "./socket";

const servidor = createServer(crearApp());
iniciarSocket(servidor);

const PORT = Number(process.env.PORT) || 3000;
servidor.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});

// Un rechazo suelto se registra pero no tumba el servidor
process.on("unhandledRejection", (reason) => {
  console.error("unhandledRejection:", reason);
});

// Tras una excepción no controlada el proceso puede quedar en mal estado:
// se registra y se sale para que PM2 o la plataforma lo reinicie limpio
process.on("uncaughtException", (error) => {
  console.error("uncaughtException:", error);
  process.exit(1);
});

// Cierre ordenado cuando la plataforma reinicia o apaga el backend
let cerrando = false;
async function cerrar(senal: string) {
  if (cerrando) return;
  cerrando = true;
  console.log(`${senal} recibido, cerrando...`);

  // Los websockets mantienen conexiones abiertas: si tardan, se fuerza la salida
  const forzar = setTimeout(() => {
    console.error("Cierre forzado");
    process.exit(1);
  }, 10000);
  forzar.unref();

  servidor.close(async () => {
    await prisma.$disconnect().catch(() => {});
    process.exit(0);
  });
}

process.on("SIGTERM", () => cerrar("SIGTERM"));
process.on("SIGINT", () => cerrar("SIGINT"));