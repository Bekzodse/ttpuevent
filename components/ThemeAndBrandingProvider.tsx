"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { brandingApi } from "@/lib/api";
import { ThemeMode, UniversityBranding } from "@/lib/types";

interface ThemeAndBrandingContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  branding: UniversityBranding;
  refreshBranding: () => Promise<void>;
}

const DEFAULT_BRANDING: UniversityBranding = {
  id: 1,
  universityName: "Turin Polytechnic University in Tashkent",
  universitySubtitle: "Students' Union · Event & Hall Portal",
  loginHeadline: "Welcome to Turin Polytechnic University in Tashkent",
  loginDescription:
    "Sign in with your university account to book campus event halls, reserve equipment, track payments, and manage university events.",
  primaryColor: "#1d3b8b",
  secondaryColor: "#3668b2",
  logoUrl: "/ttpu-logo.jpg",
  contactEmail: "info@polito.uz",
  contactPhone: "+998 71 246-80-51",
  contactAddress: "17 Little Ring Road, Almazar District, Tashkent 100095",
  websiteUrl: "https://turin.uz",
  updatedAt: "",
};

const ThemeContext = createContext<ThemeAndBrandingContextValue | undefined>(undefined);
const THEME_KEY = "uems_theme";

function applyBrandColors(primary: string, secondary: string) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--brand-primary", primary || "#4f46e5");
  root.style.setProperty("--brand-secondary", secondary || "#7c3aed");
}

export function ThemeAndBrandingProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [branding, setBranding] = useState<UniversityBranding>(DEFAULT_BRANDING);

  const applyThemeClass = useCallback((mode: ThemeMode) => {
    if (typeof document === "undefined") return;
    if (mode === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const refreshBranding = useCallback(async () => {
    try {
      const data = await brandingApi.get();
      setBranding(data);
      applyBrandColors(data.primaryColor, data.secondaryColor);
    } catch {
      applyBrandColors(DEFAULT_BRANDING.primaryColor, DEFAULT_BRANDING.secondaryColor);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(THEME_KEY) as ThemeMode | null;
      const initial: ThemeMode = saved === "dark" ? "dark" : "light";
      setThemeState(initial);
      applyThemeClass(initial);
    }
    refreshBranding();
  }, [applyThemeClass, refreshBranding]);

  const setTheme = useCallback(
    (mode: ThemeMode) => {
      setThemeState(mode);
      if (typeof window !== "undefined") {
        localStorage.setItem(THEME_KEY, mode);
      }
      applyThemeClass(mode);
    },
    [applyThemeClass]
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, branding, refreshBranding }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeAndBranding() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeAndBranding must be used inside ThemeAndBrandingProvider");
  return ctx;
}
