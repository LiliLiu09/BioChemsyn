"use client";

import { usePathname } from "next/navigation";
import { useLanguage } from "./LanguageProvider";
import { stripLocale, type Locale } from "@/lib/i18n";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const { locale, t } = useLanguage();

  const target = (language: Locale, returnTo: string) =>
    `/api/locale?language=${language}&returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <nav className="language-switcher" aria-label={t("网站语言", "Website language")}>
      {(["zh", "en"] as const).map((language) => (
        <a
          key={language}
          href={target(language, stripLocale(pathname))}
          lang={language === "zh" ? "zh-CN" : "en"}
          aria-current={locale === language ? "true" : undefined}
          onClick={(event) => {
            // Use a full navigation so both the root layout and its server content change language.
            event.preventDefault();
            const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
            window.location.assign(target(language, current));
          }}
        >
          {language === "zh" ? "中文" : "English"}
        </a>
      ))}
    </nav>
  );
}
