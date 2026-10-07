import { Link } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useAuth } from "../lib/auth";

export default function Registro() {
  const { registrar } = useAuth();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar() {
    setError("");
    setEnviando(true);
    try {
      await registrar(nombre.trim(), telefono.trim(), password);
    } catch (e) {
      setError((e as Error).message);
      setEnviando(false);
    }
  }

  return (
    <View style={estilos.pantalla}>
      <Text style={estilos.titulo}>Crear cuenta</Text>
      <TextInput style={estilos.campo} placeholder="Nombre" value={nombre} onChangeText={setNombre} />
      <TextInput
        style={estilos.campo}
        placeholder="Teléfono"
        keyboardType="phone-pad"
        value={telefono}
        onChangeText={setTelefono}
      />
      <TextInput
        style={estilos.campo}
        placeholder="Contraseña (mínimo 6 caracteres)"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={estilos.error}>{error}</Text> : null}
      <Pressable style={estilos.boton} onPress={enviar} disabled={enviando}>
        {enviando ? <ActivityIndicator color="#fff" /> : <Text style={estilos.botonTexto}>Registrarme</Text>}
      </Pressable>
      <Link href="/login" style={estilos.enlace}>
        ¿Ya tienes cuenta? Inicia sesión
      </Link>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, justifyContent: "center", padding: 24, gap: 12 },
  titulo: { fontSize: 28, fontWeight: "bold", marginBottom: 12 },
  campo: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, fontSize: 16 },
  error: { color: "#c00" },
  boton: { backgroundColor: "#1a73e8", borderRadius: 8, padding: 14, alignItems: "center" },
  botonTexto: { color: "#fff", fontSize: 16, fontWeight: "600" },
  enlace: { textAlign: "center", color: "#1a73e8", marginTop: 8 },
});