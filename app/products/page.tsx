import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProductBrowser } from "@/components/ProductBrowser";
import { getProducts, getSiteContent } from "@/lib/cms";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ProductsPage() {
  const [site, products] = await Promise.all([getSiteContent(), getProducts()]);

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
