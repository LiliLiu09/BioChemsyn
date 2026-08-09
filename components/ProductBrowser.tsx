"use client";

import { Search, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { cartStorageKey } from "@/lib/session";
import type { Product } from "@/lib/types";

type CartLine = {
  id: string;
  qty: number;
};

function matches(product: Product, keyword: string, category: string) {
  const query = keyword.trim().toLowerCase();
  const productCategory = product.category || "未分类";
  const inCategory = category === "all" || productCategory === category;
  const inText =
    !query ||
    [product.sku, product.cas, product.nameCn, product.nameEn, product.formula, ...product.tags]
      .join(" ")
      .toLowerCase()
      .includes(query);

  return inCategory && inText;
}

function valueOrDash(value: string | number) {
  return value || "待确认";
}

export function ProductBrowser({ compact = false, products }: { compact?: boolean; products: Product[] }) {
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("all");
  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category || "未分类"))),
    [products]
  );

  const filtered = useMemo(
    () => products.filter((product) => matches(product, keyword, category)).slice(0, compact ? 6 : undefined),
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
          <span className="eyebrow">{compact ? "精选产品" : "产品数据库"}</span>
          <h2>{compact ? "近期热门与现货产品" : "产品库"}</h2>
        </div>
        {compact && (
          <Link className="btn" href="/products">
            查看全部产品
          </Link>
        )}
      </div>

      <div className="search-card">
        <label className="search-field">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">搜索产品</span>
          <input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="输入 CAS、货号、中文名、英文名或分子式"
          />
        </label>
        <label className="sr-only" htmlFor="category-filter">
          产品分类
        </label>
        <select id="category-filter" className="field" value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="all">全部分类</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button className="btn primary" type="button">
          搜索产品
        </button>
      </div>

      <div className="toolbar">
        <span className="result-count">找到 {filtered.length} 个产品</span>
      </div>

      <div className="grid">
        {filtered.map((product) => (
          <article className="product-card" key={product.id}>
            <div className="product-head">
              <span className="sku">{product.sku}</span>
              <span className="pill">{product.category || "未分类"}</span>
            </div>
            <div>
              <h3>{product.nameCn || product.nameEn || "未命名产品"}</h3>
              <p>{product.nameEn || "英文名称待补充"}</p>
            </div>
            <div className="specs">
              <span>
                <b>CAS</b>
                {valueOrDash(product.cas)}
              </span>
              <span>
                <b>纯度</b>
                {valueOrDash(product.purity)}
              </span>
              <span>
                <b>规格</b>
                {valueOrDash(product.packageSize)}
              </span>
              <span>
                <b>库存</b>
                {product.stock > 0 ? product.stock : "询期"}
              </span>
              <span>
                <b>分子式</b>
                {valueOrDash(product.formula)}
              </span>
              <span>
                <b>货期</b>
                {valueOrDash(product.leadTime)}
              </span>
            </div>
            <div className="tag-row">
              {(product.tags.length ? product.tags : ["询价确认"]).map((tag) => (
                <span className="pill subtle" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
            <div className="price-row">
              <Link className="locked" href="/cart">
                提交后报价
              </Link>
              <button className="btn primary" type="button" onClick={() => addToCart(product)}>
                <ShoppingCart size={16} aria-hidden="true" />
                加入询价车
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
