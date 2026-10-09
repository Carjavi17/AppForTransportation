import { request } from "./client";
import { mapPassengerTrip, paymentToApi } from "./mappers";
import type { NewTripInput, PassengerTrip } from "./types";

export async function fetchActiveTrip(token: string): Promise<PassengerTrip | null> {
  const raw = await request<any>("/viajes/activo", { token });
  return raw ? mapPassengerTrip(raw) : null;
}

export async function fetchLastCompletedTrip(token: string): Promise<PassengerTrip | null> {
  const raw = await request<any>("/viajes/ultimo-completado", { token });
  return raw ? mapPassengerTrip(raw) : null;
}

export async function requestTrip(token: string, input: NewTripInput) {
  await request("/viajes", {
    method: "POST",
    token,
    body: {
      latitud: input.latitude,
      longitud: input.longitude,
      referencia: input.reference || undefined,
      pasajeros: input.passengers,
      tipoPago: paymentToApi(input.paymentType),
      referenciaPago: input.paymentType === "MOBILE_PAYMENT" ? input.paymentReference || undefined : undefined,
      estudiantes: input.students,
    },
  });
}

export async function sendPaymentReference(token: string, tripId: number, reference: string) {
  await request(`/viajes/${tripId}/pago`, { method: "PATCH", token, body: { referenciaPago: reference } });
}

export async function cancelTrip(token: string, tripId: number) {
  await request(`/viajes/${tripId}/cancelar`, { method: "PATCH", token });
}

export async function fetchConnectedDrivers(token: string): Promise<number> {
  const raw = await request<{ conectados: number }>("/viajes/conectados", { token });
  return raw.conectados;
}