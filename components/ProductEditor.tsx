"use client";

import { useState } from "react";
import type { Product } from "@/lib/types";

const emptyProduct: Product = {
  id: "",
  sku: "",
  cas: "",
  nameCn: "",
  nameEn: "",
  category: "",
  formula: "",
  purity: "",
  stock: 0,
  packageSize: "",
  price: 0,
  leadTime: "",
  image: "",
  tags: []
};

export function ProductEditor({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [activeId, setActiveId] = useState(initialProducts[0]?.id || "");
  const [message, setMessage] = useState("");
  const active = products.find((product) => product.id === activeId) || products[0];

  const update = (key: keyof Product, value: string | number | string[]) => {
    setProducts((current) => current.map((product) => (product.id === active.id ? { ...product, [key]: value } : product)));
  };

  const addProduct = () => {
    const product = { ...emptyProduct, id: `p-${Date.now()}`, nameCn: "新产品", sku: `SKU-${Date.now()}` };
    setProducts((current) => [...current, product]);
    setActiveId(product.id);
  };

  const removeProduct = () => {
    const next = products.filter((product) => product.id !== active.id);
    setProducts(next);
    setActiveId(next[0]?.id || "");
  };

  const save = async () => {
    setMessage("");
    const response = await fetch("/api/admin/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products })
    });
    setMessage(response.ok ? "已保存产品数据" : "保存失败，请重新登录后台");
  };

  if (!active) {
    return (
      <div className="panel admin-panel">
        <button className="btn primary" onClick={addProduct}>
          新增第一个产品
        </button>
      </div>
    );
  }

  return (
    <div className="admin-products">
      <div className="panel admin-list">
        <div className="toolbar">
          <h2>产品</h2>
          <button className="btn primary" onClick={addProduct}>
            新增
          </button>
        </div>
        {products.map((product) => (
          <button
            className={`admin-list-item ${product.id === active.id ? "active" : ""}`}
            key={product.id}
            onClick={() => setActiveId(product.id)}
          >
            <b>{product.nameCn || "未命名产品"}</b>
            <span>{product.sku}</span>
          </button>
        ))}
      </div>
      <div className="panel admin-panel">
        <div className="toolbar">
          <h1>编辑产品</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={removeProduct}>
              删除
            </button>
            <button className="btn primary" onClick={save}>
              保存全部
            </button>
          </div>
        </div>
        <div className="admin-form-grid">
          <label className="admin-field">
            <span>货号 SKU</span>
            <input className="field" value={active.sku} onChange={(event) => update("sku", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>CAS</span>
            <input className="field" value={active.cas} onChange={(event) => update("cas", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>中文名</span>
            <input className="field" value={active.nameCn} onChange={(event) => update("nameCn", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>英文名</span>
            <input className="field" value={active.nameEn} onChange={(event) => update("nameEn", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>分类</span>
            <input className="field" value={active.category} onChange={(event) => update("category", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>分子式</span>
            <input className="field" value={active.formula} onChange={(event) => update("formula", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>纯度</span>
            <input className="field" value={active.purity} onChange={(event) => update("purity", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>规格</span>
            <input className="field" value={active.packageSize} onChange={(event) => update("packageSize", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>库存</span>
            <input className="field" type="number" value={active.stock} onChange={(event) => update("stock", Number(event.target.value))} />
          </label>
          <label className="admin-field">
            <span>价格</span>
            <input className="field" type="number" value={active.price} onChange={(event) => update("price", Number(event.target.value))} />
          </label>
          <label className="admin-field">
            <span>货期</span>
            <input className="field" value={active.leadTime} onChange={(event) => update("leadTime", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>图片地址</span>
            <input className="field" value={active.image} onChange={(event) => update("image", event.target.value)} placeholder="/uploads/products/demo.jpg" />
          </label>
          <label className="admin-field full">
            <span>标签，用逗号分隔</span>
            <input className="field" value={active.tags.join(", ")} onChange={(event) => update("tags", event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean))} />
          </label>
        </div>
        {message && <div className="notice">{message}</div>}
      </div>
    </div>
  );
}
