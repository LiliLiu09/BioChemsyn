import Link from "@/components/LocaleLink";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { getNewsArticles, getSiteContent } from "@/lib/cms";
import { isArticleAvailable, localizeArticle, localizeSiteContent } from "@/lib/content-locale";
import { getLocale } from "@/lib/locale-server";
import { translate } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
  const locale = await getLocale();
  return { title: translate(locale, "新闻中心", "News") };
}

export default async function NewsPage() {
  const [rawSite, news, locale] = await Promise.all([getSiteContent(), getNewsArticles(), getLocale()]);
  const site = localizeSiteContent(rawSite, locale);
  const publishedNews = news
    .filter((article) => isArticleAvailable(article, locale))
    .map((article) => localizeArticle(article, locale))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <div className="shell">
      <Header site={site} />
      <main className="main">
        <section className="news-hero">
          <span className="eyebrow">{translate(locale, "新闻中心", "News")}</span>
          <h1>{translate(locale, "公司新闻与产品资讯", "Company news and product updates")}</h1>
          <p>{translate(locale, "发布凯森斯生物的公司动态、产品更新、服务能力和行业相关内容。", "The latest KASONS company news, product updates, services and industry insights.")}</p>
        </section>

        <section className="news-list">
          {publishedNews.length === 0 ? (
            <div className="notice">{translate(locale, "暂无已发布新闻。", "No news has been published in English yet.")}</div>
          ) : (
            publishedNews.map((article) => (
              <article className="news-card" key={article.id}>
                <div className="news-date">
                  <b>{article.publishedAt.slice(8, 10)}</b>
                  <span>{article.publishedAt.slice(0, 7)}</span>
                </div>
                <div className="news-card-body">
                  <div className="news-meta">
                    <span>{article.category}</span>
                    <span>{translate(locale, "阅读量：", "Views: ")}{article.views}</span>
                  </div>
                  <h2>
                    <Link href={`/news/${article.slug}`}>{article.title}</Link>
                  </h2>
                  <p>{article.summary}</p>
                  <Link className="locked" href={`/news/${article.slug}`}>
                    {translate(locale, "查看全文", "Read more")}
                  </Link>
                </div>
              </article>
            ))
          )}
        </section>
        <Footer site={site} />
      </main>
    </div>
  );
}
