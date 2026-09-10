import Link from "@/components/LocaleLink";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { RichTextContent } from "@/components/RichTextContent";
import { getInfoArticles, getSiteContent } from "@/lib/cms";
import { isArticleAvailable, localizeArticle, localizeSiteContent } from "@/lib/content-locale";
import { getLocale } from "@/lib/locale-server";
import { translate } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
  const locale = await getLocale();
  return { title: translate(locale, "资讯详情", "Resource article") };
}

export default async function InfoDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const [{ slug }, rawSite, info, locale] = await Promise.all([params, getSiteContent(), getInfoArticles(), getLocale()]);
  const t = (zh: string, en: string) => translate(locale, zh, en);
  const site = localizeSiteContent(rawSite, locale);
  const rawArticle = info.find((item) => item.slug === slug && item.published);

  if (!rawArticle) {
    notFound();
  }

  if (!isArticleAvailable(rawArticle, locale)) {
    return (
      <div className="shell">
        <Header site={site} />
        <main className="main">
          <section className="content-page">
            <h1>{t("暂未提供翻译", "This resource is not available in English yet")}</h1>
            <p>{t("请查看中文版本或浏览其他资讯。", "You can switch to the Chinese version or browse other resources.")}</p>
            <a className="btn" href={`/api/locale?language=zh&returnTo=${encodeURIComponent(`/info/${encodeURIComponent(slug)}`)}`}>{t("查看中文版本", "View Chinese version")}</a>
            <Link className="btn primary" href="/info">{t("返回资讯信息", "Back to resources")}</Link>
          </section>
          <Footer site={site} />
        </main>
      </div>
    );
  }

  const article = localizeArticle(rawArticle, locale);

  return (
    <div className="shell">
      <Header site={site} />
      <main className="main">
        <article className="article-page">
          <Link className="locked" href="/info">
            {t("返回资讯信息", "Back to resources")}
          </Link>
          <header>
            <span className="eyebrow">{article.category}</span>
            <h1>{article.title}</h1>
            <div className="article-meta">
              {article.author && <span>{t("作者：", "Author: ")}{article.author}</span>}
              {article.source && <span>{t("来源：", "Source: ")}{article.source}</span>}
              <span>{t("发布时间：", "Published: ")}{article.publishedAt}</span>
              <span>{t("阅读量：", "Views: ")}{article.views}</span>
            </div>
          </header>
          {article.coverImage && <img className="article-cover" src={article.coverImage} alt={article.title} />}
          <p className="article-summary">{article.summary}</p>
          <RichTextContent content={article.content} locale={locale} imageAlt={t("资讯图片", "Resource image")} />
        </article>
        <Footer site={site} />
      </main>
    </div>
  );
}
