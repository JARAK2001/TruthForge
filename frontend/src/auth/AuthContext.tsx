import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  api,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
  type Session,
  type SessionUser
} from "../lib/api";

interface AuthState {
  user: SessionUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  handleExpired: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

function applySession(s: Session): SessionUser {
  setAccessToken(s.accessToken);
  setRefreshToken(s.refreshToken);
  return s.user;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => {
    const refresh = getRefreshToken();
    setAccessToken(undefined);
    setRefreshToken(null);
    setUser(null);
    if (refresh) {
      void api("/auth/logout", { method: "POST", body: JSON.stringify({ refreshToken: refresh }) }).catch(() => {
        // salir siempre funciona aunque falle la red
      });
    }
  }, []);

  const handleExpired = useCallback(() => {
    setAccessToken(undefined);
    setRefreshToken(null);
    setUser(null);
  }, []);

  // Rehidrata con el refresh guardado (access vive solo en memoria).
  useEffect(() => {
    if (!getRefreshToken()) {
      setReady(true);
      return;
    }
    void api<{ accessToken: string; refreshToken: string }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken: getRefreshToken() })
    })
      .then(async (s) => {
        setAccessToken(s.accessToken);
        setRefreshToken(s.refreshToken);
        const me = await api<SessionUser>("/auth/me");
        setUser(me);
      })
      .catch(() => handleExpired())
      .finally(() => setReady(true));
  }, [handleExpired]);

  const login = useCallback(async (email: string, password: string) => {
    const s = await api<Session>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
    setUser(applySession(s));
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const s = await api<Session>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });
    setUser(applySession(s));
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, register, logout, handleExpired }),
    [user, ready, login, register, logout, handleExpired]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth fuera de AuthProvider");
  return ctx;
}
