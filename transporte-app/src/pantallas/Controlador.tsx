import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useSocket } from "../lib/socket";
import type { ConductorDisponible, ViajeStaff } from "../lib/tipos";

function distanciaKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

function textoDistancia(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

function minutosDesde(fecha: string) {
  return Math.max(0, Math.round((Date.now() - new Date(fecha).getTime()) / 60000));
}

function TarjetaViaje({ v, activo, onPress }: { v: ViajeStaff; activo: boolean; onPress?: () => void }) {
  const pago = v.tipoPago === "EFECTIVO" ? "Efectivo" : `Pago móvil (ref. ${v.referenciaPago ?? "—"})`;
  const estado =
    v.estado === "SOLICITADO" ? `Esperando hace ${minutosDesde(v.creadoEn)} min` : v.estado === "ASIGNADO" ? "Asignado" : "En curso";
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[estilos.tarjeta, activo && estilos.tarjetaActiva]}>
      <Text style={estilos.nombre}>
        {v.usuario.nombre} · {v.pasajeros} {v.pasajeros === 1 ? "pasajero" : "pasajeros"}
      </Text>
      <Text style={estilos.detalle}>{pago}</Text>
      {v.referenciaOrigen ? <Text style={estilos.detalle}>Referencia: {v.referenciaOrigen}</Text> : null}
      <Text style={estilos.detalleChico}>
        {v.conductor ? `Conductor: ${v.conductor.usuario.nombre} · ` : ""}
        {estado}
      </Text>
    </Pressable>
  );
}

