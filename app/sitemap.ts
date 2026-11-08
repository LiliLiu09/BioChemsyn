import type { MetadataRoute } from "next";
import { getProducts, getPublishedInfoArticles, getPublishedNewsArticles } from "@/lib/cms";
import { isArticleAvailable, isProductAvailable } from "@/lib/content-locale";
import { absoluteUrl } from "@/lib/seo";
import { localizePath } from "@/lib/i18n";
import { coreCategories } from "@/lib/catalog-seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, news, info] = await Promise.all([getProducts(), getPublishedNewsArticles(), getPublishedInfoArticles()]);
  const entries: MetadataRoute.Sitemap = [];
  const add = (path: string, english = true) => {
    const languages = { "zh-CN": absoluteUrl(path), ...(english ? { en: absoluteUrl(localizePath(path, "en")) } : {}) };
    entries.push({ url: absoluteUrl(path), alternates: { languages } });
    if (english) entries.push({ url: absoluteUrl(localizePath(path, "en")), alternates: { languages } });
  };
  ["/", "/products", "/news", "/info", "/about", "/contact"].forEach((path) => add(path));
  for (const category of coreCategories) add(`/products/category/${category.slug}`);
  for (const product of products) if (isProductAvailable(product, "zh")) add(`/products/${encodeURIComponent(product.id)}`, isProductAvailable(product, "en"));
  for (const [section, articles] of [["news", news], ["info", info]] as const) {
    for (const article of articles) if (isArticleAvailable(article, "zh")) add(`/${section}/${encodeURIComponent(article.slug)}`, isArticleAvailable(article, "en"));
  }
  return entries;
}
