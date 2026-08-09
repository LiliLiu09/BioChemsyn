import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { ProductDetailActions } from "@/components/ProductDetailActions";
import { getProducts, getSiteContent } from "@/lib/cms";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, site, products] = await Promise.all([params, getSiteContent(), getProducts()]);
  const product = products.find((item) => item.id === id);

  if (!product) {
    notFound();
  }

  return (
    <div className="shell">
      <Header site={site} />
      <main className="main">
        <Link className="locked" href="/products">
          返回产品中心
        </Link>
        <section className="detail-hero">
          <div className="detail-media">
            {product.image ? <img src={product.image} alt={product.nameCn || product.nameEn} /> : <span>暂无产品图片</span>}
          </div>
          <div className="detail-copy">
            <span className="sku">{product.sku}</span>
            <h1>{product.nameCn || product.nameEn || "未命名产品"}</h1>
            <p>{product.nameEn || "英文名称待补充"}</p>
            <div className="tag-row">
              <span className="pill">{product.category || "未分类"}</span>
              {(product.tags.length ? product.tags : ["询价确认"]).map((tag) => (
                <span className="pill subtle" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
            <div className="specs detail-specs">
              <span><b>CAS</b>{product.cas || "待确认"}</span>
              <span><b>分子式</b>{product.formula || "待确认"}</span>
              <span><b>纯度</b>{product.purity || "待确认"}</span>
              <span><b>规格</b>{product.packageSize || "待确认"}</span>
              <span><b>库存</b>{product.stock > 0 ? product.stock : "询期"}</span>
              <span><b>货期</b>{product.leadTime || "待确认"}</span>
            </div>
            <ProductDetailActions productId={product.id} />
          </div>
        </section>
      </main>
    </div>
  );
}
