"use client";

import { usePathname } from "next/navigation";
import { useLanguage } from "./LanguageProvider";
import { localizePath } from "@/lib/i18n";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const { locale, t } = useLanguage();

  return (
    <nav className="language-switcher" aria-label={t("网站语言", "Website language")}>
      {(["zh", "en"] as const).map((language) => (
        <a
          key={language}
          href={localizePath(pathname, language)}
          lang={language === "zh" ? "zh-CN" : "en"}
          aria-current={locale === language ? "true" : undefined}
          onClick={(event) => {
            // Use a full navigation so both the root layout and its server content change language.
            event.preventDefault();
            const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
            window.location.assign(localizePath(current, language));
          }}
        >
          {language === "zh" ? "中文" : "English"}
        </a>
      ))}
    </nav>
  );
}
