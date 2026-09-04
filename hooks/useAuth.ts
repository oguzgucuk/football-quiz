"use client";

/**
 * Oturum durumunu, kullanıcı bilgilerini ve anlık bakiye senkronizasyonunu yöneten React hook'u.
 * useSyncExternalStore mimarisi ile bileşenler arası tam senkronizasyon,
 * SSR hydration güvenliği ve otomatik önbellek revalidasyonu sağlar.
 */

import { useSyncExternalStore, useCallback, useEffect } from "react";
import { AuthenticatedUser } from "@/lib/auth/session";

const AUTH_CACHE_KEY = "football_auth_user";

function getCachedUser(): AuthenticatedUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

interface AuthState {
  user: AuthenticatedUser | null;
  isLoading: boolean;
}

// SSR ve ilk client hydration render'ı için kararlı sunucu snapshot'ı
const SERVER_SNAPSHOT: AuthState = {
  user: null,
  isLoading: true,
};

// Client tarafı global snapshot (tüm bileşenler aynı referansı paylaşır)
let clientSnapshot: AuthState = {
  user: null,
  isLoading: true,
};

// Tarayıcı ortamında varsa önbellekten derhal yükle
if (typeof window !== "undefined") {
  const cached = getCachedUser();
  clientSnapshot = {
    user: cached,
    isLoading: !cached,
  };
}

const listeners = new Set<() => void>();

function notifyAll() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.error("[useAuth] Listener error:", err);
    }
  });
}

export function updateAuthState(patch: Partial<AuthState>) {
  const newUser = patch.user !== undefined ? patch.user : clientSnapshot.user;
  const newLoading = patch.isLoading !== undefined ? patch.isLoading : clientSnapshot.isLoading;

  clientSnapshot = {
    user: newUser,
    isLoading: newLoading,
  };

  if (typeof window !== "undefined") {
    try {
      if (newUser) {
        localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(newUser));
      } else {
        localStorage.removeItem(AUTH_CACHE_KEY);
      }
    } catch {
      // localStorage kota/güvenlik hataları yutulur
    }
  }

  notifyAll();
}

// Depolama olaylarını dinle (farklı sekmeler arası senkronizasyon)
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === AUTH_CACHE_KEY) {
      const cached = getCachedUser();
      updateAuthState({ user: cached, isLoading: false });
    }
  });
}

// In-flight /api/auth/me isteklerini tekilleştir
let activeFetchPromise: Promise<AuthenticatedUser | null> | null = null;
let hasInitialFetchCompleted = false;

async function fetchCurrentUser(): Promise<AuthenticatedUser | null> {
  if (activeFetchPromise) return activeFetchPromise;

  activeFetchPromise = (async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        updateAuthState({ user: data.user, isLoading: false });
        hasInitialFetchCompleted = true;
        return data.user;
      } else {
        updateAuthState({ user: null, isLoading: false });
        hasInitialFetchCompleted = true;
        return null;
      }
    } catch {
      updateAuthState({ user: null, isLoading: false });
      hasInitialFetchCompleted = true;
      return null;
    } finally {
      activeFetchPromise = null;
    }
  })();

  return activeFetchPromise;
}

export function useAuth() {
  const state = useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },
    () => clientSnapshot,
    () => SERVER_SNAPSHOT
  );

  useEffect(() => {
    if (!hasInitialFetchCompleted && !activeFetchPromise) {
      fetchCurrentUser();
    }
  }, []);

  const login = async (identifier: string, password: string) => {
    updateAuthState({ isLoading: true });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Giriş başarısız");
      updateAuthState({ user: data.user, isLoading: false });
      return data.user;
    } catch (err) {
      updateAuthState({ isLoading: false });
      throw err;
    }
  };

  const register = async (username: string, email: string, password: string) => {
    updateAuthState({ isLoading: true });
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kayıt başarısız");
      updateAuthState({ user: data.user, isLoading: false });
      return data.user;
    } catch (err) {
      updateAuthState({ isLoading: false });
      throw err;
    }
  };

  const loginAsGuest = async (username: string) => {
    updateAuthState({ isLoading: true });
    try {
      const res = await fetch("/api/auth/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Misafir girişi başarısız");
      updateAuthState({ user: data.user, isLoading: false });
      return data.user;
    } catch (err) {
      updateAuthState({ isLoading: false });
      throw err;
    }
  };

  const logout = async () => {
    updateAuthState({ isLoading: true });
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      updateAuthState({ user: null, isLoading: false });
    } catch {
      updateAuthState({ user: null, isLoading: false });
    }
  };

  const updateBalances = useCallback((newCoins: number, newAlimCoins: number) => {
    if (clientSnapshot.user) {
      updateAuthState({
        user: {
          ...clientSnapshot.user,
          coins: newCoins,
          alimCoins: newAlimCoins,
        },
      });
    }
  }, []);

  return {
    user: state.user,
    isLoading: state.isLoading,
    isAuthenticated: Boolean(state.user),
    login,
    register,
    loginAsGuest,
    logout,
    updateBalances,
    refreshUser: fetchCurrentUser,
  };
}
