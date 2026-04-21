import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AppRole = "admin" | "pengaju" | "approver";

interface User {
  id: string;
  email: string;
  nama_lengkap: string;
}

interface Profile {
  id: string;
  nama_lengkap: string;
  jabatan: string | null;
  instansi: string | null;
  no_hp: string | null;
  foto_url: string | null;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  profile: Profile | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, meta: { nama_lengkap: string; jabatan?: string; instansi?: string; no_hp?: string }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || "/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async (jwt: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setProfile(data.user); // In our Hono server, user returned from /me is the profile
        setRole(data.role);
      } else {
        signOut();
      }
    } catch (err) {
      console.error("Load profile error:", err);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("auth_token");
    if (savedToken) {
      setToken(savedToken);
      loadData(savedToken).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("auth_token", data.token);
        setToken(data.token);
        setUser(data.user);
        setRole(data.role);
        return { error: null };
      }
      return { error: data.error || "Login failed" };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const signUp = async (email: string, password: string, meta: any) => {
    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, ...meta }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("auth_token", data.token);
        setToken(data.token);
        setUser(data.user);
        setRole("pengaju");
        return { error: null };
      }
      return { error: data.error || "Signup failed" };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  const signOut = async () => {
    localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
    setProfile(null);
    setRole(null);
  };

  const refreshProfile = async () => {
    if (token) await loadData(token);
  };

  return (
    <AuthContext.Provider value={{ user, token, profile, role, loading, signIn, signUp, signOut, refreshProfile, session: null } as any}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
