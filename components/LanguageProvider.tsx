"use client";

import { createContext, useContext, useMemo } from "react";
import { translate, type Locale } from "@/lib/i18n";

const LanguageContext = createContext<Locale>("zh");

export function LanguageProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LanguageContext.Provider value={locale}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const locale = useContext(LanguageContext);
  return useMemo(() => ({ locale, t: (zh: string, en: string) => translate(locale, zh, en) }), [locale]);
}
