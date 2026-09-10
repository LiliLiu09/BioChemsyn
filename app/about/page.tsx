import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { RichTextContent } from "@/components/RichTextContent";
import { getSiteContent } from "@/lib/cms";
import { localizeSiteContent } from "@/lib/content-locale";
import { getLocale } from "@/lib/locale-server";
import { translate } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
  const locale = await getLocale();
  return { title: translate(locale, "关于我们", "About us") };
}

export default async function AboutPage() {
  const [rawSite, locale] = await Promise.all([getSiteContent(), getLocale()]);
  const site = localizeSiteContent(rawSite, locale);

  return (
    <div className="shell">
      <Header site={site} />
      <main className="main">
        <section className="content-page about-page">
          <div className="about-content">
            <span className="eyebrow">{translate(locale, "关于我们", "About us")}</span>
            <h1>{site.aboutTitle}</h1>
            <RichTextContent content={site.aboutDescription} locale={locale} imageAlt={translate(locale, "关于我们图片", "About KASONS")} />
          </div>
        </section>
        <Footer site={site} />
      </main>
    </div>
  );
}
