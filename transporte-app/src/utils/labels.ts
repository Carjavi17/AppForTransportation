import type { PaymentType, Role } from "../api/types";
import { gradients } from "../theme/theme";

export const ROLE_LABEL: Record<Role, string> = {
  PASSENGER: "Pasajero",
  DRIVER: "Conductor",
  DISPATCHER: "Controlador",
  ADMIN: "Administrador",
};

export const PAYMENT_LABEL: Record<PaymentType, string> = {
  CASH: "Efectivo",
  MOBILE_PAYMENT: "Pago móvil",
};

export const PASSENGER_STATUS = {
  REQUESTED: { text: "Buscando una unidad para ti…", icon: "search-outline", gradient: gradients.accent },
  ASSIGNED: { text: "Tu unidad va en camino", icon: "bus-outline", gradient: gradients.info },
  IN_PROGRESS: { text: "Viaje en curso", icon: "navigate-outline", gradient: gradients.success },
} as const;

export function describePassengers(total: number, students: number) {
  const civilians = total - students;
  const parts: string[] = [];
  if (civilians > 0) parts.push(`${civilians} ${civilians === 1 ? "civil" : "civiles"}`);
  if (students > 0) parts.push(`${students} ${students === 1 ? "estudiante" : "estudiantes"}`);
  return `${total} ${total === 1 ? "pasajero" : "pasajeros"} · ${parts.join(", ")}`;
}