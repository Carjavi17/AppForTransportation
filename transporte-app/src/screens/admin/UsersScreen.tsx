import { useCallback, useEffect, useState } from "react";
import { Text } from "react-native";
import {
  changePassword,
  createUser,
  fetchUsers,
  setUserActive,
  updateUser,
} from "../../api/admin";
import type {
  ManagedUser,
  NewUserInput,
  Role,
  UpdateUserInput,
} from "../../api/types";
import { Banner } from "../../components/Banner";
import { Button } from "../../components/Button";
import { FilterChips } from "../../components/FilterChips";
import { GradientHeader } from "../../components/GradientHeader";
import { LoadingScreen } from "../../components/LoadingScreen";
import { Screen } from "../../components/Screen";
import { HeaderActions } from "../../components/HeaderActions";
import { useAuth } from "../../context/AuthContext";
import { ROLE_LABEL } from "../../utils/labels";
import { styles } from "./admin.styles";
import { CreateUserForm } from "./CreateUserForm";
import { UserCard } from "./UserCard";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

type Filter = "ALL" | Role;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "PASSENGER", label: "Pasajeros" },
  { value: "DRIVER", label: "Conductores" },
  { value: "DISPATCHER", label: "Controladores" },
  { value: "ADMIN", label: "Administradores" },
];

export default function UsersScreen() {
  const { user: me, token } = useAuth();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError("");
      setUsers(await fetchUsers(token));
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

  function clearMessages() {
    setNotice("");
    setError("");
  }

  async function handleCreate(input: NewUserInput) {
    if (!token) return false;
    clearMessages();
    try {
      await createUser(token, input);
      setNotice(`${ROLE_LABEL[input.role]} creado: ${input.name}`);
      setShowForm(false);
      await load();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }

  async function handleUpdate(target: ManagedUser, input: UpdateUserInput) {
    if (!token) return false;
    clearMessages();
    try {
      await updateUser(token, target.id, input);
      setNotice(`Datos de ${input.name} actualizados`);
      await load();
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }

  async function handleChangePassword(target: ManagedUser, password: string) {
    if (!token) return false;
    clearMessages();
    try {
      await changePassword(token, target.id, password);
      setNotice(`Contraseña de ${target.name} actualizada`);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }

  async function handleToggleActive(target: ManagedUser) {
    if (!token) return;
    clearMessages();
    try {
      await setUserActive(token, target.id, !target.active);
      setNotice(
        `${target.name} ${target.active ? "desactivado" : "reactivado"}`,
      );
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (loading) return <LoadingScreen />;

  const visible = users.filter((u) => filter === "ALL" || u.role === filter);

  return (
    <Screen
      header={
        <GradientHeader
          title="Usuarios"
          subtitle={`${users.length} registrados`}
          right={<HeaderActions />}
        />
      }
      onRefresh={load}
    >
      {notice ? <Banner tone="success" message={notice} /> : null}
      {error ? <Banner tone="error" message={error} /> : null}

      <Button
        label={showForm ? "Cerrar formulario" : "Crear conductor o personal"}
        variant={showForm ? "secondary" : "primary"}
        icon={showForm ? "close-outline" : "person-add-outline"}
        onPress={() => setShowForm((current) => !current)}
      />
      {showForm ? <CreateUserForm onCreate={handleCreate} /> : null}

      <FilterChips options={FILTERS} value={filter} onChange={setFilter} />

      {visible.length === 0 ? (
        <Text style={styles.empty}>No hay usuarios en esta lista.</Text>
      ) : null}
      {visible.map((u) => (
        <UserCard
          key={u.id}
          user={u}
          isSelf={u.id === me?.id}
          onToggleActive={handleToggleActive}
          onChangePassword={handleChangePassword}
          onUpdate={handleUpdate}
        />
      ))}
    </Screen>
  );
}
