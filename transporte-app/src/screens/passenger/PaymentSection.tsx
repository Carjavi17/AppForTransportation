import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { PaymentType } from "../../api/types";
import { Banner } from "../../components/Banner";
import { Button } from "../../components/Button";
import { InfoRow } from "../../components/InfoRow";
import { TextField } from "../../components/TextField";
import { styles } from "./passenger.styles";

type Props = {
  paymentType: PaymentType;
  reference: string | null;
  onSubmit: (reference: string) => Promise<boolean>;
};

export function PaymentSection({ paymentType, reference, onSubmit }: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);

  const needsReference = paymentType === "MOBILE_PAYMENT" && !reference;
  const showForm = needsReference || open;

  const summary =
    paymentType === "CASH"
      ? "Efectivo"
      : reference
        ? `Pago móvil · ref. ${reference}`
        : "Pago móvil · referencia pendiente";

  async function handleSend() {
    setSending(true);
    const ok = await onSubmit(value.trim());
    setSending(false);
    if (ok) {
      setValue("");
      setOpen(false);
    }
  }

  return (
    <View style={styles.paymentBox}>
      <InfoRow icon={paymentType === "CASH" ? "cash-outline" : "card-outline"} text={summary} />
      {needsReference ? <Banner tone="warning" message="Falta tu referencia de pago móvil" /> : null}
      {showForm ? (
        <>
          <TextField
            label="Número de referencia"
            icon="receipt-outline"
            keyboardType="number-pad"
            value={value}
            onChangeText={setValue}
          />
          <Button label="Enviar referencia" icon="send-outline" onPress={handleSend} loading={sending} />
        </>
      ) : (
        <Pressable onPress={() => setOpen(true)}>
          <Text style={styles.paymentLink}>
            {paymentType === "CASH" ? "Prefiero pagar con pago móvil" : "Cambiar la referencia"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}