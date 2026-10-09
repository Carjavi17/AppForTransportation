import { Router } from "express";
import fs from "fs";
import path from "path";
import { prisma } from "../db";
import { autenticar } from "../middleware/auth";

const router = Router();
router.use(autenticar);

const CARPETA = path.join(process.cwd(), "uploads", "avatars");
const MAX_BYTES = 3 * 1024 * 1024;

function detectarExtension(buf: Buffer) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  const firmaPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buf.length > 8 && buf.subarray(0, 8).equals(firmaPng)) return "png";
  return null;
}

function borrarArchivo(fotoUrl: string | null | undefined) {
  if (!fotoUrl?.startsWith("/uploads/avatars/")) return;
  fs.promises.unlink(path.join(CARPETA, path.basename(fotoUrl))).catch(() => {});
}

router.put("/foto", async (req, res) => {
  const imagen = String(req.body?.imagen ?? "");
  const base64 = imagen.includes(",") ? imagen.split(",")[1] : imagen;
  const buf = Buffer.from(base64, "base64");
  if (buf.length === 0 || buf.length > MAX_BYTES) {
    res.status(400).json({ error: "La imagen debe pesar menos de 3 MB" });
    return;
  }
  const extension = detectarExtension(buf);
  if (!extension) {
    res.status(400).json({ error: "Solo se aceptan imágenes JPG o PNG" });
    return;
  }

  const id = req.usuario!.id;
  await fs.promises.mkdir(CARPETA, { recursive: true });
  const nombre = `${id}-${Date.now()}.${extension}`;
  await fs.promises.writeFile(path.join(CARPETA, nombre), buf);

  const anterior = await prisma.usuario.findUnique({ where: { id }, select: { fotoUrl: true } });
  const fotoUrl = `/uploads/avatars/${nombre}`;
  await prisma.usuario.update({ where: { id }, data: { fotoUrl } });
  borrarArchivo(anterior?.fotoUrl);

  res.json({ fotoUrl });
});

router.delete("/foto", async (req, res) => {
  const id = req.usuario!.id;
  const anterior = await prisma.usuario.findUnique({ where: { id }, select: { fotoUrl: true } });
  await prisma.usuario.update({ where: { id }, data: { fotoUrl: null } });
  borrarArchivo(anterior?.fotoUrl);
  res.json({ fotoUrl: null });
});

export default router;