import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProductBrowser } from "@/components/ProductBrowser";
import { getNewsArticles, getProducts, getSiteContent } from "@/lib/cms";
import { GlobalSearchForm } from "@/components/GlobalSearchForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const [site, products, news] = await Promise.all([getSiteContent(), getProducts(), getNewsArticles()]);
  const categoryCounts = products.reduce<Record<string, number>>((acc, product) => {
    const category = product.category || "未分类";
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});
  const allCategories = Object.entries(categoryCounts);
  const latestNews = news
    .filter((article) => article.published)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 3);

  return (
    <div className="shell">
      <Header site={site} />
      <section className="home-scroll-banner" aria-label="首页轮播展示">
        <div className="home-scroll-track">
          <Link className="home-scroll-slide image-slide" href="/products">
            <img className="home-carousel-image" src="/carousel-full-flow.png?v=5" alt="KASONS 询价流程" />
          </Link>
          <Link className="home-scroll-slide image-slide" href="/products">
            <img className="home-carousel-image" src="/carousel-full-brand.png?v=5" alt="KASONS 凯森斯生物 糖究未来 合成无限" />
          </Link>
          <Link className="home-scroll-slide image-slide" href="/cart">
            <img className="home-carousel-image" src="/carousel-full-search.png?v=5" alt="科研试剂、标准品与化学品检索" />
          </Link>
          <Link className="home-scroll-slide image-slide" href="/cart">
            <img className="home-carousel-image" src="/carousel-full-lab.png?v=5" alt="科研试剂、标准品与化学品产品库" />
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
          <aside className="home-category-rail" aria-label="首页产品分类">
            <div className="home-category-title">
              <b>全部分类</b>
            </div>
            <div className="home-category-list">
              <Link href="/products">全部产品</Link>
              {allCategories.map(([category]) => (
                <Link href={`/products?category=${encodeURIComponent(category)}`} key={category}>
                  {category}
                </Link>
              ))}
            </div>
          </aside>

          <div className="home-page-content">
            <div className="home-middle-content">
              <section className="product-section">
                <div className="section-heading">
                  <span className="eyebrow">全站搜索</span>
                  <h2>搜索产品、新闻与资讯</h2>
                </div>

                <GlobalSearchForm />
              </section>
              <ProductBrowser compact products={products} />

              {latestNews.length > 0 && (
                <section className="section-block">
                  <div className="section-heading product-heading">
                    <div>
                      <span className="eyebrow">新闻中心</span>
                      <h2>公司新闻与产品资讯</h2>
                    </div>
                    <Link className="btn" href="/news">
                      查看全部新闻
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
                    ))}
                  </div>
                </section>
              )}
            </div>

            <section className="cta-band" id="support">
              <div>
                <span className="eyebrow">采购支持</span>
                <h2>需要批量规格、替代品或交期确认？</h2>
                <p>将目标产品加入询价车，销售团队会结合数量、库存和客户需求回复报价。也可以直接通过电话或邮件联系。</p>
              </div>
              <div className="contact-stack">
                <a className="contact-link" href={`tel:${site.supportPhone}`}>
                  {site.supportPhone}
                </a>
                <a className="contact-link" href={`mailto:${site.contactEmail}`}>
                  {site.contactEmail}
                </a>
                <Link className="btn primary large" href="/cart">
                  查看询价车
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
