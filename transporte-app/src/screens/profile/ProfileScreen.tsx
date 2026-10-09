import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";
import { removePhoto, uploadPhoto } from "../../api/profile";
import { Avatar } from "../../components/Avatar";
import { Badge } from "../../components/Badge";
import { Banner } from "../../components/Banner";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { GradientHeader } from "../../components/GradientHeader";
import { Screen } from "../../components/Screen";
import { useAuth } from "../../context/AuthContext";
import { ROLE_LABEL } from "../../utils/labels";
import { styles } from "./profile.styles";

export default function ProfileScreen() {
  const { user, token, updatePhoto } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  if (!user) return null;

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  async function handleChangePhoto() {
    if (!token) return;
    setError("");
    setNotice("");
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.4,
      base64: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      setError("No se pudo leer la imagen");
      return;
    }
    setBusy(true);
    try {
      const url = await uploadPhoto(
        token,
        `data:${asset.mimeType ?? "image/jpeg"};base64,${asset.base64}`,
      );
      updatePhoto(url);
      setNotice("Foto actualizada");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRemovePhoto() {
    if (!token) return;
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await removePhoto(token);
      updatePhoto(null);
      setNotice("Foto eliminada");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      header={
        <GradientHeader title="Mi perfil" subtitle="Tus datos y tu foto" />
      }
    >
      {notice ? <Banner tone="success" message={notice} /> : null}
      {error ? <Banner tone="error" message={error} /> : null}

      <Card style={styles.card}>
        <Avatar name={user.name} photoUrl={user.photoUrl} size={120} />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.phone}>{user.phone}</Text>
        <Badge label={ROLE_LABEL[user.role]} />
      </Card>

      <Button
        label={user.photoUrl ? "Cambiar foto" : "Subir foto"}
        icon="camera-outline"
        onPress={handleChangePhoto}
        loading={busy}
      />
      {user.photoUrl ? (
        <Button
          label="Quitar foto"
          variant="secondary"
          icon="trash-outline"
          onPress={handleRemovePhoto}
          disabled={busy}
        />
      ) : null}
      <Button
        label="Volver"
        variant="soft"
        icon="arrow-back-outline"
        onPress={goBack}
      />
    </Screen>
  );
}
