import Link from "@/components/LocaleLink";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProductBrowser } from "@/components/ProductBrowser";
import { getNewsArticles, getProducts, getSiteContent } from "@/lib/cms";
import { GlobalSearchForm } from "@/components/GlobalSearchForm";
import { isArticleAvailable, isProductAvailable, localizeArticle, localizeProduct, localizeSiteContent } from "@/lib/content-locale";
import { getLocale } from "@/lib/locale-server";
import { translate } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const [rawSite, rawProducts, news, locale] = await Promise.all([getSiteContent(), getProducts(), getNewsArticles(), getLocale()]);
  const t = (zh: string, en: string) => translate(locale, zh, en);
  const site = localizeSiteContent(rawSite, locale);
  const products = rawProducts
    .filter((product) => isProductAvailable(product, locale))
    .map((product) => localizeProduct(product, locale));
  const allCategories = Array.from(new Map(products.map((product) => [product.categoryKey || product.category, product.category || t("未分类", "Uncategorized")])).entries());
  const latestNews = news
    .filter((article) => isArticleAvailable(article, locale))
    .map((article) => localizeArticle(article, locale))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 3);

  return (
    <div className="shell">
      <Header site={site} />
      <section className="home-scroll-banner" aria-label={t("首页轮播展示", "KASONS highlights")}>
        <div className="home-scroll-track">
          <Link className="home-scroll-slide image-slide" href="/products">
            <img className="home-carousel-image" src="/carousel-full-flow.png?v=5" alt={t("科研试剂、标准品与化学品检索", "Search research reagents, reference standards and chemicals")} />
          </Link>
          <Link className="home-scroll-slide image-slide" href="/products">
            <img className="home-carousel-image" src={locale === "en" ? "/carousel-en-brand.png?v=1" : "/carousel-full-brand.png?v=5"} alt={t("KASONS 凯森斯生物 糖究未来 合成无限", "KASONS — exploring glycochemistry, advancing synthesis")} />
          </Link>
          <Link className="home-scroll-slide image-slide" href="/cart">
            <img className="home-carousel-image" src={locale === "en" ? "/carousel-en-search.png?v=1" : "/carousel-full-search.png?v=5"} alt={t("KASONS 询价流程", "KASONS enquiry process")} />
          </Link>
          <Link className="home-scroll-slide image-slide" href="/cart">
            <img className="home-carousel-image" src="/carousel-full-lab.png?v=5" alt={t("科研试剂、标准品与化学品产品库", "Research reagents, reference standards and chemicals catalogue")} />
          </Link>
        </div>
        <div className="home-scroll-dots" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      </section>
      <main className="main home-main">
        <div className="home-shell-layout">
          <aside className="home-category-rail" aria-label={t("首页产品分类", "Product categories")}>
            <div className="home-category-title">
              <b>{t("全部分类", "All categories")}</b>
            </div>
            <div className="home-category-list">
              <Link href="/products">{t("全部产品", "All products")}</Link>
              {allCategories.map(([key, label]) => (
                <Link href={`/products?category=${encodeURIComponent(key)}`} key={key}>
                  {label}
                </Link>
              ))}
            </div>
          </aside>

          <div className="home-page-content">
            <div className="home-middle-content">
              <section className="product-section">
                <div className="section-heading">
                  <span className="eyebrow">{t("全站搜索", "Search the website")}</span>
                  <h2>{t("搜索产品、新闻与资讯", "Search products, news and resources")}</h2>
                </div>

                <GlobalSearchForm />
              </section>
              <ProductBrowser compact products={products} />

              {latestNews.length > 0 && (
                <section className="section-block">
                  <div className="section-heading product-heading">
                    <div>
                      <span className="eyebrow">{t("新闻中心", "News")}</span>
                      <h2>{t("公司新闻与产品资讯", "Company news and product updates")}</h2>
                    </div>
                    <Link className="btn" href="/news">
                      {t("查看全部新闻", "View all news")}
                    </Link>
                  </div>
                  <div className="news-list">
                    {latestNews.map((article) => (
                      <article className="news-card" key={article.id}>
                        <div className="news-date">
                          <b>{article.publishedAt.slice(8, 10)}</b>
                          <span>{article.publishedAt.slice(0, 7)}</span>
                        </div>
                        <div className="news-card-body">
                          <div className="news-meta">
                            <span>{article.category}</span>
                            <span>{t("阅读量：", "Views: ")}{article.views}</span>
                          </div>
                          <h2>
                            <Link href={`/news/${article.slug}`}>{article.title}</Link>
                          </h2>
                          <p>{article.summary}</p>
                          <Link className="locked" href={`/news/${article.slug}`}>
                            {t("查看全文", "Read more")}
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <section className="cta-band" id="support">
              <div>
                <span className="eyebrow">{t("采购支持", "Purchasing support")}</span>
                <h2>{t("需要批量规格、替代品或交期确认？", "Need bulk quantities, alternatives or lead times?")}</h2>
                <p>{t("将目标产品加入询价车，销售团队会结合数量、库存和客户需求回复报价。也可以直接通过电话或邮件联系。", "Add products to your quote cart. Our sales team will reply based on quantities, stock and your requirements. You can also contact us by phone or email.")}</p>
              </div>
              <div className="contact-stack">
                <a className="contact-link" href={`tel:${site.supportPhone}`}>
                  {site.supportPhone}
                </a>
                <a className="contact-link" href={`mailto:${site.contactEmail}`}>
                  {site.contactEmail}
                </a>
                <Link className="btn primary large" href="/cart">
                  {t("查看询价车", "View quote cart")}
                </Link>
              </div>
            </section>
          </div>
        </div>

        <Footer site={site} />
      </main>
    </div>
  );
}
