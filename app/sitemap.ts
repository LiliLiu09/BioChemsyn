import type { MetadataRoute } from "next";
import { getProducts, getPublishedInfoArticles, getPublishedNewsArticles } from "@/lib/cms";
import { sitemapEntries } from "@/lib/sitemap-entries";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, news, info] = await Promise.all([getProducts(), getPublishedNewsArticles(), getPublishedInfoArticles()]);
  return sitemapEntries(products, news, info);
}
