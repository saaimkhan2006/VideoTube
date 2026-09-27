import { createContext, useContext, useEffect, useState } from "react";
import {
  clearTokens,
  setTokens,
  usersApi,
  getAccessToken,
} from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      if (!getAccessToken()) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const res = await usersApi.current();
        if (!cancelled) setUser(res.data);
      } catch {
        clearTokens();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, []);

  async function login(credentials) {
    const res = await usersApi.login(credentials);
    setTokens(res.data.accessToken, res.data.refreshToken);
    setUser(res.data.user);
    return res.data.user;
  }

  async function register(formData) {
    await usersApi.register(formData);
    const email = formData.get("email");
    const password = formData.get("password");
    return login({ email, password });
  }

  async function logout() {
    try {
      await usersApi.logout();
    } catch {
      /* ignore */
    }
    clearTokens();
    setUser(null);
  }

  async function refreshUser() {
    const res = await usersApi.current();
    setUser(res.data);
    return res.data;
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
