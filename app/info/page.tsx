import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { InfoExplorer } from "@/components/InfoExplorer";
import { getInfoArticles, getSiteContent } from "@/lib/cms";
import { isArticleAvailable, localizeArticle, localizeSiteContent } from "@/lib/content-locale";
import { getLocale } from "@/lib/locale-server";
import { translate } from "@/lib/i18n";
import { Suspense } from "react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
  const locale = await getLocale();
  return { title: translate(locale, "资讯信息", "Resources") };
}

export default async function InfoPage() {
  const [rawSite, info, locale] = await Promise.all([getSiteContent(), getInfoArticles(), getLocale()]);
  const site = localizeSiteContent(rawSite, locale);
  const publishedInfo = info
    .filter((article) => isArticleAvailable(article, locale))
    .map((article) => localizeArticle(article, locale))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <div className="shell">
      <Header site={site} />
      <main className="main">
        <section className="news-hero">
          <span className="eyebrow">{translate(locale, "资讯信息", "Resources")}</span>
          <h1>{translate(locale, "产品资讯与服务信息", "Product resources and services")}</h1>
          <p>{translate(locale, "按分类浏览凯森斯生物发布的产品资讯、采购说明和服务信息，也可以通过关键词快速搜索相关内容。", "Browse KASONS product resources, purchasing guides and service information by category, or search by keyword.")}</p>
        </section>
        <Suspense fallback={<p>{translate(locale, "加载资讯…", "Loading resources…")}</p>}><InfoExplorer articles={publishedInfo} /></Suspense>
        <Footer site={site} />
      </main>
    </div>
  );
}
