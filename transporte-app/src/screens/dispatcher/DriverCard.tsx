import { Text, View } from "react-native";
import type { AvailableDriver } from "../../api/types";
import { Avatar } from "../../components/Avatar";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { InfoRow } from "../../components/InfoRow";
import { formatDistance } from "../../utils/geo";
import { styles } from "./dispatcher.styles";

type Props = {
  driver: AvailableDriver;
  distanceKm: number | null;
  hasSelection: boolean;
  isCurrent: boolean;
  onAssign: () => void;
};

export function DriverCard({ driver, distanceKm, hasSelection, isCurrent, onAssign }: Props) {
  const load = driver.loadPassengers;
  const buttonLabel = !hasSelection
    ? "Selecciona un viaje primero"
    : isCurrent
      ? "Ya está con este conductor"
      : "Asignar a este conductor";

  return (
    <Card>
      <View style={styles.header}>
        <Avatar name={driver.name} photoUrl={driver.photoUrl} size={48} />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{driver.name}</Text>
          <Badge label={`Placa ${driver.plate}${driver.unit ? ` · Unidad ${driver.unit}` : ""}`} tone="info" />
        </View>
      </View>
      <InfoRow icon="people-outline" text={`Lleva ${load} ${load === 1 ? "pasajero" : "pasajeros"}`} />
      {distanceKm != null ? (
        <InfoRow icon="navigate-outline" text={`A ${formatDistance(distanceKm)} del pasajero`} />
      ) : hasSelection ? (
        <InfoRow icon="navigate-outline" text="Sin ubicación reportada" />
      ) : null}
      <Button
        label={buttonLabel}
        icon="checkmark-circle-outline"
        onPress={onAssign}
        disabled={!hasSelection || isCurrent}
      />
    </Card>
  );
}