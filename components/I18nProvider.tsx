"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { dictionaries } from "@/lib/i18n";
import { TranslationDict } from "@/lib/i18n/en";
import { Locale } from "@/lib/types";

interface I18nContextValue {
  locale: Locale;
  setLocale: (loc: Locale) => void;
  t: TranslationDict;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const LOCALE_STORAGE_KEY = "uems_locale";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (saved === "en" || saved === "uz" || saved === "ru") {
      setLocaleState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLocale = useCallback((loc: Locale) => {
    setLocaleState(loc);
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCALE_STORAGE_KEY, loc);
      document.documentElement.lang = loc;
    }
  }, []);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: dictionaries[locale] }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
