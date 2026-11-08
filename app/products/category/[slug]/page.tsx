import { notFound } from "next/navigation";
import Link from "@/components/LocaleLink";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductBrowser } from "@/components/ProductBrowser";
import { CoreCategoryLinks } from "@/components/CoreCategoryLinks";
import { getProducts, getSiteContent } from "@/lib/cms";
import { isProductAvailable, localizeProduct, localizeSiteContent } from "@/lib/content-locale";
import { coreCategories } from "@/lib/catalog-seo";
import { getLocale } from "@/lib/locale-server";
import { localizePath } from "@/lib/i18n";
import { absoluteUrl, jsonLd, pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const [{ slug }, locale] = await Promise.all([params, getLocale()]);
  const category = coreCategories.find((item) => item.slug === slug);
  if (!category) notFound();
  return pageMetadata(`/products/category/${slug}`, locale,
    `${locale === "en" ? category.name : category.nameZh} | KASONS`,
    locale === "en" ? category.description : `浏览凯森斯生物${category.nameZh}产品，查看产品名称、CAS 号与规格，提交科研采购询价。`);
}

export default async function CategoryPage({ params }: Props) {
  const [{ slug }, locale, rawProducts, rawSite] = await Promise.all([params, getLocale(), getProducts(), getSiteContent()]);
  const category = coreCategories.find((item) => item.slug === slug);
  if (!category) notFound();
  const products = rawProducts.filter((product) => isProductAvailable(product, locale) && (category.keys as readonly string[]).includes(product.categoryKey || product.category)).map((product) => localizeProduct(product, locale));
  const site = localizeSiteContent(rawSite, locale);
  const name = locale === "en" ? category.name : category.nameZh;
  const path = `/products/category/${slug}`;
  const schema = {
    "@context": "https://schema.org", "@type": "CollectionPage", name,
    url: absoluteUrl(localizePath(path, locale)),
    mainEntity: { "@type": "ItemList", numberOfItems: products.length, itemListElement: products.map((product, index) => ({ "@type": "ListItem", position: index + 1, name: product.nameCn || product.nameEn, url: absoluteUrl(localizePath(`/products/${encodeURIComponent(product.id)}`, locale)) })) }
  };
  return <div className="shell">
    <Header site={site} />
    <main className="main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
      <div className="product-breadcrumb"><Link href="/">{locale === "en" ? "Home" : "首页"}</Link><span>/</span><Link href="/products">{locale === "en" ? "Products" : "产品中心"}</Link><span>/</span><span>{name}</span></div>
      <section className="seo-copy">
        <h1>{name}</h1>
        <p>{locale === "en" ? category.overview : `本分类汇集${category.nameZh}相关产品。请按完整名称、CAS 号和货号确认所需产品。`}</p>
        <h2>{locale === "en" ? "Choosing a research reagent" : "如何选择产品"}</h2>
        <p>{locale === "en" ? category.selection : "请核对具体结构、构型及盐型。名称相近的产品不一定能够相互替代，具体规格以销售确认的信息为准。"}</p>
        <h2>{locale === "en" ? "Specifications and quotation" : "规格与询价"}</h2>
        <p>{locale === "en" ? category.questions : "询价时请提供货号、数量和用途，并确认纯度、包装及批次检测资料。"}</p>
        <p><a href="mailto:inquiry@biochemsyn.com">inquiry@biochemsyn.com</a> · <Link href="/contact">{locale === "en" ? "Contact KASONS" : "联系凯森斯"}</Link></p>
      </section>
      <ProductBrowser products={products} />
      <CoreCategoryLinks locale={locale} />
      <Footer site={site} />
    </main>
  </div>;
}
