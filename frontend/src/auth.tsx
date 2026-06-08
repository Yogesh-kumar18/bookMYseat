import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, type User } from "./api";

type AuthContextType = {
  user: User | null; loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: Record<string, string>) => Promise<User>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem("bms_token")) return setLoading(false);
    api<User>("/me").then(setUser).catch(() => localStorage.removeItem("bms_token")).finally(() => setLoading(false));
  }, []);

  const value = useMemo(() => ({
    user, loading,
    login: async (email: string, password: string) => {
      const data = await api<{ user: User; token: string }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      localStorage.setItem("bms_token", data.token); setUser(data.user); return data.user;
    },
    register: async (body: Record<string, string>) => {
      const data = await api<{ user: User; token: string }>("/auth/register", { method: "POST", body: JSON.stringify(body) });
      localStorage.setItem("bms_token", data.token); setUser(data.user); return data.user;
    },
    logout: () => { localStorage.removeItem("bms_token"); setUser(null); }
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
