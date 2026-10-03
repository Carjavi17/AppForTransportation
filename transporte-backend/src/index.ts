import "dotenv/config";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import authRutas from "./rutas/auth";
import adminRutas from "./rutas/admin";
import viajesRutas from "./rutas/viajes";
import conductorRutas from "./rutas/conductor";
import { iniciarSocket } from "./socket";

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ ok: true, mensaje: "API de transporte funcionando" });
});

app.use("/auth", authRutas);
app.use("/admin", adminRutas);
app.use("/viajes", viajesRutas);
app.use("/conductor", conductorRutas);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

const servidor = createServer(app);
iniciarSocket(servidor);

const PORT = process.env.PORT || 3000;
servidor.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});