import { request } from "./client";
import { mapManagedUser, roleToApi } from "./mappers";
import type { ManagedUser, NewUserInput, UpdateUserInput } from "./types";

export async function fetchUsers(token: string): Promise<ManagedUser[]> {
  const raw = await request<any[]>("/admin/usuarios", { token });
  return raw.map(mapManagedUser);
}

export async function createUser(token: string, input: NewUserInput) {
  await request("/admin/usuarios", {
    method: "POST",
    token,
    body: {
      nombre: input.name,
      telefono: input.phone,
      password: input.password,
      rol: roleToApi(input.role),
      placa: input.plate,
      unidad: input.unit || undefined,
    },
  });
}

export async function updateUser(token: string, userId: number, input: UpdateUserInput) {
  await request(`/admin/usuarios/${userId}`, {
    method: "PATCH",
    token,
    body: { nombre: input.name, telefono: input.phone, placa: input.plate, unidad: input.unit },
  });
}

export async function setUserActive(token: string, userId: number, active: boolean) {
  await request(`/admin/usuarios/${userId}/activo`, { method: "PATCH", token, body: { activo: active } });
}

export async function changePassword(token: string, userId: number, password: string) {
  await request(`/admin/usuarios/${userId}/password`, { method: "PATCH", token, body: { password } });
}