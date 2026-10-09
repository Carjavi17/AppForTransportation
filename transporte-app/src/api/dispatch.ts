import { request } from "./client";
import { mapAvailableDriver, mapDispatcherTrip } from "./mappers";
import type { AvailableDriver, DispatcherTrip } from "./types";

export async function fetchActiveTrips(token: string): Promise<DispatcherTrip[]> {
  const raw = await request<any[]>("/viajes/activos", { token });
  return raw.map(mapDispatcherTrip);
}

export async function fetchAvailableDrivers(token: string): Promise<AvailableDriver[]> {
  const raw = await request<any[]>("/viajes/conductores-disponibles", { token });
  return raw.map(mapAvailableDriver);
}

export async function assignTrip(token: string, tripId: number, driverId: number) {
  await request(`/viajes/${tripId}/asignar`, { method: "PATCH", token, body: { conductorId: driverId } });
}

export async function unassignTrip(token: string, tripId: number) {
  await request(`/viajes/${tripId}/desasignar`, { method: "PATCH", token });
}