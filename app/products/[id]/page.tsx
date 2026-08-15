import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { ProductDetailActions } from "@/components/ProductDetailActions";
import { getProducts, getSiteContent } from "@/lib/cms";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function valueOrDash(value: string | number) {
  return value || "待确认";
}

function priceLabel(price: number) {
  return price > 0 ? `¥${price}` : "询价";
}

function lines(value: string) {
  return value
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, site, products] = await Promise.all([params, getSiteContent(), getProducts()]);
  const product = products.find((item) => item.id === id);

  if (!product) {
    notFound();
  }

  const basicInfo = product.details || "产品基本信息待补充。";
  const references = product.references || "参考文献待补充。";
  const certificate = product.certificate || "质检证书待补充。";

  return (
    <div className="shell">
      <Header site={site} />
      <main className="main">
        <div className="product-breadcrumb">
          <Link href="/">首页</Link>
          <span>/</span>
          <Link href="/products">产品中心</Link>
          <span>/</span>
          <span>{product.nameCn || product.nameEn}</span>
        </div>

        <section className="product-detail-hero">
          <div className="product-detail-image">
            {product.image ? <img src={product.image} alt={product.nameCn || product.nameEn} /> : <span>Product Image</span>}
          </div>

          <div className="product-detail-summary">
            <h1>{product.nameCn || product.nameEn || "未命名产品"}</h1>
            {product.nameCn && product.nameEn && <p className="product-subtitle">{product.nameEn}</p>}

            <dl className="product-field-list">
              <div>
                <dt>英文名</dt>
                <dd>{valueOrDash(product.nameEn)}</dd>
              </div>
              <div>
                <dt>产品编号</dt>
                <dd>{valueOrDash(product.catalogNo || product.sku)}</dd>
              </div>
              <div>
                <dt>产品分类</dt>
                <dd>{valueOrDash(product.category)}</dd>
              </div>
              <div>
                <dt>CAS 号</dt>
                <dd>{valueOrDash(product.cas)}</dd>
              </div>
              <div>
                <dt>分子式</dt>
                <dd>{valueOrDash(product.formula)}</dd>
              </div>
              <div>
                <dt>分子量</dt>
                <dd>{valueOrDash(product.molecularWeight)}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="product-offer">
          <div className="offer-grid">
            <div>
              <span>编号</span>
              <b>{valueOrDash(product.catalogNo || product.sku)}</b>
            </div>
            <div>
              <span>品牌</span>
              <b>{valueOrDash(product.brand)}</b>
            </div>
            <div>
              <span>纯度</span>
              <b>{valueOrDash(product.purity)}</b>
            </div>
            <div>
              <span>包装</span>
              <b>{valueOrDash(product.packageSize)}</b>
            </div>
            <div>
              <span>货期</span>
              <b>{valueOrDash(product.leadTime)}</b>
            </div>
            <div className="offer-price">
              <span>价格</span>
              <strong>{priceLabel(product.price)}</strong>
              <ProductDetailActions productId={product.id} />
            </div>
          </div>
        </section>

        <section className="product-tabs">
          <input id="tab-basic" name="product-tabs" type="radio" defaultChecked />
          <input id="tab-references" name="product-tabs" type="radio" />
          <input id="tab-certificate" name="product-tabs" type="radio" />

          <div className="tab-labels" role="tablist" aria-label="产品详情">
            <label htmlFor="tab-basic">基本信息</label>
            <label htmlFor="tab-references">参考文献</label>
            <label htmlFor="tab-certificate">质检证书</label>
          </div>

          <div className="tab-panels">
            <div className="tab-panel panel-basic">
              {lines(basicInfo).map((line) => (
                <p key={line}>{line}</p>
              ))}
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
      </main>
    </div>
  );
}
