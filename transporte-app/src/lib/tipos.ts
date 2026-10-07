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