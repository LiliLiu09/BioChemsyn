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
  return { title: translate(locale, "联系我们", "Contact us") };
}

export default async function ContactPage() {
  const [rawSite, locale] = await Promise.all([getSiteContent(), getLocale()]);
  const site = localizeSiteContent(rawSite, locale);

  return (
    <div className="shell">
      <Header site={site} />
      <main className="main">
        <section className="content-page contact-page">
          <span className="eyebrow">{translate(locale, "联系我们", "Contact us")}</span>
          <h1>{site.contactTitle}</h1>
          <RichTextContent content={site.contactDescription} locale={locale} imageAlt={translate(locale, "联系我们图片", "Contact KASONS")} />
        </section>
        <Footer site={site} />
      </main>
    </div>
  );
}
