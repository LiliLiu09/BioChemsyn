import type { MetadataRoute } from "next";
import type { InfoArticle, NewsArticle, Product } from "./types";
import { isArticleAvailable, isProductAvailable } from "./content-locale";
import { absoluteUrl } from "./seo";
import { localizePath } from "./i18n";
import { coreCategories } from "./catalog-seo";
import { contentTimestamp } from "./content-updates";

export function sitemapEntries(products: Product[], news: NewsArticle[], info: InfoArticle[]): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();
  const add = (path: string, english = true, updatedAt?: string) => {
    const languages = {
      "zh-CN": absoluteUrl(path),
      ...(english ? { en: absoluteUrl(localizePath(path, "en")) } : {}),
      "x-default": absoluteUrl(path)
    };
    const lastModified = contentTimestamp(updatedAt);
    for (const localized of english ? [path, localizePath(path, "en")] : [path]) {
      const url = absoluteUrl(localized);
      if (seen.has(url)) continue;
      seen.add(url);
      entries.push({ url, alternates: { languages }, ...(lastModified ? { lastModified } : {}) });
    }
  };
  // Static pages have no reliable content revision timestamp; do not invent one.
  ["/", "/products", "/news", "/info", "/about", "/contact"].forEach((path) => add(path));
  for (const category of coreCategories) add(`/products/category/${category.slug}`);
  for (const product of products) {
    if (isProductAvailable(product, "zh")) add(`/products/${encodeURIComponent(product.id)}`, isProductAvailable(product, "en"), product.updatedAt);
  }
  for (const [section, articles] of [["news", news], ["info", info]] as const) {
    for (const article of articles) {
      if (isArticleAvailable(article, "zh")) add(`/${section}/${encodeURIComponent(article.slug)}`, isArticleAvailable(article, "en"), article.updatedAt || article.publishedAt);
    }
  }
  return entries;
}
