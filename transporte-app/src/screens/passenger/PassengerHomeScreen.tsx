import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { EVENTS } from "../../api/events";
import {
  mapConnectedCount,
  mapLocationEvent,
  mapStatus,
} from "../../api/mappers";
import {
  cancelTrip,
  fetchActiveTrip,
  fetchConnectedDrivers,
  fetchLastCompletedTrip,
  requestTrip,
  sendPaymentReference,
} from "../../api/trips";
import type { PassengerTrip, PaymentType } from "../../api/types";
import { Avatar } from "../../components/Avatar";
import { Badge } from "../../components/Badge";
import { Banner } from "../../components/Banner";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { GradientHeader } from "../../components/GradientHeader";
import { InfoRow } from "../../components/InfoRow";
import { LoadingScreen } from "../../components/LoadingScreen";
import { Screen } from "../../components/Screen";
import { SegmentedControl } from "../../components/SegmentedControl";
import { HeaderActions } from "../../components/HeaderActions";
import { Stepper } from "../../components/Stepper";
import { TextField } from "../../components/TextField";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../hooks/useSocket";
import { colors } from "../../theme/theme";
import { PASSENGER_STATUS, describePassengers } from "../../utils/labels";
import { PaymentSection } from "./PaymentSection";
import { styles } from "./passenger.styles";
import type { MapMarkerData } from "../../components/mapTypes";
import { TripMap } from "../../components/TripMap";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

