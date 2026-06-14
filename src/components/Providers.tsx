"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { api, getToken } from "@/lib/api";

interface User {
  id: string;
  email: string;
  role: string;
  profilePicture?: string | null;
}

interface AppContextValue {
  user: User | null;
  loading: boolean;
  settings: any | null;
  refreshUser: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  applyTheme: (settings: any) => void;
  setUser: (u: User | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within Providers");
  return ctx;
}

export function Providers({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const applyTheme = useCallback((s: any) => {
    if (!s) return;
    const root = document.documentElement;
    if (s.primaryColor) root.style.setProperty("--color-primary", s.primaryColor);
    if (s.secondaryColor)
      root.style.setProperty("--color-secondary", s.secondaryColor);
    if (s.accentColor) root.style.setProperty("--color-accent", s.accentColor);
    if (s.theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      return;
    }
    try {
      const { user } = await api<{ user: User }>("/api/auth/me");
      setUser(user);
    } catch {
      setUser(null);
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    if (!getToken()) return;
    try {
      const s = await api("/api/settings");
      setSettings(s);
      applyTheme(s);
    } catch {
      /* ignore */
    }
  }, [applyTheme]);

  useEffect(() => {
    (async () => {
      await refreshUser();
      await refreshSettings();
      setLoading(false);
    })();
  }, [refreshUser, refreshSettings]);

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        settings,
        refreshUser,
        refreshSettings,
        applyTheme,
        setUser,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
