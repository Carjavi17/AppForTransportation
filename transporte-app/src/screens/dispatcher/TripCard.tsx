import { Pressable, Text, View } from "react-native";
import type { DispatcherTrip } from "../../api/types";
import { Avatar } from "../../components/Avatar";
import { Badge } from "../../components/Badge";
import { Card } from "../../components/Card";
import { InfoRow } from "../../components/InfoRow";
import { PAYMENT_LABEL, describePassengers } from "../../utils/labels";
import { minutesSince } from "../../utils/time";
import { styles } from "./dispatcher.styles";

type Props = { trip: DispatcherTrip; selected: boolean; onPress: () => void };

export function TripCard({ trip, selected, onPress }: Props) {
  const badge =
    trip.status === "REQUESTED"
      ? {
          label: `Esperando ${minutesSince(trip.createdAt)} min`,
          tone: "warning" as const,
        }
      : trip.status === "ASSIGNED"
        ? { label: "Asignado", tone: "info" as const }
        : { label: "En curso", tone: "success" as const };

  const payment =
    trip.paymentType === "CASH"
      ? PAYMENT_LABEL.CASH
      : `${PAYMENT_LABEL.MOBILE_PAYMENT} · ref. ${trip.paymentReference ?? "pendiente"}`;

  return (
    <Pressable onPress={onPress}>
      <Card highlighted={selected}>
        <View style={styles.header}>
          <Avatar
            name={trip.passengerName}
            photoUrl={trip.passengerPhotoUrl}
            size={48}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{trip.passengerName}</Text>
            <Badge label={badge.label} tone={badge.tone} />
          </View>
        </View>
        <InfoRow
          icon="people-outline"
          text={describePassengers(trip.passengers, trip.students)}
        />

        <InfoRow
          icon={trip.paymentType === "CASH" ? "cash-outline" : "card-outline"}
          text={payment}
        />
        {trip.originReference ? (
          <InfoRow icon="pin-outline" text={trip.originReference} />
        ) : null}
        {trip.driver ? (
          <InfoRow icon="bus-outline" text={`Conductor: ${trip.driver.name}`} />
        ) : null}
      </Card>
    </Pressable>
  );
}
