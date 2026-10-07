import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../lib/auth";
import PantallaConductor from "../pantallas/Conductor";
import PantallaControlador from "../pantallas/Controlador";
import PantallaUsuario from "../pantallas/Usuario";

export default function Inicio() {
  const { usuario, salir } = useAuth();

  if (usuario?.rol === "USUARIO") return <PantallaUsuario />;
  if (usuario?.rol === "CONDUCTOR") return <PantallaConductor />;
  if (usuario?.rol === "CONTROLADOR" || usuario?.rol === "ADMINISTRADOR")
    return <PantallaControlador />;

  return (
    <View style={estilos.pantalla}>
      <Text style={estilos.titulo}>Hola, {usuario?.nombre}</Text>
      <Text style={estilos.rol}>Perfil: {usuario?.rol}</Text>
      <Pressable style={estilos.boton} onPress={salir}>
        <Text style={estilos.botonTexto}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    gap: 12,
  },
  titulo: { fontSize: 28, fontWeight: "bold" },
  rol: { fontSize: 18, color: "#555" },
  boton: {
    backgroundColor: "#c00",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  botonTexto: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
