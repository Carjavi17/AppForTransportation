import { useState } from "react";
import type { NewUserInput, StaffRole } from "../../api/types";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { SegmentedControl } from "../../components/SegmentedControl";
import { TextField } from "../../components/TextField";

type Props = { onCreate: (input: NewUserInput) => Promise<boolean> };

export function CreateUserForm({ onCreate }: Props) {
  const [role, setRole] = useState<StaffRole>("DRIVER");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [plate, setPlate] = useState("");
  const [unit, setUnit] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setSubmitting(true);
    await onCreate({
      name: name.trim(),
      phone: phone.trim(),
      password,
      role,
      ...(role === "DRIVER" ? { plate: plate.trim(), unit: unit.trim() } : {}),
    });
    setSubmitting(false);
  }

  return (
    <Card>
      <SegmentedControl
        options={[
          { value: "DRIVER", label: "Conductor" },
          { value: "DISPATCHER", label: "Controlador" },
          { value: "ADMIN", label: "Admin" },
        ]}
        value={role}
        onChange={setRole}
      />
      <TextField label="Nombre" icon="person-outline" value={name} onChangeText={setName} />
      <TextField
        label="Teléfono"
        icon="call-outline"
        keyboardType="phone-pad"
        autoCapitalize="none"
        autoCorrect={false}
        value={phone}
        onChangeText={setPhone}
      />
      <TextField
        label="Contraseña (mínimo 6 caracteres)"
        icon="lock-closed-outline"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        value={password}
        onChangeText={setPassword}
      />
      {role === "DRIVER" ? (
        <>
          <TextField
            label="Placa"
            icon="car-outline"
            autoCapitalize="characters"
            value={plate}
            onChangeText={setPlate}
          />
          <TextField label="Número de unidad (opcional)" icon="bus-outline" value={unit} onChangeText={setUnit} />
        </>
      ) : null}
      <Button label="Crear" icon="person-add-outline" onPress={handleSubmit} loading={submitting} />
    </Card>
  );
}