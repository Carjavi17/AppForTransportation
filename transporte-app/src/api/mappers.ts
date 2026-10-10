import { mediaUrl } from "./media";
import type {
  AvailableDriver,
  DispatcherTrip,
  DriverSummary,
  DriverTrip,
  ManagedUser,
  PassengerTrip,
  PaymentType,
  Role,
  TripStatus,
  User,
} from "./types";

const ROLE_FROM_API: Record<string, Role> = {
  USUARIO: "PASSENGER",
  CONDUCTOR: "DRIVER",
  CONTROLADOR: "DISPATCHER",
  ADMINISTRADOR: "ADMIN",
};

const ROLE_TO_API: Record<Role, string> = {
  PASSENGER: "USUARIO",
  DRIVER: "CONDUCTOR",
  DISPATCHER: "CONTROLADOR",
  ADMIN: "ADMINISTRADOR",
};

const STATUS_FROM_API: Record<string, TripStatus> = {
  SOLICITADO: "REQUESTED",
  ASIGNADO: "ASSIGNED",
  EN_CURSO: "IN_PROGRESS",
  COMPLETADO: "COMPLETED",
  CANCELADO: "CANCELLED",
};

const STATUS_TO_API: Record<TripStatus, string> = {
  REQUESTED: "SOLICITADO",
  ASSIGNED: "ASIGNADO",
  IN_PROGRESS: "EN_CURSO",
  COMPLETED: "COMPLETADO",
  CANCELLED: "CANCELADO",
};

const PAYMENT_FROM_API: Record<string, PaymentType> = {
  EFECTIVO: "CASH",
  PAGO_MOVIL: "MOBILE_PAYMENT",
};

const PAYMENT_TO_API: Record<PaymentType, string> = {
  CASH: "EFECTIVO",
  MOBILE_PAYMENT: "PAGO_MOVIL",
};

export const roleToApi = (role: Role) => ROLE_TO_API[role];
export const statusToApi = (status: TripStatus) => STATUS_TO_API[status];
export const paymentToApi = (payment: PaymentType) => PAYMENT_TO_API[payment];

export function mapStatus(raw: string | undefined): TripStatus | undefined {
  return raw ? STATUS_FROM_API[raw] : undefined;
}

export function mapUser(raw: any): User {
  return {
    id: raw.id,
    name: raw.nombre,
    phone: raw.telefono,
    role: ROLE_FROM_API[raw.rol] ?? "PASSENGER",
    photoUrl: mediaUrl(raw.fotoUrl),
  };
}

export function mapDriver(raw: any): DriverSummary {
  return {
    id: raw.id,
    plate: raw.placa,
    unit: raw.unidad ?? null,
    latitude: raw.latitud ?? null,
    longitude: raw.longitud ?? null,
    name: raw.usuario.nombre,
    phone: raw.usuario.telefono,
    photoUrl: mediaUrl(raw.usuario.fotoUrl),
  };
}

export function mapPassengerTrip(raw: any): PassengerTrip {
  return {
    id: raw.id,
    status: STATUS_FROM_API[raw.estado] ?? "REQUESTED",
    passengers: raw.pasajeros,
    students: raw.estudiantes ?? 0,
    paymentType: PAYMENT_FROM_API[raw.tipoPago] ?? "CASH",
    paymentReference: raw.referenciaPago ?? null,
    originReference: raw.referenciaOrigen ?? null,
    driver: raw.conductor ? mapDriver(raw.conductor) : null,
    originLatitude: raw.latitudOrigen,
    originLongitude: raw.longitudOrigen,
  };
}

export function mapDriverTrip(raw: any): DriverTrip {
  return {
    id: raw.id,
    status: STATUS_FROM_API[raw.estado] ?? "ASSIGNED",
    passengers: raw.pasajeros,
    students: raw.estudiantes ?? 0,
    paymentType: PAYMENT_FROM_API[raw.tipoPago] ?? "CASH",
    paymentReference: raw.referenciaPago ?? null,
    originReference: raw.referenciaOrigen ?? null,
    originLatitude: raw.latitudOrigen,
    originLongitude: raw.longitudOrigen,
    passengerName: raw.usuario.nombre,
    passengerPhone: raw.usuario.telefono,
    passengerPhotoUrl: mediaUrl(raw.usuario.fotoUrl),
  };
}

export function mapDispatcherTrip(raw: any): DispatcherTrip {
  return {
    id: raw.id,
    status: STATUS_FROM_API[raw.estado] ?? "REQUESTED",
    passengers: raw.pasajeros,
    students: raw.estudiantes ?? 0,
    paymentType: PAYMENT_FROM_API[raw.tipoPago] ?? "CASH",
    paymentReference: raw.referenciaPago ?? null,
    originReference: raw.referenciaOrigen ?? null,
    originLatitude: raw.latitudOrigen,
    originLongitude: raw.longitudOrigen,
    createdAt: raw.creadoEn,
    passengerName: raw.usuario.nombre,
    passengerPhone: raw.usuario.telefono,
    passengerPhotoUrl: mediaUrl(raw.usuario.fotoUrl),
    driver: raw.conductor ? mapDriver(raw.conductor) : null,
  };
}

export function mapAvailableDriver(raw: any): AvailableDriver {
  return {
    ...mapDriver(raw),
    loadPassengers: (raw.viajes ?? []).reduce((sum: number, trip: any) => sum + trip.pasajeros, 0),
  };
}

export function mapManagedUser(raw: any): ManagedUser {
  return {
    ...mapUser(raw),
    active: raw.activo,
    driver: raw.conductor
      ? {
          id: raw.conductor.id,
          plate: raw.conductor.placa,
          unit: raw.conductor.unidad ?? null,
          connected: raw.conductor.conectado,
        }
      : null,
  };
}

export function mapLocationEvent(raw: any) {
  return { driverId: raw.conductorId as number, latitude: raw.latitud as number, longitude: raw.longitud as number };
}

export function mapConnectedCount(raw: any): number {
  return raw.conectados;
}