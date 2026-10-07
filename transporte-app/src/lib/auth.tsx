import { almacen } from "./almacen";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "./api";

export type Rol = "USUARIO" | "CONDUCTOR" | "CONTROLADOR" | "ADMINISTRADOR";

export type Usuario = {
  id: number;
  nombre: string;
  telefono: string;
  rol: Rol;
  fotoUrl: string | null;
};

type Contexto = {
  usuario: Usuario | null;
  token: string | null;
  cargando: boolean;
  entrar: (telefono: string, password: string) => Promise<void>;
  registrar: (
    nombre: string,
    telefono: string,
    password: string,
  ) => Promise<void>;
  salir: () => Promise<void>;
};

const AuthContext = createContext<Contexto | null>(null);
const CLAVE = "token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const guardado = await almacen.leer(CLAVE);
        if (guardado) {
          const yo = await api<Usuario>("/auth/yo", { token: guardado });
          setToken(guardado);
          setUsuario(yo);
        }
      } catch {
        await almacen.borrar(CLAVE);
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  async function guardarSesion(t: string, u: Usuario) {
    await almacen.guardar(CLAVE, t);
    setToken(t);
    setUsuario(u);
  }

  async function entrar(telefono: string, password: string) {
    const r = await api<{ token: string; usuario: Usuario }>("/auth/login", {
      metodo: "POST",
      cuerpo: { telefono, password },
    });
    await guardarSesion(r.token, r.usuario);
  }

  async function registrar(nombre: string, telefono: string, password: string) {
    const r = await api<{ token: string; usuario: Usuario }>("/auth/registro", {
      metodo: "POST",
      cuerpo: { nombre, telefono, password },
    });
    await guardarSesion(r.token, r.usuario);
  }

  async function salir() {
    await almacen.borrar(CLAVE);
    setToken(null);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider
      value={{ usuario, token, cargando, entrar, registrar, salir }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
