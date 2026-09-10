"use client";

import { Search } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { localizePath } from "@/lib/i18n";

export function GlobalSearchForm({ defaultValue = "" }: { defaultValue?: string }) {
  const { locale, t } = useLanguage();
  return (
    <form action={localizePath("/search", locale)} method="get" className="search-card global-search-form" role="search">
      <label className="search-field">
        <Search size={18} aria-hidden="true" />
        <span className="sr-only">{t("全站搜索", "Search the website")}</span>
        <input
          name="q"
          defaultValue={defaultValue}
          placeholder={t("搜索产品、CAS、新闻、资讯或公司信息", "Search products, CAS numbers, news, resources or company information")}
        />
      </label>

      <button className="btn primary" type="submit">
        {t("全站搜索", "Search website")}
      </button>
    </form>
  );
}
