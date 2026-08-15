import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { InfoExplorer } from "@/components/InfoExplorer";
import { getInfoArticles, getSiteContent } from "@/lib/cms";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InfoPage() {
  const [site, info] = await Promise.all([getSiteContent(), getInfoArticles()]);
  const publishedInfo = info
    .filter((article) => article.published)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return (
    <div className="shell">
      <Header site={site} />
      <main className="main">
        <section className="news-hero">
          <span className="eyebrow">资讯信息</span>
          <h1>产品资讯与服务信息</h1>
          <p>按分类浏览凯森斯生物发布的产品资讯、采购说明和服务信息，也可以通过关键词快速搜索相关内容。</p>
        </section>
        <InfoExplorer articles={publishedInfo} />
        <Footer site={site} />
      </main>
    </div>
  );
}
