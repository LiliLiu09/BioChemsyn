import Link from "next/link";
import { Footer } from "@/components/Footer";
import { GlobalSearchForm } from "@/components/GlobalSearchForm";
import { Header } from "@/components/Header";
import {
  getInfoArticles,
  getNewsArticles,
  getProducts,
  getSiteContent
} from "@/lib/cms";

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
  const params = await searchParams;
  const rawQuery = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = (rawQuery || "").trim();
  const keyword = query.toLowerCase();

  const [site, products, news, info] = await Promise.all([
    getSiteContent(),
    getProducts(),
    getNewsArticles(),
    getInfoArticles()
  ]);

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
              .join(" · ") || "查看产品详情",
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
          meta: `新闻 · ${article.category}`
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
          meta: `资讯 · ${article.category}`
        }))
    : [];

  const publicPages = [
    {
      href: "/",
      title: site.heroTitle || "凯森斯生物",
      summary: site.heroDescription,
      meta: "网站页面"
    },
    {
      href: "/about",
      title: site.aboutTitle || "关于我们",
      summary: site.aboutDescription,
      meta: "网站页面"
    },
    {
      href: "/contact",
      title: site.contactTitle || "联系我们",
      summary: site.contactDescription,
      meta: "网站页面"
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
    { label: "产品", results: productResults },
    { label: "新闻", results: newsResults },
    { label: "资讯", results: infoResults },
    { label: "网站页面", results: pageResults }
  ];

  const total = groups.reduce((count, group) => count + group.results.length, 0);

  return (
    <div className="shell">
      <Header site={site} />

      <main className="main global-search-page">
        <div className="section-heading">
          <span className="eyebrow">全站搜索</span>
          <h1>搜索凯森斯网站内容</h1>
        </div>

        <GlobalSearchForm defaultValue={query} />

        {!query && <div className="empty-state">请输入需要搜索的关键词。</div>}

        {query && (
          <p className="global-search-summary">
            搜索“{query}”，共找到 {total} 条结果
          </p>
        )}

        {query && total === 0 && (
          <div className="empty-state">
            没有找到相关内容，请尝试产品名称、CAS、货号或其他关键词。
          </div>
        )}

        {groups.map(
          (group) =>
            group.results.length > 0 && (
              <section className="global-result-group" key={group.label}>
                <h2>
                  {group.label}（{group.results.length}）
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