"use client";

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
  const inCategory = category === "all" || product.category === category;
  const inText =
    !query ||
    [product.sku, product.cas, product.nameCn, product.nameEn, product.formula, ...product.tags]
      .join(" ")
      .toLowerCase()
      .includes(query);

  return inCategory && inText;
}

export function ProductBrowser({ compact = false, products }: { compact?: boolean; products: Product[] }) {
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("all");
  const categories = useMemo(() => Array.from(new Set(products.map((product) => product.category))).filter(Boolean), [products]);

  const filtered = useMemo(
    () => products.filter((product) => matches(product, keyword, category)).slice(0, compact ? 6 : undefined),
    [keyword, category, compact]
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
    <section>
      <div className="search-card" style={{ marginBottom: 18 }}>
        <div className="search-grid">
          <input
            className="field"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="输入 CAS 号、货号、中文名、英文名、分子式"
          />
          <select className="field" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">全部分类</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button className="btn primary">搜索产品</button>
        </div>
      </div>

      <div className="toolbar">
        <h2>{compact ? "热销产品" : "产品库"}</h2>
        <span className="pill">找到 {filtered.length} 个产品</span>
      </div>

      <div className="grid">
        {filtered.map((product) => (
          <article className="product-card" key={product.id}>
            <div className="product-head">
              <span className="sku">{product.sku}</span>
              <span className="pill">{product.category}</span>
            </div>
            <div>
              <h3>{product.nameCn}</h3>
              <p>{product.nameEn}</p>
            </div>
            <div className="specs">
              <span>CAS：{product.cas}</span>
              <span>纯度：{product.purity}</span>
              <span>规格：{product.packageSize}</span>
              <span>库存：{product.stock > 0 ? product.stock : "询期"}</span>
              <span>分子式：{product.formula}</span>
              <span>货期：{product.leadTime}</span>
            </div>
            <div>
              {product.tags.map((tag) => (
                <span className="pill" key={tag} style={{ marginRight: 6 }}>
                  {tag}
                </span>
              ))}
            </div>
            <div className="price-row">
              <Link className="locked" href="/cart">
                申请报价
              </Link>
              <button className="btn primary" onClick={() => addToCart(product)}>
                加入询价车
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
