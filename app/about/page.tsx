import { Header } from "@/components/Header";
import { getProducts, getSiteContent } from "@/lib/cms";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AboutPage() {
  const [site, products] = await Promise.all([getSiteContent(), getProducts()]);
  const categories = Array.from(new Set(products.map((product) => product.category).filter(Boolean)));

  const points = [
    { title: site.aboutPointOneTitle, text: site.aboutPointOneText },
    { title: site.aboutPointTwoTitle, text: site.aboutPointTwoText },
    { title: site.aboutPointThreeTitle, text: site.aboutPointThreeText }
  ].filter((point) => point.title || point.text);

  return (
    <div className="shell">
      <Header site={site} />
      <main className="main">
        <section className="content-page">
          <span className="eyebrow">关于我们</span>
          <h1>{site.aboutTitle}</h1>
          <p>{site.aboutDescription}</p>
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
          {points.map((point) => (
            <div key={point.title}>
              <b>{point.title}</b>
              <span>{point.text}</span>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
