import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { RichTextContent } from "@/components/RichTextContent";
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
          <RichTextContent content={site.contactDescription} imageAlt="联系我们图片" />
        </section>
        <Footer site={site} />
      </main>
    </div>
  );
}
