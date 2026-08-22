"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "./lib";
import { useRealtime } from "./realtime";
import { dispatchEvent } from "./eventbus";
import type { CurrentUser, SettingsBundle } from "@/lib/types";

type Toast = { id: number; text: string; kind: "success" | "error" | "info" | "loading" };

type Ctx = {
  me: CurrentUser | null;
  initializing: boolean;
  settings: SettingsBundle;
  toasts: Toast[];
  toast: (text: string, kind?: Toast["kind"]) => void;
  dismissToast: (id: number) => void;
  login: (identifier: string, password: string) => Promise<void>;
  register: (data: { displayName: string; username: string; email?: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  updateProfile: (patch: Record<string, unknown>) => Promise<void>;
};

const AppCtx = createContext<Ctx | null>(null);

export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp must be used within AppProvider");
  return c;
};

let toastId = 0;

export function AppProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<CurrentUser | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [settings, setSettings] = useState<SettingsBundle>({ privacy: null, chat: null, notifications: null });
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (text: string, kind: Toast["kind"] = "success") => {
      const id = ++toastId;
      setToasts((t) => [...t, { id, text, kind }]);
      setTimeout(() => dismissToast(id), kind === "loading" ? 2500 : 3200);
    },
    [dismissToast]
  );

  const refreshMe = useCallback(async () => {
    try {
      const d = await api.get<{ user: CurrentUser; settings: SettingsBundle }>("/api/me");
      setMe(d.user);
      setSettings(d.settings);
    } catch {
      setMe(null);
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refreshMe();
      setInitializing(false);
    })();
  }, [refreshMe]);

  // connect realtime and forward to the event bus
  useRealtime((e) => dispatchEvent(e.type, e.data, e.ts));

  const login = useCallback(async (identifier: string, password: string) => {
    await api.post("/api/auth/login", { identifier, password });
    await refreshMe();
  }, [refreshMe]);

  const register = useCallback(async (d: { displayName: string; username: string; email?: string; password: string }) => {
    await api.post("/api/auth/register", d);
    await refreshMe();
  }, [refreshMe]);

  const logout = useCallback(async () => {
    await api.post("/api/auth/logout").catch(() => {});
    setMe(null);
  }, []);

  const updateProfile = useCallback(async (patch: Record<string, unknown>) => {
    const d = await api.patch<{ user: CurrentUser }>("/api/me", patch);
    setMe(d.user);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ me, initializing, settings, toasts, toast, dismissToast, login, register, logout, refreshMe, updateProfile }),
    [me, initializing, settings, toasts, toast, dismissToast, login, register, logout, refreshMe, updateProfile]
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
