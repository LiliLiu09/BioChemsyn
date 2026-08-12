import Link from "next/link";
import { Header } from "@/components/Header";
import { getNewsArticles, getSiteContent } from "@/lib/cms";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewsPage() {
  const [site, news] = await Promise.all([getSiteContent(), getNewsArticles()]);
  const publishedNews = news
    .filter((article) => article.published)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <div className="shell">
      <Header site={site} />
      <main className="main">
        <section className="news-hero">
          <span className="eyebrow">新闻中心</span>
          <h1>公司新闻与产品资讯</h1>
          <p>发布凯森斯生物的公司动态、产品更新、服务能力和行业相关内容。</p>
        </section>

        <section className="news-list">
          {publishedNews.length === 0 ? (
            <div className="notice">暂无已发布新闻。</div>
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
                    <span>阅读量：{article.views}</span>
                  </div>
                  <h2>
                    <Link href={`/news/${article.slug}`}>{article.title}</Link>
                  </h2>
                  <p>{article.summary}</p>
                  <Link className="locked" href={`/news/${article.slug}`}>
                    查看全文
                  </Link>
                </div>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