export default function PassengerHomeScreen() {
  const { user, token } = useAuth();

  const [trip, setTrip] = useState<PassengerTrip | null>(null);
  const [lastTrip, setLastTrip] = useState<PassengerTrip | null>(null);
  const [connectedDrivers, setConnectedDrivers] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [reference, setReference] = useState("");
  const [civilians, setCivilians] = useState(0);
  const [students, setStudents] = useState(0);
  const [paymentType, setPaymentType] = useState<PaymentType>("CASH");
  const [paymentReference, setPaymentReference] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError("");
      const active = await fetchActiveTrip(token);
      setTrip(active);
      setLastTrip(active ? null : await fetchLastCompletedTrip(token));
      setConnectedDrivers(await fetchConnectedDrivers(token));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  useAutoRefresh(load);

  useSocket(token, {
    [EVENTS.tripAssigned]: () => {
      setNotice("Te asignaron una unidad");
      load();
    },
    [EVENTS.tripUpdated]: (data) => {
      if (mapStatus(data?.estado) === "COMPLETED")
        setNotice("Viaje completado. ¡Gracias por usar la app!");
      load();
    },
    [EVENTS.driverLocation]: (data) => {
      const location = mapLocationEvent(data);
      setTrip((current) =>
        current?.driver
          ? {
              ...current,
              driver: {
                ...current.driver,
                latitude: location.latitude,
                longitude: location.longitude,
              },
            }
          : current,
      );
    },
    [EVENTS.connectedCount]: (data) =>
      setConnectedDrivers(mapConnectedCount(data)),
  }, load);

  async function getMyLocation() {
    setError("");
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setError("Necesitamos el permiso de ubicación para pedir el viaje");
      return;
    }
    try {
      const position = await Location.getCurrentPositionAsync({});
      setCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch {
      setError(
        "No se pudo obtener tu ubicación. Revisa que el GPS esté activado",
      );
    }
  }

  async function handleRequest() {
    if (!token) return;
    setError("");
    setNotice("");
    if (civilians + students === 0) {
      setError("Elige al menos un pasajero");
      return;
    }
    if (!coords) {
      setError("Primero toca “Usar mi ubicación”");
      return;
    }
    setSubmitting(true);
    try {
      await requestTrip(token, {
        latitude: coords.latitude,
        longitude: coords.longitude,
        reference: reference.trim(),
        passengers: civilians + students,
        students,
        paymentType,
        paymentReference: paymentReference.trim(),
      });

      setCivilians(0);
      setStudents(0);

      setPaymentReference("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!token || !trip) return;
    setError("");
    try {
      await cancelTrip(token, trip.id);
      setNotice("Viaje cancelado");
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleSendReference(tripId: number, paymentRef: string) {
    if (!token) return false;
    setError("");
    setNotice("");
    try {
      await sendPaymentReference(token, tripId, paymentRef);
      setNotice("Referencia de pago enviada");
      await load();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }

  if (!user || loading) return <LoadingScreen />;

  const total = civilians + students;

  const unitsMessage =
    connectedDrivers === 0
      ? "No hay unidades conectadas por ahora"
      : `${connectedDrivers} ${connectedDrivers === 1 ? "unidad conectada" : "unidades conectadas"}`;

  const pendingPayment =
    !trip &&
    lastTrip &&
    lastTrip.paymentType === "MOBILE_PAYMENT" &&
    !lastTrip.paymentReference
      ? lastTrip
      : null;

  const mapMarkers: MapMarkerData[] = trip
    ? [
        {
          id: "pickup",
          latitude: trip.originLatitude,
          longitude: trip.originLongitude,
          title: "Tu punto de recogida",
          kind: "pickup",
        },
        ...(trip.driver &&
        trip.driver.latitude != null &&
        trip.driver.longitude != null
          ? [
              {
                id: "driver",
                latitude: trip.driver.latitude,
                longitude: trip.driver.longitude,
                title: `Tu conductor: ${trip.driver.name}`,
                kind: "driver" as const,
              },
            ]
          : []),
      ]
    : [];

  return (
    <Screen
      header={
        <GradientHeader
          title={`Hola, ${user.name}`}
          subtitle="¿A dónde vamos hoy?"
          right={<HeaderActions />}
        />
      }
      onRefresh={load}
    >
      {connectedDrivers !== null ? (
        <Banner
          tone={connectedDrivers === 0 ? "warning" : "success"}
          message={unitsMessage}
        />
      ) : null}
      {notice ? <Banner tone="success" message={notice} /> : null}
      {error ? <Banner tone="error" message={error} /> : null}

      {pendingPayment ? (
        <Card>
          <Text style={styles.sectionTitle}>
            Pago pendiente de tu último viaje
          </Text>
          <PaymentSection
            paymentType={pendingPayment.paymentType}
            reference={pendingPayment.paymentReference}
            onSubmit={(value) => handleSendReference(pendingPayment.id, value)}
          />
        </Card>
      ) : null}

      {trip ? (
        <>
          {(() => {
            const status =
              PASSENGER_STATUS[trip.status as keyof typeof PASSENGER_STATUS] ??
              PASSENGER_STATUS.REQUESTED;
            return (
              <LinearGradient
                colors={status.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.statusCard}
              >
                <Ionicons name={status.icon} size={32} color={colors.white} />
                <Text style={styles.statusText}>{status.text}</Text>
              </LinearGradient>
            );
          })()}

          <TripMap markers={mapMarkers} />
          
          <Card>
            <InfoRow
              icon="people-outline"
              text={describePassengers(trip.passengers, trip.students)}
            />
            <PaymentSection
              paymentType={trip.paymentType}
              reference={trip.paymentReference}
              onSubmit={(value) => handleSendReference(trip.id, value)}
            />
          </Card>

          {trip.driver ? (
            <Card>
              <Text style={styles.sectionTitle}>Tu conductor</Text>
              <View style={styles.driverRow}>
                <Avatar
                  name={trip.driver.name}
                  photoUrl={trip.driver.photoUrl}
                  size={56}
                />
                <View style={styles.driverInfo}>
                  <Text style={styles.driverName}>{trip.driver.name}</Text>
                  <Badge label={`Placa ${trip.driver.plate}`} tone="info" />
                </View>
              </View>
              <InfoRow icon="call-outline" text={trip.driver.phone} />
              {trip.driver.unit ? (
                <InfoRow
                  icon="bus-outline"
                  text={`Unidad ${trip.driver.unit}`}
                />
              ) : null}
              <InfoRow
                icon="location-outline"
                text={
                  trip.driver.latitude != null && trip.driver.longitude != null
                    ? `${trip.driver.latitude.toFixed(5)}, ${trip.driver.longitude.toFixed(5)}`
                    : "Ubicación aún sin reportar"
                }
              />
            </Card>
          ) : null}

          {trip.status === "REQUESTED" || trip.status === "ASSIGNED" ? (
            <Button
              label="Cancelar viaje"
              variant="danger"
              icon="close-circle-outline"
              onPress={handleCancel}
            />
          ) : null}
        </>
      ) : (
        <Card>
          <Text style={styles.sectionTitle}>Pedir una unidad</Text>
          <Button
            label={coords ? "Ubicación lista ✓" : "Usar mi ubicación"}
            variant={coords ? "soft" : "secondary"}
            icon="locate-outline"
            onPress={getMyLocation}
          />
          <TextField
            label="Referencia (opcional)"
            icon="pin-outline"
            placeholder="Frente a la plaza…"
            value={reference}
            onChangeText={setReference}
          />
          <Stepper
            label="Civiles"
            value={civilians}
            min={0}
            max={10 - students}
            onChange={setCivilians}
          />
          <Stepper
            label="Estudiantes"
            value={students}
            min={0}
            max={10 - civilians}
            onChange={setStudents}
          />
          <InfoRow
            icon="people-outline"
            text={
              total === 0
                ? "Elige cuántos viajan"
                : `Total: ${total} ${total === 1 ? "pasajero" : "pasajeros"}`
            }
          />
          <SegmentedControl
            options={[
              { value: "CASH", label: "Efectivo", icon: "cash-outline" },
              {
                value: "MOBILE_PAYMENT",
                label: "Pago móvil",
                icon: "card-outline",
              },
            ]}
            value={paymentType}
            onChange={setPaymentType}
          />
          {paymentType === "MOBILE_PAYMENT" ? (
            <TextField
              label="Referencia del pago (puedes enviarla después)"
              icon="receipt-outline"
              keyboardType="number-pad"
              value={paymentReference}
              onChangeText={setPaymentReference}
            />
          ) : null}
          <Button
            label="Pedir viaje"
            icon="bus-outline"
            onPress={handleRequest}
            loading={submitting}
            disabled={total === 0}
          />
        </Card>
      )}
    </Screen>
  );
}
