"use client";

/**
 * Oturum durumunu, kullanıcı bilgilerini ve anlık bakiye senkronizasyonunu yöneten React hook'u.
 * Sayfa yenilemelerinde FOUC (göz kırpma / oturumsuz görünme) hatasını engellemek için
 * SWR (Stale-While-Revalidate) önbellek deseni kullanır.
 */

import { useState, useEffect, useCallback } from "react";
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

let globalUserCache: AuthenticatedUser | null = null;
let isInitialFetchDone = false;
const listeners = new Set<(user: AuthenticatedUser | null) => void>();

function setGlobalUser(newUser: AuthenticatedUser | null) {
  globalUserCache = newUser;
  isInitialFetchDone = true;
  if (typeof window !== "undefined") {
    try {
      if (newUser) {
        localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(newUser));
      } else {
        localStorage.removeItem(AUTH_CACHE_KEY);
      }
    } catch {
      // localStorage kotaları veya güvenlik hataları sessizce yakalanır
    }
  }
  listeners.forEach((l) => l(newUser));
}

export function useAuth() {
  const [user, setUser] = useState<AuthenticatedUser | null>(() => globalUserCache);
  const [isLoading, setIsLoading] = useState(!globalUserCache && !isInitialFetchDone);

  useEffect(() => {
    listeners.add(setUser);
    return () => {
      listeners.delete(setUser);
    };
  }, []);

  // SSR / Hydration mismatch hatasını önlemek için:
  // İlk render'da sunucu ile istemci aynı başlar, mount olduktan sonra (1ms içinde) cache'den okur
  useEffect(() => {
    if (!globalUserCache) {
      const cached = getCachedUser();
      if (cached) {
        setGlobalUser(cached);
      }
    }
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setGlobalUser(data.user);
      } else {
        setGlobalUser(null);
      }
    } catch {
      setGlobalUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isInitialFetchDone) {
      fetchUser();
    }
  }, [fetchUser]);

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Giriş başarısız");
      setGlobalUser(data.user);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kayıt başarısız");
      setGlobalUser(data.user);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsGuest = async (username: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Misafir girişi başarısız");
      setGlobalUser(data.user);
      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setGlobalUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBalances = useCallback((newCoins: number, newAlimCoins: number) => {
    if (globalUserCache) {
      setGlobalUser({
        ...globalUserCache,
        coins: newCoins,
        alimCoins: newAlimCoins,
      });
    }
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    login,
    register,
    loginAsGuest,
    logout,
    updateBalances,
    refreshUser: fetchUser,
  };
}
