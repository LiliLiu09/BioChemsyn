import Link from "@/components/LocaleLink";
import { coreCategories } from "@/lib/catalog-seo";
import type { Locale } from "@/lib/i18n";

export function CoreCategoryLinks({ locale }: { locale: Locale }) {
  return (
    <nav className="seo-category-links" aria-label={locale === "en" ? "Research reagent collections" : "核心产品分类"}>
      {coreCategories.map((category) => <Link className="btn" key={category.slug} href={`/products/category/${category.slug}`}>{locale === "en" ? category.name : category.nameZh}</Link>)}
    </nav>
  );
}
