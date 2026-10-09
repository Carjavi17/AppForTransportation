import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import type { ManagedUser, Role, UpdateUserInput } from "../../api/types";
import { Avatar } from "../../components/Avatar";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { InfoRow } from "../../components/InfoRow";
import { TextField } from "../../components/TextField";
import { ROLE_LABEL } from "../../utils/labels";
import { styles } from "./admin.styles";

type Mode = "none" | "edit" | "password";

const ROLE_TONE = { PASSENGER: "info", DRIVER: "primary", DISPATCHER: "warning", ADMIN: "success" } as const;

type Props = {
  user: ManagedUser;
  isSelf: boolean;
  onToggleActive: (user: ManagedUser) => Promise<void>;
  onChangePassword: (user: ManagedUser, password: string) => Promise<boolean>;
  onUpdate: (user: ManagedUser, input: UpdateUserInput) => Promise<boolean>;
};

export function UserCard({ user, isSelf, onToggleActive, onChangePassword, onUpdate }: Props) {
  const [mode, setMode] = useState<Mode>("none");
  const [confirming, setConfirming] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [plate, setPlate] = useState(user.driver?.plate ?? "");
  const [unit, setUnit] = useState(user.driver?.unit ?? "");
  const [password, setPassword] = useState("");

  function openEdit() {
    if (mode === "edit") {
      setMode("none");
      return;
    }
    setName(user.name);
    setPhone(user.phone);
    setPlate(user.driver?.plate ?? "");
    setUnit(user.driver?.unit ?? "");
    setMode("edit");
  }

  function openPassword() {
    setPassword("");
    setMode(mode === "password" ? "none" : "password");
  }

  async function handleToggle() {
    if (user.active && !confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    await onToggleActive(user);
  }

  async function handleSaveEdit() {
    const ok = await onUpdate(user, {
      name: name.trim(),
      phone: phone.trim(),
      ...(user.driver ? { plate: plate.trim(), unit: unit.trim() } : {}),
    });
    if (ok) setMode("none");
  }

  async function handleSavePassword() {
    const ok = await onChangePassword(user, password);
    if (ok) {
      setPassword("");
      setMode("none");
    }
  }

  const role: Role = user.role;

  return (
    <Card>
      <View style={styles.header}>
        <Avatar name={user.name} photoUrl={user.photoUrl} size={48} />
        <View style={[styles.headerInfo, !user.active && styles.dimmed]}>
          <Text style={styles.name}>{user.name}</Text>
          <View style={styles.badges}>
            <Badge label={ROLE_LABEL[role]} tone={ROLE_TONE[role]} />
            {!user.active ? <Badge label="Desactivado" tone="neutral" /> : null}
          </View>
        </View>
      </View>

      <InfoRow icon="call-outline" text={user.phone} />
      {user.driver ? (
        <InfoRow
          icon="bus-outline"
          text={`Placa ${user.driver.plate}${user.driver.unit ? ` · Unidad ${user.driver.unit}` : ""} · ${user.driver.connected ? "Conectado" : "Desconectado"}`}
        />
      ) : null}

      <View style={styles.actions}>
        <Pressable onPress={openEdit}>
          <Text style={styles.actionLink}>Editar</Text>
        </Pressable>
        <Pressable onPress={openPassword}>
          <Text style={styles.actionLink}>Cambiar contraseña</Text>
        </Pressable>
        {!isSelf ? (
          <Pressable onPress={handleToggle}>
            <Text style={user.active ? styles.actionDanger : styles.actionLink}>
              {confirming ? "Toca otra vez para confirmar" : user.active ? "Desactivar" : "Reactivar"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {mode === "edit" ? (
        <View style={styles.panel}>
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
          {user.driver ? (
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
          <Button label="Guardar cambios" icon="save-outline" onPress={handleSaveEdit} />
        </View>
      ) : null}

      {mode === "password" ? (
        <View style={styles.panel}>
          <TextField
            label="Nueva contraseña"
            icon="lock-closed-outline"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            value={password}
            onChangeText={setPassword}
          />
          <Button label="Guardar contraseña" icon="key-outline" onPress={handleSavePassword} />
        </View>
      ) : null}
    </Card>
  );
}