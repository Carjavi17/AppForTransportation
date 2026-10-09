import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { fetchCurrentUser, login, register, type Session } from "../api/auth";
import type { User } from "../api/types";
import { storage } from "../storage/secureStorage";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (phone: string, password: string) => Promise<void>;
  signUp: (name: string, phone: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = "token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await storage.read(TOKEN_KEY);
        if (saved) {
          setUser(await fetchCurrentUser(saved));
          setToken(saved);
        }
      } catch {
        await storage.remove(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function startSession(session: Session) {
    await storage.save(TOKEN_KEY, session.token);
    setToken(session.token);
    setUser(session.user);
  }

  async function signIn(phone: string, password: string) {
    await startSession(await login(phone, password));
  }

  async function signUp(name: string, phone: string, password: string) {
    await startSession(await register(name, phone, password));
  }

  async function signOut() {
    await storage.remove(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
