import type { Metadata } from "next";
import { localizePath, type Locale } from "./i18n";

export const siteOrigin = (process.env.NEXT_PUBLIC_SITE_URL || "https://biochemsyn.com").replace(/\/$/, "");
export const absoluteUrl = (path: string) => new URL(path, siteOrigin).toString();

export function pageMetadata(path: string, locale: Locale, title: string, description: string, englishAvailable = true): Metadata {
  const url = absoluteUrl(localizePath(path, locale));
  return {
    title, description,
    alternates: {
      canonical: url,
      languages: {
        "zh-CN": absoluteUrl(path),
        ...(englishAvailable ? { en: absoluteUrl(localizePath(path, "en")) } : {}),
        "x-default": absoluteUrl(path)
      }
    },
    openGraph: { title, description, url, siteName: "KASONS", type: "website", locale: locale === "en" ? "en_US" : "zh_CN" },
    twitter: { card: "summary", title, description }
  };
}

export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
