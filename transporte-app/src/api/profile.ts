import { request } from "./client";
import { mediaUrl } from "./media";

export async function uploadPhoto(token: string, dataUrl: string): Promise<string | null> {
  const raw = await request<{ fotoUrl: string }>("/perfil/foto", {
    method: "PUT",
    token,
    body: { imagen: dataUrl },
  });
  return mediaUrl(raw.fotoUrl);
}

export async function removePhoto(token: string) {
  await request("/perfil/foto", { method: "DELETE", token });
}