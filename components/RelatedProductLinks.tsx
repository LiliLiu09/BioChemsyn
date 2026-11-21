import Link from "@/components/LocaleLink";
import type { Product } from "@/lib/types";
import { translate, type Locale } from "@/lib/i18n";

export function RelatedProductLinks({ products, locale }: { products: Product[]; locale: Locale }) {
  if (!products.length) return null;
  return (
    <section className="seo-copy" aria-label={translate(locale, "相关产品", "Related products")}>
      <h2>{translate(locale, "相关产品", "Related products")}</h2>
      <ul>{products.map((product) => <li key={product.id}>
        <Link href={`/products/${encodeURIComponent(product.id)}`}>{product.nameCn || product.nameEn}{product.cas ? ` · CAS ${product.cas}` : ""}</Link>
      </li>)}</ul>
    </section>
  );
}
