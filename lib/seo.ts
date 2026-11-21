import type { Metadata } from "next";
import { isArticleAvailable, localizeArticle } from "./content-locale";
import { localizePath, type Locale } from "./i18n";
import type { InfoArticle, NewsArticle } from "./types";

export function canonicalOrigin(value?: string): string {
  try {
    const url = new URL(value?.trim() || "https://biochemsyn.com");
    if (!/^https?:$/.test(url.protocol)) return "https://biochemsyn.com";
    if (["biochemsyn.com", "www.biochemsyn.com"].includes(url.hostname)) return "https://biochemsyn.com";
    return url.origin;
  } catch {
    return "https://biochemsyn.com";
  }
}

export const siteOrigin = canonicalOrigin(process.env.NEXT_PUBLIC_SITE_URL);
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

export function articleMetadata(path: string, locale: Locale, article: InfoArticle | NewsArticle | null): Metadata {
  if (!article || !isArticleAvailable(article, locale)) {
    return { alternates: null, robots: { index: false, follow: true } };
  }

  const localized = localizeArticle(article, locale);
  return pageMetadata(path, locale, localized.title, localized.summary, isArticleAvailable(article, "en"));
}
