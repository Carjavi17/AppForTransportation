import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useCallback, useEffect, useRef, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import {
  advanceTrip,
  fetchDriverProfile,
  fetchDriverTrips,
  sendLocation,
  updateConnection,
  type DriverProfile,
} from "../../api/driver";
import { EVENTS } from "../../api/events";
import type { DriverTrip, TripStatus } from "../../api/types";
import { Avatar } from "../../components/Avatar";
import { Badge } from "../../components/Badge";
import { Banner } from "../../components/Banner";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { GradientHeader } from "../../components/GradientHeader";
import { InfoRow } from "../../components/InfoRow";
import { LoadingScreen } from "../../components/LoadingScreen";
import { Screen } from "../../components/Screen";
import { SignOutButton } from "../../components/SignOutButton";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../hooks/useSocket";
import { colors, gradients } from "../../theme/theme";
import { styles } from "./driver.styles";
import { describePassengers } from "../../utils/labels";

export default function DriverHomeScreen() {
  const { user, token } = useAuth();

  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [trips, setTrips] = useState<DriverTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const gps = useRef<Location.LocationSubscription | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [driverProfile, driverTrips] = await Promise.all([
        fetchDriverProfile(token),
        fetchDriverTrips(token),
      ]);
      setProfile(driverProfile);
      setTrips(driverTrips);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  useSocket(token, {
    [EVENTS.tripPayment]: () => {
      setNotice("Un pasajero envió su referencia de pago");
      load();
    },
    [EVENTS.tripAssigned]: () => {
      setNotice("Te asignaron un pasajero nuevo");
      load();
    },
    [EVENTS.tripCancelled]: () => {
      setNotice("Un pasajero canceló su viaje");
      load();
    },
  });

  // While connected, keep sending the driver's location
  const connected = profile?.connected ?? false;
  useEffect(() => {
    if (!connected || !token) return;
    let active = true;

    (async () => {
      try {
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (position) => {
            sendLocation(
              token,
              position.coords.latitude,
              position.coords.longitude,
            ).catch(() => {});
          },
        );
        if (active) gps.current = subscription;
        else subscription.remove();
      } catch {
        setError("No se pudo activar el GPS. Revisa el permiso de ubicación");
      }
    })();

    return () => {
      active = false;
      gps.current?.remove();
      gps.current = null;
    };
  }, [connected, token]);

  async function handleToggle() {
    if (!token || !profile) return;
    setError("");
    setNotice("");
    const wantsToConnect = !profile.connected;

    if (!wantsToConnect && trips.length > 0) {
      setError("Termina tus viajes antes de desconectarte");
      return;
    }
    try {
      if (wantsToConnect) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Necesitamos el permiso de ubicación para conectarte");
          return;
        }
      }
      const isConnected = await updateConnection(token, wantsToConnect);
      setProfile({ ...profile, connected: isConnected });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleAdvance(trip: DriverTrip) {
    if (!token) return;
    setError("");
    try {
      const next: TripStatus =
        trip.status === "ASSIGNED" ? "IN_PROGRESS" : "COMPLETED";
      await advanceTrip(token, trip.id, next);
      if (next === "COMPLETED") setNotice("Viaje terminado");
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function openMap(trip: DriverTrip) {
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${trip.originLatitude},${trip.originLongitude}`,
    );
  }

  if (!user || loading) return <LoadingScreen />;

  const totalPassengers = trips.reduce((sum, trip) => sum + trip.passengers, 0);

  return (
    <Screen
      header={
        <GradientHeader
          title={`Hola, ${user.name}`}
          subtitle={
            profile
              ? `Placa ${profile.plate}${profile.unit ? ` · Unidad ${profile.unit}` : ""}`
              : ""
          }
          right={<SignOutButton />}
        />
      }
      onRefresh={load}
    >
      <Pressable onPress={handleToggle}>
        <LinearGradient
          colors={connected ? gradients.success : gradients.muted}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.toggleCard}
        >
          <Ionicons name="power-outline" size={32} color={colors.white} />
          <View style={styles.toggleTexts}>
            <Text style={styles.toggleTitle}>
              {connected ? "Estás conectado" : "Estás desconectado"}
            </Text>
            <Text style={styles.toggleHint}>
              {connected
                ? "Toca para desconectarte"
                : "Toca para conectarte y recibir pasajeros"}
            </Text>
          </View>
        </LinearGradient>
      </Pressable>

      {notice ? <Banner tone="success" message={notice} /> : null}
      {error ? <Banner tone="error" message={error} /> : null}

      <View style={styles.stats}>
        <Card style={styles.stat}>
          <Text style={styles.statValue}>{totalPassengers}</Text>
          <Text style={styles.statLabel}>Pasajeros</Text>
        </Card>
        <Card style={styles.stat}>
          <Text style={styles.statValue}>{trips.length}</Text>
          <Text style={styles.statLabel}>
            {trips.length === 1 ? "Viaje" : "Viajes"}
          </Text>
        </Card>
      </View>

      {trips.length === 0 ? (
        <Card>
          <Text style={styles.empty}>
            {connected
              ? "Esperando que el controlador te asigne pasajeros…"
              : "Conéctate para recibir pasajeros."}
          </Text>
        </Card>
      ) : null}

      {trips.map((trip) => (
        <Card key={trip.id}>
          <View style={styles.tripHeader}>
            <Avatar
              name={trip.passengerName}
              photoUrl={trip.passengerPhotoUrl}
              size={48}
            />
            <View style={styles.tripInfo}>
              <Text style={styles.passengerName}>{trip.passengerName}</Text>
              <Badge
                label={trip.status === "ASSIGNED" ? "Por recoger" : "En curso"}
                tone={trip.status === "ASSIGNED" ? "warning" : "success"}
              />
            </View>
          </View>
          <InfoRow icon="call-outline" text={trip.passengerPhone} />
          <InfoRow
            icon="people-outline"
            text={describePassengers(trip.passengers, trip.students)}
          />

          <InfoRow
            icon={trip.paymentType === "CASH" ? "cash-outline" : "card-outline"}
            text={
              trip.paymentType === "CASH"
                ? "Efectivo"
                : `Pago móvil · ref. ${trip.paymentReference ?? "pendiente"}`
            }
          />
          {trip.originReference ? (
            <InfoRow icon="pin-outline" text={trip.originReference} />
          ) : null}
          <Button
            label="Ver punto de recogida"
            variant="secondary"
            icon="map-outline"
            onPress={() => openMap(trip)}
          />
          <Button
            label={
              trip.status === "ASSIGNED" ? "Iniciar viaje" : "Terminar viaje"
            }
            icon={
              trip.status === "ASSIGNED"
                ? "play-outline"
                : "checkmark-done-outline"
            }
            onPress={() => handleAdvance(trip)}
          />
        </Card>
      ))}
    </Screen>
  );
}
