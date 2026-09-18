"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, setTokens, clearTokens, getAccessToken, ApiError } from "@/lib/api";

export type User = {
  id: string;
  full_name: string;
  email: string;
  role: "student" | "admin";
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    if (!getAccessToken()) {
      setLoading(false);
      return;
    }
    try {
      const me = await api.get<{ user_id: string; role: string }>("/me", true);
      setUser((prev) =>
        prev ?? { id: me.user_id, full_name: "", email: "", role: me.role as User["role"] }
      );
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  async function login(email: string, password: string) {
    const data = await api.post<{
      user: User;
      access_token: string;
      refresh_token: string;
    }>("/auth/login", { email, password });
    setTokens(data.access_token, data.refresh_token);
    setUser(data.user);
  }

  async function signup(fullName: string, email: string, password: string) {
    await api.post("/auth/signup", { full_name: fullName, email, password });
    await login(email, password);
  }

  function logout() {
    clearTokens();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiError };
