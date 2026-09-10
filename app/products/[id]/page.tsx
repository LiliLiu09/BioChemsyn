import Link from "@/components/LocaleLink";
import { notFound } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProductDetailActions } from "@/components/ProductDetailActions";
import { RichTextContent } from "@/components/RichTextContent";
import { getProducts, getSiteContent } from "@/lib/cms";
import { isProductAvailable, localizeProduct, localizeSiteContent } from "@/lib/content-locale";
import { getLocale } from "@/lib/locale-server";
import { translate } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function lines(value: string) {
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function generateMetadata() {
  const locale = await getLocale();
  return { title: translate(locale, "产品详情", "Product details") };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, rawSite, products, locale] = await Promise.all([params, getSiteContent(), getProducts(), getLocale()]);
  const t = (zh: string, en: string) => translate(locale, zh, en);
  const site = localizeSiteContent(rawSite, locale);
  const rawProduct = products.find((item) => item.id === id);

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
  const valueOrDash = (value: string | number) => value || t("待确认", "Available on request");
  const basicInfo = product.details || t("产品基本信息待补充。", "Please contact us for product details.");
  const references = product.references || t("参考文献待补充。", "References are available on request.");
  const certificate = product.certificate || t("质检证书待补充。", "Quality certificates are available on request.");

  return (
    <div className="shell">
      <Header site={site} />
      <main className="main">
        <div className="product-breadcrumb">
          <Link href="/">{t("首页", "Home")}</Link>
          <span>/</span>
          <Link href="/products">{t("产品中心", "Products")}</Link>
          <span>/</span>
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
                <dd>{valueOrDash(product.nameEn)}</dd>
              </div>
              <div>
                <dt>{t("产品编号", "Catalog number")}</dt>
                <dd>{valueOrDash(product.catalogNo || product.sku)}</dd>
              </div>
              <div>
                <dt>{t("产品分类", "Category")}</dt>
                <dd>{valueOrDash(product.category)}</dd>
              </div>
              <div>
                <dt>{t("CAS 号", "CAS number")}</dt>
                <dd>{valueOrDash(product.cas)}</dd>
              </div>
              <div>
                <dt>{t("分子式", "Molecular formula")}</dt>
                <dd>{valueOrDash(product.formula)}</dd>
              </div>
              <div>
                <dt>{t("分子量", "Molecular weight")}</dt>
                <dd>{valueOrDash(product.molecularWeight)}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="product-offer">
          <div className="offer-grid">
            <div>
              <span>{t("编号", "Catalog number")}</span>
              <b>{valueOrDash(product.catalogNo || product.sku)}</b>
            </div>
            <div>
              <span>{t("品牌", "Brand")}</span>
              <b>{valueOrDash(product.brand)}</b>
            </div>
            <div>
              <span>{t("纯度", "Purity")}</span>
              <b>{valueOrDash(product.purity)}</b>
            </div>
            <div>
              <span>{t("包装", "Pack size")}</span>
              <b>{valueOrDash(product.packageSize)}</b>
            </div>
            <div>
              <span>{t("货期", "Lead time")}</span>
              <b>{valueOrDash(product.leadTime)}</b>
            </div>
            <div className="offer-price">
              <span>{t("价格", "Price")}</span>
              <ProductDetailActions productId={product.id} />
            </div>
          </div>
        </section>

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
