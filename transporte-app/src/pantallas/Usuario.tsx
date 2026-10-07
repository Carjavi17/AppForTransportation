import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useSocket } from "../lib/socket";
import type { Viaje } from "../lib/tipos";

const TEXTO_ESTADO: Record<string, string> = {
  SOLICITADO: "Buscando una unidad para ti…",
  ASIGNADO: "Te asignaron una unidad, va en camino",
  EN_CURSO: "Viaje en curso",
};

export default function PantallaUsuario() {
  const { usuario, token, salir } = useAuth();
  const margen = useSafeAreaInsets();

  const [viaje, setViaje] = useState<Viaje | null>(null);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState("");
  const [error, setError] = useState("");

  const [coords, setCoords] = useState<{ latitud: number; longitud: number } | null>(null);
  const [referencia, setReferencia] = useState("");
  const [pasajeros, setPasajeros] = useState(1);
  const [tipoPago, setTipoPago] = useState<"EFECTIVO" | "PAGO_MOVIL">("EFECTIVO");
  const [referenciaPago, setReferenciaPago] = useState("");
  const [enviando, setEnviando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const activo = await api<Viaje | null>("/viajes/activo", { token });
      setViaje(activo);
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
    "viaje:asignado": () => {
      setAviso("Te asignaron una unidad");
      cargar();
    },
    "viaje:actualizado": (d) => {
      if (d?.estado === "COMPLETADO") setAviso("Viaje completado. ¡Gracias por usar la app!");
      cargar();
    },
    "conductor:ubicacion": (d) => {
      setViaje((v) =>
        v?.conductor
          ? { ...v, conductor: { ...v.conductor, latitud: d.latitud, longitud: d.longitud } }
          : v
      );
    },
  });

  async function usarUbicacion() {
    setError("");
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setError("Necesitamos el permiso de ubicación para pedir el viaje");
      return;
    }
    try {
      const pos = await Location.getCurrentPositionAsync({});
      setCoords({ latitud: pos.coords.latitude, longitud: pos.coords.longitude });
    } catch {
      setError("No se pudo obtener tu ubicación. Revisa que el GPS esté activado");
    }
  }

  async function pedir() {
    setError("");
    setAviso("");
    if (!coords) {
      setError("Primero toca “Usar mi ubicación”");
      return;
    }
    setEnviando(true);
    try {
      await api("/viajes", {
        metodo: "POST",
        token,
        cuerpo: {
          latitud: coords.latitud,
          longitud: coords.longitud,
          referencia: referencia.trim() || undefined,
          pasajeros,
          tipoPago,
          referenciaPago: tipoPago === "PAGO_MOVIL" ? referenciaPago.trim() : undefined,
        },
      });
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  async function cancelar() {
    if (!viaje) return;
    setError("");
    try {
      await api(`/viajes/${viaje.id}/cancelar`, { metodo: "PATCH", token });
      setAviso("Viaje cancelado");
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

  return (
    <ScrollView
      contentContainerStyle={[estilos.contenido, { paddingTop: margen.top + 16, paddingBottom: margen.bottom + 24 }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={estilos.cabecera}>
        <Text style={estilos.saludo}>Hola, {usuario?.nombre}</Text>
        <Pressable onPress={salir}>
          <Text style={estilos.salir}>Salir</Text>
        </Pressable>
      </View>

      {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}
      {error ? <Text style={estilos.error}>{error}</Text> : null}

      {viaje ? (
        <View style={estilos.tarjeta}>
          <Text style={estilos.estado}>{TEXTO_ESTADO[viaje.estado] ?? viaje.estado}</Text>
          <Text style={estilos.detalle}>
            {viaje.pasajeros} {viaje.pasajeros === 1 ? "pasajero" : "pasajeros"} ·{" "}
            {viaje.tipoPago === "EFECTIVO" ? "Efectivo" : "Pago móvil"}
          </Text>

          {viaje.conductor ? (
            <View style={estilos.conductor}>
              <Text style={estilos.subtitulo}>Tu conductor</Text>
              <Text style={estilos.detalle}>{viaje.conductor.usuario.nombre}</Text>
              <Text style={estilos.detalle}>Teléfono: {viaje.conductor.usuario.telefono}</Text>
              <Text style={estilos.detalle}>
                Placa: {viaje.conductor.placa}
                {viaje.conductor.unidad ? ` · Unidad ${viaje.conductor.unidad}` : ""}
              </Text>
              <Text style={estilos.detalle}>
                Ubicación:{" "}
                {viaje.conductor.latitud != null && viaje.conductor.longitud != null
                  ? `${viaje.conductor.latitud.toFixed(5)}, ${viaje.conductor.longitud.toFixed(5)}`
                  : "aún sin reportar"}
              </Text>
            </View>
          ) : null}

          {viaje.estado === "SOLICITADO" || viaje.estado === "ASIGNADO" ? (
            <Pressable style={estilos.botonCancelar} onPress={cancelar}>
              <Text style={estilos.botonTexto}>Cancelar viaje</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={estilos.tarjeta}>
          <Text style={estilos.subtitulo}>Pedir una unidad</Text>

          <Pressable style={estilos.botonSecundario} onPress={usarUbicacion}>
            <Text style={estilos.botonSecundarioTexto}>
              {coords ? "Ubicación lista ✓ (tocar para actualizar)" : "Usar mi ubicación"}
            </Text>
          </Pressable>

          <TextInput
            style={estilos.campo}
            placeholder="Referencia (opcional): frente a la plaza…"
            value={referencia}
            onChangeText={setReferencia}
          />

          <View style={estilos.fila}>
            <Text style={estilos.detalle}>Pasajeros</Text>
            <View style={estilos.contador}>
              <Pressable style={estilos.contadorBoton} onPress={() => setPasajeros((n) => Math.max(1, n - 1))}>
                <Text style={estilos.contadorTexto}>−</Text>
              </Pressable>
              <Text style={estilos.contadorNumero}>{pasajeros}</Text>
              <Pressable style={estilos.contadorBoton} onPress={() => setPasajeros((n) => Math.min(10, n + 1))}>
                <Text style={estilos.contadorTexto}>+</Text>
              </Pressable>
            </View>
          </View>

          <View style={estilos.fila}>
            {(["EFECTIVO", "PAGO_MOVIL"] as const).map((tipo) => (
              <Pressable
                key={tipo}
                style={[estilos.opcion, tipoPago === tipo && estilos.opcionActiva]}
                onPress={() => setTipoPago(tipo)}
              >
                <Text style={tipoPago === tipo ? estilos.opcionTextoActivo : estilos.opcionTexto}>
                  {tipo === "EFECTIVO" ? "Efectivo" : "Pago móvil"}
                </Text>
              </Pressable>
            ))}
          </View>

          {tipoPago === "PAGO_MOVIL" ? (
            <TextInput
              style={estilos.campo}
              placeholder="Número de referencia del pago"
              keyboardType="number-pad"
              value={referenciaPago}
              onChangeText={setReferenciaPago}
            />
          ) : null}

          <Pressable style={estilos.boton} onPress={pedir} disabled={enviando}>
            {enviando ? <ActivityIndicator color="#fff" /> : <Text style={estilos.botonTexto}>Pedir viaje</Text>}
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  centro: { flex: 1, justifyContent: "center", alignItems: "center" },
  contenido: { paddingHorizontal: 20, gap: 14 },
  cabecera: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  saludo: { fontSize: 22, fontWeight: "bold" },
  salir: { color: "#c00", fontSize: 16 },
  aviso: { backgroundColor: "#e6f4ea", color: "#1e6b34", padding: 12, borderRadius: 8 },
  error: { backgroundColor: "#fdecea", color: "#b00020", padding: 12, borderRadius: 8 },
  tarjeta: { borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 16, gap: 12 },
  estado: { fontSize: 20, fontWeight: "bold", color: "#1a73e8" },
  subtitulo: { fontSize: 18, fontWeight: "600" },
  detalle: { fontSize: 16, color: "#333" },
  conductor: { gap: 4, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#eee" },
  campo: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, fontSize: 16 },
  fila: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  contador: { flexDirection: "row", alignItems: "center", gap: 16 },
  contadorBoton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#eee", alignItems: "center", justifyContent: "center" },
  contadorTexto: { fontSize: 22 },
  contadorNumero: { fontSize: 20, fontWeight: "600", minWidth: 24, textAlign: "center" },
  opcion: { flex: 1, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, alignItems: "center" },
  opcionActiva: { backgroundColor: "#1a73e8", borderColor: "#1a73e8" },
  opcionTexto: { color: "#333", fontSize: 16 },
  opcionTextoActivo: { color: "#fff", fontSize: 16, fontWeight: "600" },
  boton: { backgroundColor: "#1a73e8", borderRadius: 8, padding: 14, alignItems: "center" },
  botonCancelar: { backgroundColor: "#c00", borderRadius: 8, padding: 14, alignItems: "center" },
  botonTexto: { color: "#fff", fontSize: 16, fontWeight: "600" },
  botonSecundario: { borderWidth: 1, borderColor: "#1a73e8", borderRadius: 8, padding: 12, alignItems: "center" },
  botonSecundarioTexto: { color: "#1a73e8", fontSize: 16 },
});