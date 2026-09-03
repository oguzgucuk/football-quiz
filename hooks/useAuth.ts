"use client";

import { useState, useEffect, useCallback } from "react";
import { AuthenticatedUser } from "@/lib/auth/session";

let globalUserCache: AuthenticatedUser | null = null;
let isInitialFetchDone = false;
const listeners = new Set<(user: AuthenticatedUser | null) => void>();

function setGlobalUser(newUser: AuthenticatedUser | null) {
  globalUserCache = newUser;
  isInitialFetchDone = true;
  listeners.forEach((l) => l(newUser));
}

export function useAuth() {
  const [user, setUser] = useState<AuthenticatedUser | null>(() => globalUserCache);
  const [isLoading, setIsLoading] = useState(!isInitialFetchDone);

  useEffect(() => {
    listeners.add(setUser);
    return () => {
      listeners.delete(setUser);
    };
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

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    loginAsGuest,
    logout,
    refreshUser: fetchUser,
  };
}
