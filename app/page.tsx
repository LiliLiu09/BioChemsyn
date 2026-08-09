import Link from "next/link";
import { Header } from "@/components/Header";
import { ProductBrowser } from "@/components/ProductBrowser";
import { getProducts, getSiteContent } from "@/lib/cms";

export default async function HomePage() {
  const [site, products] = await Promise.all([getSiteContent(), getProducts()]);

  return (
    <div className="shell">
      <Header site={site} />
      <main className="main">
        <section className="hero">
          <div className="hero-copy">
            <h1>{site.heroTitle}</h1>
            <p>{site.heroDescription}</p>
            <Link className="btn primary" href="/products">
              {site.primaryCta}
            </Link>
          </div>
          <aside className="side-card" id="support">
            <h3>首版业务闭环</h3>
            <div className="flow">
              <div className="flow-item">
                <span className="dot">1</span>
                <span>访客搜索产品，只看到基础资料。</span>
              </div>
              <div className="flow-item">
                <span className="dot">2</span>
                <span>登录后解锁价格、库存和加入询价车。</span>
              </div>
              <div className="flow-item">
                <span className="dot">3</span>
                <span>客户提交询价，后台销售改价跟进。</span>
              </div>
              <div className="flow-item">
                <span className="dot">4</span>
                <span>后续再接 ERP、库存和发票系统。</span>
              </div>
            </div>
          </aside>
        </section>
        <ProductBrowser compact products={products} />
      </main>
    </div>
  );
}
