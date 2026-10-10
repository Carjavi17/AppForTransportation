import { Link } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";
import { AuthLayout } from "../../components/AuthLayout";
import { Banner } from "../../components/Banner";
import { Button } from "../../components/Button";
import { TextField } from "../../components/TextField";
import { useAuth } from "../../context/AuthContext";
import { styles } from "./auth.styles";

export default function LoginScreen() {
  const { signIn, sessionMessage } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError("");
    setSubmitting(true);
    try {
      await signIn(phone.trim(), password);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="¡Bienvenido a RutasT!"
      subtitle="Inicia sesión para pedir tu unidad"
    >
      {sessionMessage ? (
        <Banner tone="warning" message={sessionMessage} />
      ) : null}
      {error ? <Banner tone="error" message={error} /> : null}
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
        label="Contraseña"
        icon="lock-closed-outline"
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
        value={password}
        onChangeText={setPassword}
      />
      <Button
        label="Entrar"
        icon="log-in-outline"
        onPress={handleSubmit}
        loading={submitting}
      />
      <Text style={styles.footer}>
        ¿No tienes cuenta?{" "}
        <Link href="/register" style={styles.link}>
          Regístrate
        </Link>
      </Text>
    </AuthLayout>
  );
}
