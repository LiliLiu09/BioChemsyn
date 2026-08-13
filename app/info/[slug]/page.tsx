import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { RichTextContent } from "@/components/RichTextContent";
import { getInfoArticles, getSiteContent } from "@/lib/cms";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function InfoDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, site, info] = await Promise.all([params, getSiteContent(), getInfoArticles()]);
  const article = info.find((item) => item.slug === slug && item.published);

  if (!article) {
    notFound();
  }

  return (
    <div className="shell">
      <Header site={site} />
      <main className="main">
        <article className="article-page">
          <Link className="locked" href="/info">
            返回资讯信息
          </Link>
          <header>
            <span className="eyebrow">{article.category}</span>
            <h1>{article.title}</h1>
            <div className="article-meta">
              <span>作者：{article.author}</span>
              <span>来源：{article.source}</span>
              <span>发布时间：{article.publishedAt}</span>
              <span>阅读量：{article.views}</span>
            </div>
          </header>
          {article.coverImage && <img className="article-cover" src={article.coverImage} alt={article.title} />}
          <p className="article-summary">{article.summary}</p>
          <RichTextContent content={article.content} imageAlt="资讯图片" />
        </article>
      </main>
    </div>
  );
}
