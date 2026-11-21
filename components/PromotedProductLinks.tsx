import Link from "@/components/LocaleLink";
import { translate, type Locale } from "@/lib/i18n";
import { promotedProducts } from "@/lib/promoted-products";
import type { Product } from "@/lib/types";

export function PromotedProductLinks({ products, locale }: { products: Product[]; locale: Locale }) {
  const items = promotedProducts.flatMap((promotion) => {
    const product = products.find((item) => item.cas?.trim() === promotion.cas);
    return product ? [{ promotion, product }] : [];
  });
  if (!items.length) return null;

  const title = translate(locale, "重点推荐科研试剂", "Featured research reagents");
  return (
    <section className="product-section" aria-label={title}>
      <div className="section-heading"><h2>{title}</h2></div>
      <div className="seo-category-links promoted-product-links">
        {items.map(({ promotion, product }) => (
          <Link className="btn" key={promotion.cas} href={`/products/${encodeURIComponent(product.id)}`}>
            {promotion[locale]} · CAS {promotion.cas}
          </Link>
        ))}
      </div>
    </section>
  );
}
