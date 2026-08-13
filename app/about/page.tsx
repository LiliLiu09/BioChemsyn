import { Header } from "@/components/Header";
import { getProducts, getSiteContent } from "@/lib/cms";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AboutPage() {
  const [site, products] = await Promise.all([getSiteContent(), getProducts()]);
  const categories = Array.from(new Set(products.map((product) => product.category).filter(Boolean)));

  return (
    <div className="shell">
      <Header site={site} />
      <main className="main">
        <section className="content-page">
          <span className="eyebrow">关于我们</span>
          <h1>{site.companyName}</h1>
          <p>
            {site.brandName} 专注于科研试剂、标准品与化学品的产品展示和采购询价服务，帮助研发、质控和采购团队更高效地检索产品信息、确认规格并提交询价。
          </p>
          <div className="content-stats">
            <div>
              <b>{products.length}</b>
              <span>产品条目</span>
            </div>
            <div>
              <b>{categories.length}</b>
              <span>产品分类</span>
            </div>
            <div>
              <b>KASONS</b>
              <span>品牌服务</span>
            </div>
          </div>
        </section>

        <section className="trust-strip">
          <div>
            <b>产品资料清晰</b>
            <span>围绕 CAS、货号、英文名、规格和详情字段组织产品信息。</span>
          </div>
          <div>
            <b>询价流程明确</b>
            <span>客户提交需求后，销售团队可在后台查看并跟进。</span>
          </div>
          <div>
            <b>内容持续维护</b>
            <span>后台 CMS 支持产品、新闻、资讯和站点信息持续更新。</span>
          </div>
        </section>
      </main>
    </div>
  );
}
