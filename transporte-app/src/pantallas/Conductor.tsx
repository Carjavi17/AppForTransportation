import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useSocket } from "../lib/socket";
import type { ViajeConductor } from "../lib/tipos";

export default function PantallaConductor() {
  const { usuario, token, salir } = useAuth();
  const margen = useSafeAreaInsets();

  const [conectado, setConectado] = useState(false);
  const [viajes, setViajes] = useState<ViajeConductor[]>([]);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState("");
  const [error, setError] = useState("");
  const gps = useRef<Location.LocationSubscription | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [yo, lista] = await Promise.all([
        api<{ conectado: boolean }>("/conductor/yo", { token }),
        api<ViajeConductor[]>("/conductor/viajes", { token }),
      ]);
      setConectado(yo.conectado);
      setViajes(lista);
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
      setAviso("Te asignaron un pasajero nuevo");
      cargar();
    },
    "viaje:cancelado": () => {
      setAviso("Un pasajero canceló su viaje");
      cargar();
    },
  });

  // Mientras esté conectado, enviar la ubicación al servidor
  useEffect(() => {
    if (!conectado) return;
    let activo = true;

    (async () => {
      try {
        const suscripcion = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Balanced, timeInterval: 5000, distanceInterval: 10 },
          (pos) => {
            api("/conductor/ubicacion", {
              metodo: "PATCH",
              token,
              cuerpo: { latitud: pos.coords.latitude, longitud: pos.coords.longitude },
            }).catch(() => {});
          }
        );
        if (activo) gps.current = suscripcion;
        else suscripcion.remove();
      } catch {
        setError("No se pudo activar el GPS. Revisa el permiso de ubicación");
      }
    })();

    return () => {
      activo = false;
      gps.current?.remove();
      gps.current = null;
    };
  }, [conectado, token]);

  async function alternar() {
    setError("");
    setAviso("");
    const quiereConectar = !conectado;

    if (!quiereConectar && viajes.length > 0) {
      setError("Termina tus viajes antes de desconectarte");
      return;
    }
    try {
      if (quiereConectar) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Necesitamos el permiso de ubicación para conectarte");
          return;
        }
      }
      const r = await api<{ conectado: boolean }>("/conductor/estado", {
        metodo: "PATCH",
        token,
        cuerpo: { conectado: quiereConectar },
      });
      setConectado(r.conectado);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function avanzar(v: ViajeConductor) {
    setError("");
    const siguiente = v.estado === "ASIGNADO" ? "EN_CURSO" : "COMPLETADO";
    try {
      await api(`/viajes/${v.id}/estado`, { metodo: "PATCH", token, cuerpo: { estado: siguiente } });
      if (siguiente === "COMPLETADO") setAviso("Viaje terminado");
      await cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function abrirMapa(v: ViajeConductor) {
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${v.latitudOrigen},${v.longitudOrigen}`);
  }

  if (cargando) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const total = viajes.reduce((suma, v) => suma + v.pasajeros, 0);

  return (
    <ScrollView
      contentContainerStyle={[estilos.contenido, { paddingTop: margen.top + 16, paddingBottom: margen.bottom + 24 }]}
    >
      <View style={estilos.cabecera}>
        <Text style={estilos.saludo}>Hola, {usuario?.nombre}</Text>
        <Pressable onPress={salir}>
          <Text style={estilos.salir}>Salir</Text>
        </Pressable>
      </View>

      <Pressable style={[estilos.interruptor, conectado ? estilos.conectado : estilos.desconectado]} onPress={alternar}>
        <Text style={estilos.interruptorTexto}>
          {conectado ? "Conectado · toca para desconectarte" : "Desconectado · toca para conectarte"}
        </Text>
      </Pressable>

      {aviso ? <Text style={estilos.aviso}>{aviso}</Text> : null}
      {error ? <Text style={estilos.error}>{error}</Text> : null}

      <Text style={estilos.subtitulo}>
        Mis pasajeros ({total}) · {viajes.length} {viajes.length === 1 ? "viaje" : "viajes"}
      </Text>

      {viajes.length === 0 ? (
        <Text style={estilos.vacio}>
          {conectado ? "Esperando que el controlador te asigne pasajeros…" : "Conéctate para recibir pasajeros."}
        </Text>
      ) : null}

      {viajes.map((v) => (
        <View key={v.id} style={estilos.tarjeta}>
          <Text style={estilos.estado}>{v.estado === "ASIGNADO" ? "Por recoger" : "En curso"}</Text>
          <Text style={estilos.nombre}>{v.usuario.nombre}</Text>
          <Text style={estilos.detalle}>Teléfono: {v.usuario.telefono}</Text>
          <Text style={estilos.detalle}>
            {v.pasajeros} {v.pasajeros === 1 ? "pasajero" : "pasajeros"} ·{" "}
            {v.tipoPago === "EFECTIVO" ? "Efectivo" : `Pago móvil (ref. ${v.referenciaPago ?? "—"})`}
          </Text>
          {v.referenciaOrigen ? <Text style={estilos.detalle}>Referencia: {v.referenciaOrigen}</Text> : null}

          <Pressable style={estilos.botonSecundario} onPress={() => abrirMapa(v)}>
            <Text style={estilos.botonSecundarioTexto}>Ver punto de recogida en Google Maps</Text>
          </Pressable>
          <Pressable style={estilos.boton} onPress={() => avanzar(v)}>
            <Text style={estilos.botonTexto}>{v.estado === "ASIGNADO" ? "Iniciar viaje" : "Terminar viaje"}</Text>
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const estilos = StyleSheet.create({
  centro: { flex: 1, justifyContent: "center", alignItems: "center" },
  contenido: { paddingHorizontal: 20, gap: 14 },
  cabecera: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  saludo: { fontSize: 22, fontWeight: "bold" },
  salir: { color: "#c00", fontSize: 16 },
  interruptor: { borderRadius: 10, padding: 16, alignItems: "center" },
  conectado: { backgroundColor: "#1e8e3e" },
  desconectado: { backgroundColor: "#777" },
  interruptorTexto: { color: "#fff", fontSize: 16, fontWeight: "600" },
  aviso: { backgroundColor: "#e6f4ea", color: "#1e6b34", padding: 12, borderRadius: 8 },
  error: { backgroundColor: "#fdecea", color: "#b00020", padding: 12, borderRadius: 8 },
  subtitulo: { fontSize: 18, fontWeight: "600" },
  vacio: { color: "#666", fontSize: 16 },
  tarjeta: { borderWidth: 1, borderColor: "#ddd", borderRadius: 12, padding: 16, gap: 8 },
  estado: { fontSize: 14, fontWeight: "bold", color: "#1a73e8", textTransform: "uppercase" },
  nombre: { fontSize: 20, fontWeight: "bold" },
  detalle: { fontSize: 16, color: "#333" },
  boton: { backgroundColor: "#1a73e8", borderRadius: 8, padding: 14, alignItems: "center", marginTop: 4 },
  botonTexto: { color: "#fff", fontSize: 16, fontWeight: "600" },
  botonSecundario: { borderWidth: 1, borderColor: "#1a73e8", borderRadius: 8, padding: 12, alignItems: "center", marginTop: 4 },
  botonSecundarioTexto: { color: "#1a73e8", fontSize: 15 },
});