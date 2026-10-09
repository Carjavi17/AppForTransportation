export const EVENTS = {
  tripRequested: "viaje:nuevo",
  tripAssigned: "viaje:asignado",
  tripUpdated: "viaje:actualizado",
  tripCancelled: "viaje:cancelado",
  driverLocation: "conductor:ubicacion",
  driverStatus: "conductor:estado",
  connectedCount: "conductores:cantidad",
  tripPayment: "viaje:pago",
} as const;