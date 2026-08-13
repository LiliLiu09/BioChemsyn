import { Header } from "@/components/Header";
import { getSiteContent } from "@/lib/cms";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AboutPage() {
  const site = await getSiteContent();

  return (
    <div className="shell">
      <Header site={site} />
      <main className="main">
        <section className="content-page about-page">
          <div className="about-content">
            <span className="eyebrow">关于我们</span>
            <h1>{site.aboutTitle}</h1>
            <p>{site.aboutDescription}</p>
          </div>

          {site.aboutQrImage && (
            <div className="about-qr">
              <img src={site.aboutQrImage} alt="凯森斯生物二维码" />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
