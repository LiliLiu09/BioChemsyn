import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { CartClient } from "@/components/CartClient";
import { getProducts, getSiteContent } from "@/lib/cms";

export default async function CartPage() {
  const [site, products] = await Promise.all([getSiteContent(), getProducts()]);

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
