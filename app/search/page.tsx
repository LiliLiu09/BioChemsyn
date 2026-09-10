import Link from "@/components/LocaleLink";
import { Footer } from "@/components/Footer";
import { GlobalSearchForm } from "@/components/GlobalSearchForm";
import { Header } from "@/components/Header";
import {
  getInfoArticles,
  getNewsArticles,
  getProducts,
  getSiteContent
} from "@/lib/cms";
import { isArticleAvailable, isProductAvailable, localizeArticle, localizeProduct, localizeSiteContent } from "@/lib/content-locale";
import { getLocale } from "@/lib/locale-server";
import { translate } from "@/lib/i18n";

export async function generateMetadata() {
  const locale = await getLocale();
  return { title: translate(locale, "全站搜索", "Search the website"), robots: { index: false, follow: true } };
}

type SearchPageProps = {
  searchParams: Promise<{
    q?: string | string[];
  }>;
};

type SearchResult = {
  href: string;
  title: string;
  summary: string;
  meta: string;
};

function searchableText(values: Array<string | number | string[]>) {
  return values
    .map((value) => (Array.isArray(value) ? value.join(" ") : String(value ?? "")))
    .join(" ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function cleanText(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const [params, locale] = await Promise.all([searchParams, getLocale()]);
  const t = (zh: string, en: string) => translate(locale, zh, en);
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = (rawQuery || "").trim();
  const keyword = query.toLowerCase();

  const [rawSite, rawProducts, rawNews, rawInfo] = await Promise.all([
    getSiteContent(),
    keyword ? getProducts() : Promise.resolve([]),
    keyword ? getNewsArticles() : Promise.resolve([]),
    keyword ? getInfoArticles() : Promise.resolve([])
  ]);
  const site = localizeSiteContent(rawSite, locale);
  const products = rawProducts
    .filter((product) => isProductAvailable(product, locale))
    .map((product) => localizeProduct(product, locale));
  const news = rawNews
    .filter((article) => isArticleAvailable(article, locale))
    .map((article) => localizeArticle(article, locale));
  const info = rawInfo
    .filter((article) => isArticleAvailable(article, locale))
    .map((article) => localizeArticle(article, locale));

  const productResults: SearchResult[] = keyword
    ? products
        .filter((product) =>
          searchableText([
            product.sku,
            product.catalogNo,
            product.cas,
            product.nameCn,
            product.nameEn,
            product.synonyms,
            product.category,
            product.brand,
            product.formula,
            product.molecularWeight,
            product.tags
          ]).includes(keyword)
        )
        .map((product) => ({
          href: `/products/${product.id}`,
          title: product.nameCn || product.nameEn || product.catalogNo,
          summary:
            [product.nameEn, product.synonyms, product.formula]
              .filter(Boolean)
              .join(" · ") || t("查看产品详情", "View product details"),
          meta: [product.catalogNo || product.sku, product.cas && `CAS ${product.cas}`]
            .filter(Boolean)
            .join(" · ")
        }))
    : [];

  const newsResults: SearchResult[] = keyword
    ? news
        .filter(
          (article) =>
            article.published &&
            searchableText([
              article.title,
              article.category,
              article.summary,
              article.content,
              article.author,
              article.source
            ]).includes(keyword)
        )
        .map((article) => ({
          href: `/news/${article.slug}`,
          title: article.title,
          summary: cleanText(article.summary || article.content),
          meta: `${t("新闻", "News")} · ${article.category}`
        }))
    : [];

  const infoResults: SearchResult[] = keyword
    ? info
        .filter(
          (article) =>
            article.published &&
            searchableText([
              article.title,
              article.category,
              article.summary,
              article.content,
              article.author,
              article.source
            ]).includes(keyword)
        )
        .map((article) => ({
          href: `/info/${article.slug}`,
          title: article.title,
          summary: cleanText(article.summary || article.content),
          meta: `${t("资讯", "Resources")} · ${article.category}`
        }))
    : [];

  const publicPages = [
    {
      href: "/",
      title: site.heroTitle || t("凯森斯生物", "KASONS"),
      summary: site.heroDescription,
      meta: t("网站页面", "Website page")
    },
    {
      href: "/about",
      title: site.aboutTitle || t("关于我们", "About us"),
      summary: site.aboutDescription,
      meta: t("网站页面", "Website page")
    },
    {
      href: "/contact",
      title: site.contactTitle || t("联系我们", "Contact us"),
      summary: site.contactDescription,
      meta: t("网站页面", "Website page")
    }
  ];

  const pageResults: SearchResult[] = keyword
    ? publicPages
        .filter((page) =>
          searchableText([page.title, page.summary]).includes(keyword)
        )
        .map((page) => ({
          ...page,
          summary: cleanText(page.summary)
        }))
    : [];

  const groups = [
    { label: t("产品", "Products"), results: productResults },
    { label: t("新闻", "News"), results: newsResults },
    { label: t("资讯", "Resources"), results: infoResults },
    { label: t("网站页面", "Website pages"), results: pageResults }
  ];

  const total = groups.reduce((count, group) => count + group.results.length, 0);

  return (
    <div className="shell">
      <Header site={site} />

      <main className="main global-search-page">
        <div className="section-heading">
          <span className="eyebrow">{t("全站搜索", "Search the website")}</span>
          <h1>{t("搜索凯森斯网站内容", "Search KASONS")}</h1>
        </div>

        <GlobalSearchForm defaultValue={query} />

        {!query && <div className="empty-state">{t("请输入需要搜索的关键词。", "Enter a keyword to start searching.")}</div>}

        {query && (
          <p className="global-search-summary">
            {t(`搜索“${query}”，共找到 ${total} 条结果`, `${total} results for “${query}”`)}
          </p>
        )}

        {query && total === 0 && (
          <div className="empty-state">
            {t("没有找到相关内容，请尝试产品名称、CAS、货号或其他关键词。", "No results found. Try a product name, CAS number, catalog number or another keyword.")}
          </div>
        )}

        {groups.map(
          (group) =>
            group.results.length > 0 && (
              <section className="global-result-group" key={group.label}>
                <h2>
                  {group.label} {t(`（${group.results.length}）`, `(${group.results.length})`)}
                </h2>

                <div className="global-result-list">
                  {group.results.map((result) => (
                    <Link
                      className="global-result-card"
                      href={result.href}
                      key={`${group.label}-${result.href}`}
                    >
                      <span>{result.meta}</span>
                      <h3>{result.title}</h3>
                      <p>{result.summary}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )
        )}

        <Footer site={site} />
      </main>
    </div>
  );
}
