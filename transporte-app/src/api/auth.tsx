import { request } from "./client";
import { mapUser } from "./mappers";
import type { User } from "./types";

export type Session = { token: string; user: User };

export async function login(phone: string, password: string): Promise<Session> {
  const raw = await request<any>("/auth/login", {
    method: "POST",
    body: { telefono: phone, password },
  });
  return { token: raw.token, user: mapUser(raw.usuario) };
}

export async function register(
  name: string,
  phone: string,
  password: string,
): Promise<Session> {
  const raw = await request<any>("/auth/registro", {
    method: "POST",
    body: { nombre: name, telefono: phone, password },
  });
  return { token: raw.token, user: mapUser(raw.usuario) };
}

export async function fetchCurrentUser(token: string): Promise<User> {
  return mapUser(await request<any>("/auth/yo", { token }));
}
