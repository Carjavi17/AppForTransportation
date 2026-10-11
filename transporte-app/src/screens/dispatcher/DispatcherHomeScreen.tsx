import { useCallback, useEffect, useMemo, useState } from "react";
import { Text } from "react-native";
import { isNetworkError } from "../../api/client";
import {
  assignTrip,
  fetchActiveTrips,
  fetchAvailableDrivers,
  unassignTrip,
} from "../../api/dispatch";
import { EVENTS } from "../../api/events";
import type { AvailableDriver, DispatcherTrip } from "../../api/types";
import { Banner } from "../../components/Banner";
import { Button } from "../../components/Button";
import { GradientHeader } from "../../components/GradientHeader";
import { LoadingScreen } from "../../components/LoadingScreen";
import { Screen } from "../../components/Screen";
import { HeaderActions } from "../../components/HeaderActions";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../hooks/useSocket";
import { distanceKm } from "../../utils/geo";
import { DriverCard } from "./DriverCard";
import { TripCard } from "./TripCard";
import { styles } from "./dispatcher.styles";
import { mapLocationEvent } from "../../api/mappers";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import { useNotificationSetup } from "../../hooks/useNotificationSetup";
import { notify } from "../../utils/notify";

export default function DispatcherHomeScreen() {
  const { user, token } = useAuth();

  const [trips, setTrips] = useState<DispatcherTrip[]>([]);
  const [drivers, setDrivers] = useState<AvailableDriver[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError("");
      const [activeTrips, availableDrivers] = await Promise.all([
        fetchActiveTrips(token),
        fetchAvailableDrivers(token),
      ]);
      setTrips(activeTrips);
      setDrivers(availableDrivers);
      setSelectedId((current) =>
        current !== null && activeTrips.some((t) => t.id === current)
          ? current
          : null,
      );
    } catch (e) {
      // The connection banner already shows network problems
      if (!isNetworkError(e)) setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  useAutoRefresh(load);

  useNotificationSetup();

  const socketConnected = useSocket(
    token,
    {
      [EVENTS.tripRequested]: () => {
        setNotice("Llegó una solicitud nueva");
        notify("Solicitud nueva", "Llegó una solicitud de viaje");
        load();
      },
      [EVENTS.tripUpdated]: () => {
        load();
      },
      [EVENTS.driverStatus]: () => {
        load();
      },
      [EVENTS.driverLocation]: (data) => {
        const location = mapLocationEvent(data);
        setDrivers((current) =>
          current.map((driver) =>
            driver.id === location.driverId
              ? {
                  ...driver,
                  latitude: location.latitude,
                  longitude: location.longitude,
                }
              : driver,
          ),
        );
      },
    },
    load,
  );

  const selected = trips.find((trip) => trip.id === selectedId) ?? null;
  const pendingTrips = trips.filter((trip) => trip.status === "REQUESTED");
  const ongoingTrips = trips.filter((trip) => trip.status !== "REQUESTED");

  const rankedDrivers = useMemo(() => {
    const list = drivers.map((driver) => ({
      driver,
      km:
        selected && driver.latitude != null && driver.longitude != null
          ? distanceKm(
              selected.originLatitude,
              selected.originLongitude,
              driver.latitude,
              driver.longitude,
            )
          : null,
    }));
    return selected
      ? list.sort((a, b) => (a.km ?? Infinity) - (b.km ?? Infinity))
      : list;
  }, [drivers, selected]);

  function toggleSelection(tripId: number) {
    setSelectedId((current) => (current === tripId ? null : tripId));
  }

  async function handleAssign(driver: AvailableDriver) {
    if (!token || !selected) return;
    setError("");
    setNotice("");
    try {
      await assignTrip(token, selected.id, driver.id);
      setNotice(`Viaje de ${selected.passengerName} asignado a ${driver.name}`);
      setSelectedId(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function handleUnassign() {
    if (!token || !selected) return;
    setError("");
    setNotice("");
    try {
      await unassignTrip(token, selected.id);
      setNotice(`${selected.passengerName} volvió a la lista de solicitudes`);
      setSelectedId(null);
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!user || loading) return <LoadingScreen />;

  return (
    <Screen
      header={
        <GradientHeader
          title="Operación"
          subtitle={`${pendingTrips.length} ${pendingTrips.length === 1 ? "solicitud" : "solicitudes"} · ${drivers.length} ${drivers.length === 1 ? "conductor" : "conductores"}`}
          right={<HeaderActions />}
        />
      }
      onRefresh={load}
      socketConnected={socketConnected}
    >
      {notice ? <Banner tone="success" message={notice} /> : null}
      {error ? <Banner tone="error" message={error} /> : null}
      {selected ? (
        <>
          <Banner
            tone="info"
            message={`Moviendo el viaje de ${selected.passengerName} (${selected.passengers}). Elige un conductor abajo.`}
          />
          {selected.driver ? (
            <Button
              label={`Quitar de ${selected.driver.name} y devolver a solicitudes`}
              variant="danger"
              icon="arrow-undo-outline"
              onPress={handleUnassign}
            />
          ) : null}
        </>
      ) : null}

      <Text style={styles.sectionTitle}>
        Solicitudes nuevas ({pendingTrips.length})
      </Text>
      {pendingTrips.length === 0 ? (
        <Text style={styles.empty}>No hay solicitudes por ahora.</Text>
      ) : null}
      {pendingTrips.map((trip) => (
        <TripCard
          key={trip.id}
          trip={trip}
          selected={trip.id === selectedId}
          onPress={() => toggleSelection(trip.id)}
        />
      ))}

      <Text style={styles.sectionTitle}>
        Conductores conectados ({drivers.length})
      </Text>
      {drivers.length === 0 ? (
        <Text style={styles.empty}>No hay conductores conectados.</Text>
      ) : null}
      {rankedDrivers.map(({ driver, km }) => (
        <DriverCard
          key={driver.id}
          driver={driver}
          distanceKm={km}
          hasSelection={selected !== null}
          isCurrent={selected?.driver?.id === driver.id}
          onAssign={() => handleAssign(driver)}
        />
      ))}

      <Text style={styles.sectionTitle}>En marcha ({ongoingTrips.length})</Text>
      {ongoingTrips.length === 0 ? (
        <Text style={styles.empty}>No hay viajes en marcha.</Text>
      ) : null}
      {ongoingTrips.map((trip) => (
        <TripCard
          key={trip.id}
          trip={trip}
          selected={trip.id === selectedId}
          onPress={() => toggleSelection(trip.id)}
        />
      ))}
      {ongoingTrips.length > 0 ? (
        <Text style={styles.hint}>
          Toca un viaje para pasarlo a otro conductor o devolverlo a
          solicitudes.
        </Text>
      ) : null}
    </Screen>
  );
}
