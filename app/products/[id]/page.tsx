import Link from "@/components/LocaleLink";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProductDetailActions } from "@/components/ProductDetailActions";
import { RichTextContent } from "@/components/RichTextContent";
import { getProductById, getProducts, getSiteContent } from "@/lib/cms";
import { isProductAvailable, localizeProduct, localizeSiteContent } from "@/lib/content-locale";
import { getLocale } from "@/lib/locale-server";
import { localizePath, translate } from "@/lib/i18n";
import { absoluteUrl, jsonLd, pageMetadata } from "@/lib/seo";
import { categoryForProduct, priorityProducts } from "@/lib/catalog-seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function lines(value: string) {
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, locale] = await Promise.all([params, getLocale()]);
  const raw = await getProductById(id);
  if (!raw) notFound();
  const available = isProductAvailable(raw, locale);
  const product = localizeProduct(raw, locale);
  const name = locale === "en" ? product.nameEn : product.nameCn || product.nameEn;
  const identity = product.cas ? ` | CAS ${product.cas}` : ` | ${product.catalogNo || product.sku}`;
  const description = locale === "en"
    ? `${name}${product.cas ? ` (CAS ${product.cas})` : ""}. View chemical identity and research reagent specifications. Enquire about pack sizes and request a quotation from KASONS.`
    : `${name}${product.cas ? `，CAS ${product.cas}` : ""}。查看产品规格、分子式及货号，联系凯森斯生物获取报价与批次资料。`;
  return {
    ...pageMetadata(`/products/${encodeURIComponent(id)}`, locale, `${name}${identity} | KASONS`, description, isProductAvailable(raw, "en")),
    ...(!available ? { robots: { index: false, follow: true } } : {})
  };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, rawSite, rawProduct, locale] = await Promise.all([params, getSiteContent(), params.then(({ id: productId }) => getProductById(productId)), getLocale()]);
  const t = (zh: string, en: string) => translate(locale, zh, en);
  const site = localizeSiteContent(rawSite, locale);
  if (!rawProduct) {
    notFound();
  }

  if (!isProductAvailable(rawProduct, locale)) {
    return (
      <div className="shell">
        <Header site={site} />
        <main className="main">
          <section className="content-page">
            <h1>{t("产品内容暂未提供", "English product information is not available yet")}</h1>
            <p>{t("请联系销售团队获取产品信息。", "Please contact our sales team for details, or switch to the Chinese product page.")}</p>
            <a className="btn" href={`/api/locale?language=zh&returnTo=${encodeURIComponent(`/products/${encodeURIComponent(id)}`)}`}>{t("查看中文版本", "View Chinese version")}</a>
            <Link className="btn primary" href="/contact">{t("联系我们", "Contact us")}</Link>
          </section>
          <Footer site={site} />
        </main>
      </div>
    );
  }

  const product = localizeProduct(rawProduct, locale);
  const basicInfo = product.details;
  const references = product.references;
  const certificate = product.certificate;
  const category = categoryForProduct(rawProduct);
  const priority = priorityProducts[id];
  const related = locale === "en" && priority
    ? (await getProducts()).filter((item) => item.id !== id && priorityProducts[item.id]?.category === priority.category && isProductAvailable(item, locale)).slice(0, 4).map((item) => localizeProduct(item, locale))
    : [];
  const description = locale === "en"
    ? `${priority?.summary || `${product.nameEn} research reagent.`} Catalog number: ${product.catalogNo || product.sku}${product.cas ? `; CAS: ${product.cas}` : ""}.`
    : `${product.nameCn || product.nameEn}，货号 ${product.catalogNo || product.sku}${product.cas ? `，CAS ${product.cas}` : ""}。`;
  const schema = {
    "@context": "https://schema.org", "@type": "Product",
    name: product.nameCn || product.nameEn, description,
    sku: product.catalogNo || product.sku,
    url: absoluteUrl(localizePath(`/products/${encodeURIComponent(id)}`, locale)),
    ...(product.image ? { image: [absoluteUrl(product.image)] } : {}),
    ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
    additionalProperty: [
      ...(product.cas ? [{ "@type": "PropertyValue", name: "CAS number", value: product.cas }] : []),
      ...(product.formula && product.formula !== "Available on request" ? [{ "@type": "PropertyValue", name: "Molecular formula", value: product.formula }] : [])
    ]
  };

  return (
    <div className="shell">
      <Header site={site} />
      <main className="main">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
        <div className="product-breadcrumb">
          <Link href="/">{t("首页", "Home")}</Link>
          <span>/</span>
          <Link href="/products">{t("产品中心", "Products")}</Link>
          <span>/</span>
          {category && <><Link href={`/products/category/${category.slug}`}>{locale === "en" ? category.name : category.nameZh}</Link><span>/</span></>}
          <span>{product.nameCn || product.nameEn}</span>
        </div>

        <section className="product-detail-hero">
          <div className="product-detail-image">
            {product.image ? <img src={product.image} alt={product.nameCn || product.nameEn} /> : <span>{t("产品图片", "Product image")}</span>}
          </div>

          <div className="product-detail-summary">
            <h1>{product.nameCn || product.nameEn || t("未命名产品", "Unnamed product")}</h1>
            {locale === "zh" && product.nameCn && product.nameEn && <p className="product-subtitle">{product.nameEn}</p>}

            <dl className="product-field-list">
              <div>
                <dt>{t("英文名", "Product name")}</dt>
                <dd>{product.nameEn}</dd>
              </div>
              {product.synonyms && (
                <div>
                  <dt>{t("同义词", "Synonyms")}</dt>
                  <dd>{product.synonyms}</dd>
                </div>
              )}
              <div>
                <dt>{t("产品编号", "Catalog number")}</dt>
                <dd>{product.catalogNo || product.sku}</dd>
              </div>
              <div>
                <dt>{t("产品分类", "Category")}</dt>
                <dd>{category ? <Link href={`/products/category/${category.slug}`}>{product.category}</Link> : product.category}</dd>
              </div>
              <div>
                <dt>{t("CAS 号", "CAS number")}</dt>
                <dd>{product.cas}</dd>
              </div>
              <div>
                <dt>{t("分子式", "Molecular formula")}</dt>
                <dd>{product.formula}</dd>
              </div>
              <div>
                <dt>{t("分子量", "Molecular weight")}</dt>
                <dd>{product.molecularWeight}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="product-offer">
          <div className="offer-grid">
            <div>
              <span>{t("编号", "Catalog number")}</span>
              <b>{product.catalogNo || product.sku}</b>
            </div>
            <div>
              <span>{t("品牌", "Brand")}</span>
              <b>{product.brand}</b>
            </div>
            <div>
              <span>{t("纯度", "Purity")}</span>
              <b>{product.purity}</b>
            </div>
            <div>
              <span>{t("包装", "Pack size")}</span>
              <b>{product.packageSize}</b>
            </div>
            <div>
              <span>{t("货期", "Lead time")}</span>
              <b>{product.leadTime}</b>
            </div>
            <div className="offer-price">
              <span>{t("价格", "Price")}</span>
              <ProductDetailActions productId={product.id} />
            </div>
          </div>
        </section>

        {locale === "en" && priority && (
          <section className="seo-copy">
            <h2>Product overview</h2>
            <p>{priority.summary}</p>
            <h2>Choosing the correct material</h2>
            <p>{priority.selection}</p>
            <h2>Request specifications and a quotation</h2>
            <p>Quote catalog number <strong>{product.catalogNo || product.sku}</strong>{product.cas ? ` and CAS ${product.cas}` : ""}, the quantity required and your documentation needs. Confirm purity, pack size, lead time and any handling requirements with our sales team.</p>
            <p><a href="mailto:inquiry@biochemsyn.com">inquiry@biochemsyn.com</a> · <Link href="/contact">Contact KASONS</Link></p>
            {related.length > 0 && <><h2>Related research reagents</h2><ul>{related.map((item) => <li key={item.id}><Link href={`/products/${item.id}`}>{item.nameEn}</Link></li>)}</ul></>}
          </section>
        )}
        <section className="product-tabs">
          <input id="tab-basic" name="product-tabs" type="radio" defaultChecked />
          <input id="tab-references" name="product-tabs" type="radio" />
          <input id="tab-certificate" name="product-tabs" type="radio" />

          <div className="tab-labels" role="tablist" aria-label={t("产品详情", "Product details")}>
            <label htmlFor="tab-basic">{t("基本信息", "Basic information")}</label>
            <label htmlFor="tab-references">{t("参考文献", "References")}</label>
            <label htmlFor="tab-certificate">{t("质检证书", "Quality certificates")}</label>
          </div>

          <div className="tab-panels">
            <div className="tab-panel panel-basic">
              <RichTextContent content={basicInfo} locale={locale} imageAlt={t("产品说明图片", "Product information image")} />
            </div>
            <div className="tab-panel panel-references">
              {lines(references).map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <div className="tab-panel panel-certificate">
              {lines(certificate).map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        </section>
        <Footer site={site} />
      </main>
    </div>
  );
}
