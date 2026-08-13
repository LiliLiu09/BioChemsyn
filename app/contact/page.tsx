import Link from "next/link";
import { Header } from "@/components/Header";
import { getSiteContent } from "@/lib/cms";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ContactPage() {
  const site = await getSiteContent();

  return (
    <div className="shell">
      <Header site={site} />
      <main className="main">
        <section className="content-page contact-page">
          <span className="eyebrow">联系我们</span>
          <h1>提交需求或联系凯森斯生物</h1>
          <p>如需产品规格、批量供货、交期或替代品确认，可以通过电话、邮箱或询价车提交需求。</p>
          <div className="contact-cards">
            <a className="contact-card" href={`tel:${site.supportPhone}`}>
              <span>联系电话</span>
              <b>{site.supportPhone}</b>
            </a>
            <a className="contact-card" href={`mailto:${site.contactEmail}`}>
              <span>联系邮箱</span>
              <b>{site.contactEmail}</b>
            </a>
            <div className="contact-card">
              <span>公司地址</span>
              <b>{site.address}</b>
            </div>
          </div>
          <Link className="btn primary large" href="/cart">
            前往询价车
          </Link>
        </section>
      </main>
    </div>
  );
}