export default function PantallaControlador() {
  const { usuario, token, salir } = useAuth();
  const margen = useSafeAreaInsets();

  const [viajes, setViajes] = useState<ViajeStaff[]>([]);
  const [conductores, setConductores] = useState<ConductorDisponible[]>([]);
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState("");
  const [error, setError] = useState("");

  const cargar = useCallback(async () => {
    try {
      const [v, c] = await Promise.all([
        api<ViajeStaff[]>("/viajes/activos", { token }),
        api<ConductorDisponible[]>("/viajes/conductores-disponibles", { token }),
      ]);
      setViajes(v);
      setConductores(c);
      setSeleccionado((s) =>
        s !== null && v.some((x) => x.id === s && (x.estado === "SOLICITADO" || x.estado === "ASIGNADO")) ? s : null
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCargando(false);
    }
  }, [token]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useSocket(token, {
    "viaje:nuevo": () => {
      setAviso("Llegó una solicitud nueva");
      cargar();
    },
    "viaje:actualizado": () => {
      cargar();
    },
    "conductor:estado": () => {
      cargar();
    },
  });

  const elegido = viajes.find((v) => v.id === seleccionado) ?? null;

  const conductoresOrdenados = useMemo(() => {
    const lista = conductores.map((c) => ({
      c,
      km:
        elegido && c.latitud != null && c.longitud != null
          ? distanciaKm(elegido.latitudOrigen, elegido.longitudOrigen, c.latitud, c.longitud)
          : null,
    }));
    return elegido ? lista.sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity)) : lista;
  }, [conductores, elegido]);

  async function asignar(c: ConductorDisponible) {
    if (!elegido) return;
    setError("");
    setAviso("");
    try {
      await api(`/viajes/${elegido.id}/asignar`, { metodo: "PATCH", token, cuerpo: { conductorId: c.id } });
      setAviso(`Viaje de ${elegido.usuario.nombre} asignado a ${c.usuario.nombre}`);
      setSeleccionado(null);
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (cargando) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const pendientes = viajes.filter((v) => v.estado === "SOLICITADO");
  const enMarcha = viajes.filter((v) => v.estado !== "SOLICITADO");

  return (
    <ScrollView
      contentContainerStyle={[estilos.contenido, { paddingTop: margen.top + 16, paddingBottom: margen.bottom + 24 }]}
      refreshControl={<RefreshControl refreshing={false} onRefresh={cargar} />}
    >
      <View style={estilos.cabecera}>
        <Text style={estilos.saludo}>Hola, {usuario?.nombre}</Text>
        <Pressable onPress={salir}>
          <Text style={estilos.salir}>Salir</Text>
        </Pressable>
      </View>

      {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}
      {error ? <Text style={estilos.error}>{error}</Text> : null}
      {elegido ? (
        <Text style={estilos.banner}>
          Asignando el viaje de {elegido.usuario.nombre} ({elegido.pasajeros}). Elige un conductor abajo.
        </Text>
      ) : null}

      <Text style={estilos.seccion}>Solicitudes nuevas ({pendientes.length})</Text>
      {pendientes.length === 0 ? <Text style={estilos.vacio}>No hay solicitudes por ahora.</Text> : null}
      {pendientes.map((v) => (
        <TarjetaViaje
          key={v.id}
          v={v}
          activo={v.id === seleccionado}
          onPress={() => setSeleccionado(v.id === seleccionado ? null : v.id)}
        />
      ))}

      <Text style={estilos.seccion}>Conductores conectados ({conductores.length})</Text>
      {conductores.length === 0 ? <Text style={estilos.vacio}>No hay conductores conectados.</Text> : null}
      {conductoresOrdenados.map(({ c, km }) => {
        const llevando = c.viajes.reduce((suma, x) => suma + x.pasajeros, 0);
        return (
          <View key={c.id} style={estilos.tarjeta}>
            <Text style={estilos.nombre}>{c.usuario.nombre}</Text>
            <Text style={estilos.detalle}>
              Placa {c.placa}
              {c.unidad ? ` · Unidad ${c.unidad}` : ""}
            </Text>
            <Text style={estilos.detalleChico}>
              Lleva {llevando} {llevando === 1 ? "pasajero" : "pasajeros"}
              {km != null ? ` · a ${textoDistancia(km)} del pasajero` : elegido ? " · sin ubicación" : ""}
            </Text>
            <Pressable
              style={[estilos.boton, !elegido && estilos.botonInactivo]}
              onPress={() => asignar(c)}
              disabled={!elegido}
            >
              <Text style={estilos.botonTexto}>{elegido ? "Asignar a este conductor" : "Selecciona un viaje primero"}</Text>
            </Pressable>
          </View>
        );
      })}

      <Text style={estilos.seccion}>En marcha ({enMarcha.length})</Text>
      {enMarcha.length === 0 ? <Text style={estilos.vacio}>No hay viajes en marcha.</Text> : null}
      {enMarcha.map((v) => (
        <TarjetaViaje
          key={v.id}
          v={v}
          activo={v.id === seleccionado}
          onPress={v.estado === "ASIGNADO" ? () => setSeleccionado(v.id === seleccionado ? null : v.id) : undefined}
        />
      ))}
      {enMarcha.some((v) => v.estado === "ASIGNADO") ? (
        <Text style={estilos.detalleChico}>Toca un viaje “Asignado” si quieres pasarlo a otro conductor.</Text>
      ) : null}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  centro: { flex: 1, justifyContent: "center", alignItems: "center" },
  contenido: { paddingHorizontal: 20, gap: 12 },
  cabecera: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  saludo: { fontSize: 22, fontWeight: "bold" },
  salir: { color: "#c00", fontSize: 16 },
  aviso: { backgroundColor: "#e6f4ea", color: "#1e6b34", padding: 12, borderRadius: 8 },
  error: { backgroundColor: "#fdecea", color: "#b00020", padding: 12, borderRadius: 8 },
  banner: { backgroundColor: "#fff4e5", color: "#8a4b00", padding: 12, borderRadius: 8 },
  seccion: { fontSize: 18, fontWeight: "600", marginTop: 8 },
  vacio: { color: "#666", fontSize: 15 },
  tarjeta: { borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 14, gap: 4 },
  tarjetaActiva: { borderColor: "#1a73e8", borderWidth: 2, backgroundColor: "#eef4ff" },
  nombre: { fontSize: 17, fontWeight: "bold" },
  detalle: { fontSize: 15, color: "#333" },
  detalleChico: { fontSize: 14, color: "#666" },
  boton: { backgroundColor: "#1a73e8", borderRadius: 8, padding: 12, alignItems: "center", marginTop: 6 },
  botonInactivo: { backgroundColor: "#aaa" },
  botonTexto: { color: "#fff", fontSize: 15, fontWeight: "600" },
});