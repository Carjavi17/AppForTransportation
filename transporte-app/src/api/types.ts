export type Role = "PASSENGER" | "DRIVER" | "DISPATCHER" | "ADMIN";

export type User = {
  id: number;
  name: string;
  phone: string;
  role: Role;
  photoUrl: string | null;
};

export type TripStatus = "REQUESTED" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type PaymentType = "CASH" | "MOBILE_PAYMENT";

export type DriverSummary = {
  id: number;
  plate: string;
  unit: string | null;
  latitude: number | null;
  longitude: number | null;
  name: string;
  phone: string;
  photoUrl: string | null;
};

export type PassengerTrip = {
  id: number;
  status: TripStatus;
  passengers: number;
  paymentType: PaymentType;
  originReference: string | null;
  driver: DriverSummary | null;
  paymentReference: string | null;
  students: number;
};

export type DriverTrip = {
  id: number;
  status: TripStatus;
  passengers: number;
  paymentType: PaymentType;
  paymentReference: string | null;
  originReference: string | null;
  originLatitude: number;
  originLongitude: number;
  passengerName: string;
  passengerPhone: string;
  passengerPhotoUrl: string | null;
  students: number;
};

export type NewTripInput = {
  latitude: number;
  longitude: number;
  reference?: string;
  passengers: number;
  paymentType: PaymentType;
  paymentReference?: string;
  students: number;
};
export type StaffRole = Exclude<Role, "PASSENGER">;

export type DispatcherTrip = {
  id: number;
  status: TripStatus;
  passengers: number;
  paymentType: PaymentType;
  paymentReference: string | null;
  originReference: string | null;
  originLatitude: number;
  originLongitude: number;
  createdAt: string;
  passengerName: string;
  passengerPhone: string;
  passengerPhotoUrl: string | null;
  driver: DriverSummary | null;
 students: number;
};

export type AvailableDriver = DriverSummary & { loadPassengers: number };

export type ManagedUser = {
  id: number;
  name: string;
  phone: string;
  role: Role;
  photoUrl: string | null;
  active: boolean;
  driver: { id: number; plate: string; unit: string | null; connected: boolean } | null;
};

export type NewUserInput = {
  name: string;
  phone: string;
  password: string;
  role: StaffRole;
  plate?: string;
  unit?: string;
};

export type UpdateUserInput = { name: string; phone: string; plate?: string; unit?: string };


// ---- Tipos viejos (se eliminan cuando migremos cada pantalla) ----
export type Conductor = {
  id: number;
  placa: string;
  unidad: string | null;
  latitud: number | null;
  longitud: number | null;
  usuario: { nombre: string; telefono: string; fotoUrl: string | null };
};

export type Viaje = {
  id: number;
  estado: "SOLICITADO" | "ASIGNADO" | "EN_CURSO" | "COMPLETADO" | "CANCELADO";
  pasajeros: number;
  tipoPago: "EFECTIVO" | "PAGO_MOVIL";
  referenciaOrigen: string | null;
  conductor?: Conductor | null;
};

export type ViajeConductor = {
  id: number;
  estado: "ASIGNADO" | "EN_CURSO";
  pasajeros: number;
  tipoPago: "EFECTIVO" | "PAGO_MOVIL";
  referenciaPago: string | null;
  referenciaOrigen: string | null;
  latitudOrigen: number;
  longitudOrigen: number;
  usuario: { nombre: string; telefono: string; fotoUrl: string | null };
};

export type ViajeStaff = {
  id: number;
  estado: "SOLICITADO" | "ASIGNADO" | "EN_CURSO";
  pasajeros: number;
  tipoPago: "EFECTIVO" | "PAGO_MOVIL";
  referenciaPago: string | null;
  referenciaOrigen: string | null;
  latitudOrigen: number;
  longitudOrigen: number;
  creadoEn: string;
  usuario: { nombre: string; telefono: string; fotoUrl: string | null };
  conductor: {
    id: number;
    placa: string;
    unidad: string | null;
    usuario: { nombre: string; telefono: string; fotoUrl: string | null };
  } | null;
};

export type ConductorDisponible = {
  id: number;
  placa: string;
  unidad: string | null;
  latitud: number | null;
  longitud: number | null;
  usuario: { nombre: string; telefono: string; fotoUrl: string | null };
  viajes: { id: number; pasajeros: number }[];
};

export type UsuarioAdmin = {
  id: number;
  nombre: string;
  telefono: string;
  rol: "USUARIO" | "CONDUCTOR" | "CONTROLADOR" | "ADMINISTRADOR";
  fotoUrl: string | null;
  activo: boolean;
  conductor: { id: number; placa: string; unidad: string | null; conectado: boolean } | null;
};