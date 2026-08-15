import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { RichTextContent } from "@/components/RichTextContent";
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
            <RichTextContent content={site.aboutDescription} imageAlt="关于我们图片" />
          </div>
        </section>
        <Footer site={site} />
      </main>
    </div>
  );
}
