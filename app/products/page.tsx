import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProductBrowser } from "@/components/ProductBrowser";
import { getProducts, getSiteContent } from "@/lib/cms";
import { isProductAvailable, localizeProduct, localizeSiteContent } from "@/lib/content-locale";
import { getLocale } from "@/lib/locale-server";
import { translate } from "@/lib/i18n";
import { pageMetadata } from "@/lib/seo";
import { CoreCategoryLinks } from "@/components/CoreCategoryLinks";
import { categoryForProduct } from "@/lib/catalog-seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const locale = await getLocale();
  const query = await searchParams;
  const category = categoryForProduct({ category: query.category || "" });
  const metadata = pageMetadata(category ? `/products/category/${category.slug}` : "/products", locale,
    translate(locale, "科研试剂与糖化学产品 | KASONS", "Glycochemistry & Research Reagents | KASONS"),
    translate(locale, "浏览凯森斯糖核苷酸、人乳寡糖、糖链试剂与化学品，按 CAS、名称和货号查询并提交询价。", "Browse nucleotide sugars, HMOs and glycan research reagents. Search by product name, CAS or catalog number and request a quotation from KASONS."));
  return { ...metadata, ...(query.q ? { robots: { index: false, follow: true } } : {}) };
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
        <h1>{translate(locale, "科研试剂与糖化学产品", "Glycochemistry & Research Reagents")}</h1>
        <CoreCategoryLinks locale={locale} />
        <ProductBrowser products={products} />
        <Footer site={site} />
      </main>
    </div>
  );
}
