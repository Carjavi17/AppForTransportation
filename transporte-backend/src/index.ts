import "dotenv/config";
import { createServer } from "http";
import { crearApp } from "./app";
import { iniciarSocket } from "./socket";

const servidor = createServer(crearApp());
iniciarSocket(servidor);

const PORT = process.env.PORT || 3000;
servidor.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});