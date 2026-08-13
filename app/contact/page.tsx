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
          <h1>{site.contactTitle}</h1>
          <p>{site.contactDescription}</p>
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
          {site.contactQrImage && (
            <div className="about-qr">
              <img src={site.contactQrImage} alt="凯森斯生物联系二维码" />
            </div>
          )}
          <Link className="btn primary large" href="/cart">
            {site.contactCta}
          </Link>
        </section>
      </main>
    </div>
  );
}
