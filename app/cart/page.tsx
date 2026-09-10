import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { CartClient } from "@/components/CartClient";
import { getProducts, getSiteContent } from "@/lib/cms";
import { localizeProduct, localizeSiteContent } from "@/lib/content-locale";
import { getLocale } from "@/lib/locale-server";
import { translate } from "@/lib/i18n";

export async function generateMetadata() {
  const locale = await getLocale();
  return { title: translate(locale, "询价车", "Quote cart") };
}

export default async function CartPage() {
  const [rawSite, rawProducts, locale] = await Promise.all([getSiteContent(), getProducts(), getLocale()]);
  const site = localizeSiteContent(rawSite, locale);
  const products = rawProducts.map((product) => localizeProduct(product, locale));

  return (
    <div className="shell">
      <Header site={site} />
      <main className="main">
        <CartClient products={products} />
        <Footer site={site} />
      </main>
    </div>
  );
}
