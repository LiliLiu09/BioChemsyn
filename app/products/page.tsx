import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProductBrowser } from "@/components/ProductBrowser";
import { getProducts, getSiteContent } from "@/lib/cms";
import { isProductAvailable, localizeProduct, localizeSiteContent } from "@/lib/content-locale";
import { getLocale } from "@/lib/locale-server";
import { translate } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
  const locale = await getLocale();
  return { title: translate(locale, "产品中心", "Products") };
}

export default async function ProductsPage() {
  const [rawSite, rawProducts, locale] = await Promise.all([getSiteContent(), getProducts(), getLocale()]);
  const site = localizeSiteContent(rawSite, locale);
  const products = rawProducts
    .filter((product) => isProductAvailable(product, locale))
    .map((product) => localizeProduct(product, locale));

  return (
    <div className="shell">
      <Header site={site} />
      <main className="main">
        <ProductBrowser products={products} />
        <Footer site={site} />
      </main>
    </div>
  );
}
