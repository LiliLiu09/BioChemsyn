import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { ProductDetailActions } from "@/components/ProductDetailActions";
import { getProducts, getSiteContent } from "@/lib/cms";

function valueOrDash(value: string | number) {
  return value || "待确认";
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, site, products] = await Promise.all([params, getSiteContent(), getProducts()]);
  const productIndex = products.findIndex((item) => item.id === id);
  const product = products[productIndex];

  if (!product) {
    notFound();
  }

  const previous = products[productIndex - 1];
  const next = products[productIndex + 1];
  const productUrl = `/products/${product.id}`;

  return (
    <div className="shell">
      <Header site={site} />
      <main className="main">
        <div className="detail-titlebar">
          <div>
            <h1>Product display</h1>
            <span />
          </div>
          <nav aria-label="面包屑">
            <Link href="/">Home</Link>
            <span>&gt;&gt;</span>
            <Link href="/products">Product display</Link>
          </nav>
        </div>

        <section className="legacy-product-detail">
          <div className="legacy-gallery">
            <div className="legacy-main-image">
              {product.image ? <img src={product.image} alt={product.nameEn || product.nameCn} /> : <span>Product Image</span>}
            </div>
            <div className="legacy-thumb">
              {product.image ? <img src={product.image} alt={`${product.nameEn || product.nameCn} thumbnail`} /> : <span />}
            </div>
          </div>

          <div className="legacy-summary">
            <h2>{product.nameEn || product.nameCn || "未命名产品"}</h2>
            <dl>
              <div>
                <dt>CAS Number：</dt>
                <dd>{valueOrDash(product.cas)}</dd>
              </div>
              <div>
                <dt>Synonyms：</dt>
                <dd>{valueOrDash(product.synonyms)}</dd>
              </div>
              <div>
                <dt>Chemical Formula：</dt>
                <dd>{valueOrDash(product.formula)}</dd>
              </div>
              <div>
                <dt>Pack Size：</dt>
                <dd>{valueOrDash(product.packageSize)}</dd>
              </div>
            </dl>
            <div className="legacy-nav">
              {previous ? <Link className="btn" href={`/products/${previous.id}`}>Last product</Link> : <span />}
              {next ? <Link className="btn" href={`/products/${next.id}`}>Next product</Link> : <span />}
            </div>
            <ProductDetailActions productId={product.id} />
          </div>
        </section>

        <section className="legacy-details">
          <div className="legacy-section-title">
            <h2>Details</h2>
            <span />
          </div>
          <div className="legacy-detail-copy">
            <p>Product Name: {product.nameEn || product.nameCn || "待确认"}</p>
            <p>CAS: {valueOrDash(product.cas)}</p>
            <p>Catalog #: {product.catalogNo || product.sku || "待确认"}</p>
            <p>MW: {valueOrDash(product.molecularWeight)}</p>
            <p>Chemical Formula: {valueOrDash(product.formula)}</p>
            <p>Synonym: {valueOrDash(product.synonyms)}</p>
          </div>

          {product.scaleNote && (
            <p className="scale-note">
              ******{product.scaleNote.includes("凯森斯生物") ? product.scaleNote : `凯森斯生物可提供该产品：${product.scaleNote}`}******
            </p>
          )}

          <p className="legacy-description">{product.details || "产品详细介绍待补充。"}</p>

          <div className="legacy-link-row">
            <span>产品链接：</span>
            <Link href={productUrl}>{productUrl}</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
