"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  ApiError,
  authApi,
  clearSession,
  getStoredToken,
  getStoredUser,
  storeSession,
  storeUser,
} from "@/lib/api";
import { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  sessionNotice: string | null;
  clearSessionNotice: () => void;
  login: (username: string, password: string) => Promise<User>;
  register: (data: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    username: string;
    password: string;
    department?: string;
  }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUserState: (updated: User) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const storedToken = getStoredToken();
    if (!storedToken) {
      setToken(null);
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const freshUser = await authApi.me();
      storeUser(freshUser);
      setToken(storedToken);
      setUser(freshUser);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
        clearSession();
        setToken(null);
        setUser(null);
        setSessionNotice(err.message);
      } else {
        // Keep cached user if backend is temporarily unreachable
        setToken(storedToken);
        setUser(getStoredUser());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cachedToken = getStoredToken();
    const cachedUser = getStoredUser();
    if (cachedToken && cachedUser) {
      setToken(cachedToken);
      setUser(cachedUser);
    }
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (username: string, password: string) => {
    const res = await authApi.login({ username, password });
    storeSession(res.token, res.user);
    setToken(res.token);
    setUser(res.user);
    setSessionNotice(null);
    return res.user;
  }, []);

  const register = useCallback(
    async (data: {
      firstName: string;
      lastName: string;
      phoneNumber: string;
      username: string;
      password: string;
      department?: string;
    }) => {
      const res = await authApi.register(data);
      storeSession(res.token, res.user);
      setToken(res.token);
      setUser(res.user);
      setSessionNotice(null);
      return res.user;
    },
    []
  );

  const updateUserState = useCallback((updated: User) => {
    storeUser(updated);
    setUser(updated);
  }, []);

  const clearSessionNotice = useCallback(() => setSessionNotice(null), []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        sessionNotice,
        clearSessionNotice,
        login,
        register,
        logout,
        refreshUser,
        updateUserState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
