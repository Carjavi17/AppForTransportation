import path from "path";
import express from "express";
import cors from "cors";
import { prisma } from "./db";
import authRutas from "./rutas/auth";
import adminRutas from "./rutas/admin";
import viajesRutas from "./rutas/viajes";
import conductorRutas from "./rutas/conductor";
import perfilRutas from "./rutas/profile";

export function crearApp() {
  const app = express();
  app.set("trust proxy", 1);
  app.use(cors());
  app.use(express.json({ limit: "5mb" }));
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  app.get("/", (_req, res) => {
    res.json({ ok: true, mensaje: "API de transporte funcionando" });
  });

  // Para que Render sepa si el backend está vivo y puede hablar con la base de datos
  app.get("/health", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ ok: true });
    } catch (error) {
      console.error("Health check falló:", error);
      res.status(503).json({ ok: false, error: "Base de datos no disponible" });
    }
  });

  app.use("/auth", authRutas);
  app.use("/admin", adminRutas);
  app.use("/viajes", viajesRutas);
  app.use("/conductor", conductorRutas);
  app.use("/perfil", perfilRutas);

  app.use((_req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" });
  });

  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Error interno del servidor" });
  });

  return app;
}