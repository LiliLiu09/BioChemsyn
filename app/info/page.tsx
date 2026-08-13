import { Header } from "@/components/Header";
import { InfoExplorer } from "@/components/InfoExplorer";
import { getNewsArticles, getSiteContent } from "@/lib/cms";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InfoPage() {
  const [site, news] = await Promise.all([getSiteContent(), getNewsArticles()]);
  const publishedNews = news
    .filter((article) => article.published)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <div className="shell">
      <Header site={site} />
      <main className="main">
        <section className="news-hero">
          <span className="eyebrow">资讯信息</span>
          <h1>产品资讯与行业信息</h1>
          <p>按分类浏览凯森斯生物发布的产品资讯、服务说明和公司动态，也可以通过关键词快速搜索相关内容。</p>
        </section>
        <InfoExplorer articles={publishedNews} />
      </main>
    </div>
  );
}
