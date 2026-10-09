import { Link } from "expo-router";
import { useState } from "react";
import { Text } from "react-native";
import { AuthLayout } from "../../components/AuthLayout";
import { Banner } from "../../components/Banner";
import { Button } from "../../components/Button";
import { TextField } from "../../components/TextField";
import { useAuth } from "../../context/AuthContext";
import { styles } from "./auth.styles";

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError("");
    setSubmitting(true);
    try {
      await signUp(name.trim(), phone.trim(), password);
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Crea tu cuenta" subtitle="Solo te tomará un minuto">
      {error ? <Banner tone="error" message={error} /> : null}
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
      <Button label="Registrarme" icon="person-add-outline" onPress={handleSubmit} loading={submitting} />
      <Text style={styles.footer}>
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" style={styles.link}>
          Inicia sesión
        </Link>
      </Text>
    </AuthLayout>
  );
}