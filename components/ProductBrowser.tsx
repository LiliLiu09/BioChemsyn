"use client";

import { Search, ShoppingCart } from "lucide-react";
import Link from "@/components/LocaleLink";
import { useLanguage } from "./LanguageProvider";
import { useSearchParams } from "next/navigation";
import { useMemo, useId } from "react";
import { cartStorageKey } from "@/lib/session";
import type { Product } from "@/lib/types";

type CartLine = {
  id: string;
  qty: number;
};

function matches(product: Product, keyword: string, category: string) {
  const query = keyword.trim().toLowerCase();
  const productCategory = product.categoryKey || product.category || "未分类";
  const inCategory = category === "all" || productCategory === category || product.category === category;
  const inText =
    !query ||
    [
      product.sku,
      product.catalogNo,
      product.cas,
      product.nameCn,
      product.nameEn,
      product.synonyms,
      product.formula,
      product.molecularWeight,
      ...product.tags
    ]
      .join(" ")
      .toLowerCase()
      .includes(query);

  return inCategory && inText;
}

export function ProductBrowser({ compact = false, products }: { compact?: boolean; products: Product[] }) {
  const { locale, t } = useLanguage();
  const filterId = useId();
  const valueOrDash = (value: string | number) => value || t("待确认", "On request");
  const searchParams = useSearchParams();
  const keyword = searchParams.get("q") || "";
  const category = searchParams.get("category") || "all";
  const updateFilter = (key: "q" | "category", value: string) => {
    const url = new URL(window.location.href);
    if (!value || (key === "category" && value === "all")) url.searchParams.delete(key);
    else url.searchParams.set(key, value);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };
  const categories = useMemo(
    () => Array.from(new Map(products.map((product) => [product.categoryKey || product.category || "未分类", product.category || t("未分类", "Uncategorized")])).entries()),
    [products, t]
  );

  const filtered = useMemo(
    () => products.filter((product) => matches(product, keyword, category)).slice(0, compact ? 20 : undefined),
    [products, keyword, category, compact]
  );

  const addToCart = (product: Product) => {
    const current = JSON.parse(localStorage.getItem(cartStorageKey) || "[]") as CartLine[];
    const existing = current.find((line) => line.id === product.id);
    const next = existing
      ? current.map((line) => (line.id === product.id ? { ...line, qty: line.qty + 1 } : line))
      : [...current, { id: product.id, qty: 1 }];

    localStorage.setItem(cartStorageKey, JSON.stringify(next));
    window.dispatchEvent(new Event("cart-updated"));
  };

  return (
    <section className="product-section" id="products">
      <div className="section-heading product-heading">
        <div>
          <span className="eyebrow">{compact ? t("精选产品", "Featured products") : t("产品数据库", "Product database")}</span>
          <h2>{compact ? t("近期热门与现货产品", "Popular & in-stock products") : t("产品库", "Product catalog")}</h2>
        </div>
        {compact && (
          <Link className="btn" href="/products">
            {t("查看全部产品", "View all products")}
          </Link>
        )}
      </div>

      <form className="search-card" onSubmit={(event) => event.preventDefault()}>
        <label className="search-field">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">{t("搜索产品", "Search products")}</span>
          <input
            value={keyword}
            onChange={(event) => updateFilter("q", event.target.value)}
            placeholder={t("输入 CAS、货号、产品名、别名或分子式", "Search CAS, catalog number, name, synonyms or formula")}
          />
        </label>
        <label className="sr-only" htmlFor={filterId}>
          {t("产品分类", "Product category")}
        </label>
        <select id={filterId} className="field" value={category} onChange={(event) => updateFilter("category", event.target.value)}>
          <option value="all">{t("全部分类", "All categories")}</option>
          {categories.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button className="btn primary" type="submit">
          {t("搜索产品", "Search products")}
        </button>
      </form>
    

      <div className="toolbar">
        <span className="result-count">{t(`找到 ${filtered.length} 个产品`, `${filtered.length} products found`)}</span>
      </div>

      <div className="grid">
        {filtered.map((product) => (
          <article className="product-card" key={product.id}>
            <Link className="product-thumb" href={`/products/${product.id}`} aria-label={t(`查看${product.nameCn || product.nameEn || product.sku}详情`, `View ${product.nameEn || product.sku}`)}>
              {product.image ? (
                <img src={product.image} alt={product.nameCn || product.nameEn || product.sku} />
              ) : (
                <span className="product-placeholder">
                  <b>KASONS</b>
                  <small>{product.formula || product.cas || "Chemical Product"}</small>
                </span>
              )}
            </Link>
            <div className="product-head">
              <span className="sku">{product.catalogNo || product.sku}</span>
              <span className="pill">{product.category || t("未分类", "Uncategorized")}</span>
            </div>
            <div>
              <h3>
                <Link href={`/products/${product.id}`}>{product.nameCn || product.nameEn || t("未命名产品", "Unnamed product")}</Link>
              </h3>
              {locale === "zh" && <p>{product.nameEn || "英文名称待补充"}</p>}
            </div>
            <div className="specs">
              <span>
                <b>{t("CAS 号", "CAS Number")}</b>
                {valueOrDash(product.cas)}
              </span>
              <span>
                <b>{t("别名", "Synonyms")}</b>
                {valueOrDash(product.synonyms)}
              </span>
              <span>
                <b>{t("分子式", "Chemical Formula")}</b>
                {valueOrDash(product.formula)}
              </span>
              <span>
                <b>{t("包装规格", "Pack Size")}</b>
                {valueOrDash(product.packageSize)}
              </span>
            </div>
            <div className="tag-row">
              {(product.tags.length ? product.tags : [t("询价确认", "Request a quote")]).map((tag) => (
                <span className="pill subtle" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
            <div className="price-row">
              <Link className="locked" href="/cart">
                {t("提交后报价", "Price on request")}
              </Link>
              <button className="btn primary" type="button" onClick={() => addToCart(product)}>
                <ShoppingCart size={16} aria-hidden="true" />
                {t("加入询价车", "Add to inquiry cart")}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
