import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { fetchCurrentUser, login, register, type Session } from "../api/auth";
import { isNetworkError, setUnauthorizedHandler } from "../api/client";
import type { User } from "../api/types";
import { storage } from "../storage/secureStorage";

type AuthContextValue = {
  user: User | null;
  token: string | null;
  loading: boolean;
  sessionMessage: string | null;
  signIn: (phone: string, password: string) => Promise<void>;
  signUp: (name: string, phone: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updatePhoto: (photoUrl: string | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const TOKEN_KEY = "token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionMessage, setSessionMessage] = useState<string | null>(null);

  // The server said our session is no longer valid: go back to the login screen
  useEffect(() => {
    setUnauthorizedHandler(() => {
      storage.remove(TOKEN_KEY);
      setToken(null);
      setUser(null);
      setSessionMessage("Tu sesión terminó. Inicia sesión de nuevo.");
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Restore the saved session. If the server is unreachable, keep the token and retry.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const saved = await storage.read(TOKEN_KEY);
      if (!saved) {
        setLoading(false);
        return;
      }
      while (!cancelled) {
        try {
          const current = await fetchCurrentUser(saved);
          if (!cancelled) {
            setUser(current);
            setToken(saved);
          }
          break;
        } catch (e) {
          if (isNetworkError(e)) {
            await new Promise((resolve) => setTimeout(resolve, 3000));
            continue;
          }
          await storage.remove(TOKEN_KEY);
          break;
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function startSession(session: Session) {
    await storage.save(TOKEN_KEY, session.token);
    setSessionMessage(null);
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
    setSessionMessage(null);
    setToken(null);
    setUser(null);
  }

  function updatePhoto(photoUrl: string | null) {
    setUser((current) => (current ? { ...current, photoUrl } : current));
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        sessionMessage,
        signIn,
        signUp,
        signOut,
        updatePhoto,
      }}
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
