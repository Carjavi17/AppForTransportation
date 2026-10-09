import { request } from "./client";
import { mapDriverTrip, statusToApi } from "./mappers";
import type { DriverTrip, TripStatus } from "./types";

export type DriverProfile = { connected: boolean; plate: string; unit: string | null };

export async function fetchDriverProfile(token: string): Promise<DriverProfile> {
  const raw = await request<any>("/conductor/yo", { token });
  return { connected: raw.conectado, plate: raw.placa, unit: raw.unidad ?? null };
}

export async function updateConnection(token: string, connected: boolean): Promise<boolean> {
  const raw = await request<{ conectado: boolean }>("/conductor/estado", {
    method: "PATCH",
    token,
    body: { conectado: connected },
  });
  return raw.conectado;
}

export async function sendLocation(token: string, latitude: number, longitude: number) {
  await request("/conductor/ubicacion", {
    method: "PATCH",
    token,
    body: { latitud: latitude, longitud: longitude },
  });
}

export async function fetchDriverTrips(token: string): Promise<DriverTrip[]> {
  const raw = await request<any[]>("/conductor/viajes", { token });
  return raw.map(mapDriverTrip);
}

export async function advanceTrip(token: string, tripId: number, next: TripStatus) {
  await request(`/viajes/${tripId}/estado`, {
    method: "PATCH",
    token,
    body: { estado: statusToApi(next) },
  });
}