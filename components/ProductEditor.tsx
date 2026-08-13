"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";

const emptyProduct: Product = {
  id: "",
  sku: "",
  catalogNo: "",
  cas: "",
  nameCn: "",
  nameEn: "",
  synonyms: "",
  category: "",
  formula: "",
  molecularWeight: "",
  purity: "",
  stock: 0,
  packageSize: "",
  price: 0,
  leadTime: "",
  image: "",
  details: "",
  scaleNote: "",
  tags: []
};

export function ProductEditor({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [activeId, setActiveId] = useState(initialProducts[0]?.id || "");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const active = products.find((product) => product.id === activeId) || products[0];
  const categories = useMemo(() => Array.from(new Set(products.map((product) => product.category.trim()).filter(Boolean))).sort(), [products]);

  const update = (key: keyof Product, value: string | number | string[]) => {
    setProducts((current) =>
      current.map((product) => {
        if (product.id !== active.id) return product;
        const next = { ...product, [key]: value };
        if (key === "catalogNo" && typeof value === "string") {
          next.sku = value;
        }
        return next;
      })
    );
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const addCategory = () => {
    const category = newCategory.trim();
    if (!category || !active) return;
    update("category", category);
    setNewCategory("");
    setMessage(`已将当前产品分类设为：${category}。请保存全部产品。`);
  };

  const addProduct = () => {
    const now = Date.now();
    const catalogNo = `SKU-${now}`;
    const product = { ...emptyProduct, id: `p-${now}`, nameCn: "新产品", nameEn: "New Product", sku: catalogNo, catalogNo };
    setProducts((current) => [...current, product]);
    setActiveId(product.id);
  };

  const removeProduct = () => {
    const next = products.filter((product) => product.id !== active.id);
    setProducts(next);
    setActiveId(next[0]?.id || "");
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    products.forEach((product) => {
      if (!(product.catalogNo || product.sku).trim()) nextErrors.catalogNo = "Catalog # 不能为空";
      if (!product.nameEn.trim() && !product.nameCn.trim()) nextErrors.nameEn = "Product Name 不能为空";
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const save = async () => {
    setMessage("");
    if (!validate()) {
      setMessage("请先修正表单错误");
      return;
    }

    const response = await fetch("/api/admin/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products })
    });
    setMessage(response.ok ? "已保存产品数据" : "保存失败，请重新登录后台或检查 Supabase 配置");
  };

  const uploadImage = async (file: File | undefined) => {
    if (!file || !active) return;
    setUploading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "products");
    const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const payload = (await response.json()) as { url?: string; message?: string };
    setUploading(false);
    if (!response.ok || !payload.url) {
      setMessage(payload.message || "图片上传失败");
      return;
    }
    update("image", payload.url);
    setMessage("图片已上传，请保存全部产品");
  };

  if (!active) {
    return (
      <div className="panel admin-panel">
        <button className="btn primary" type="button" onClick={addProduct}>
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
          <button className="btn primary" type="button" onClick={addProduct}>
            新增
          </button>
        </div>
        {products.map((product) => (
          <button
            className={`admin-list-item ${product.id === active.id ? "active" : ""}`}
            key={product.id}
            type="button"
            onClick={() => setActiveId(product.id)}
          >
            <b>{product.nameEn || product.nameCn || "未命名产品"}</b>
            <span>{product.catalogNo || product.sku || "未填写 Catalog #"}</span>
            {product.category && <span>{product.category}</span>}
          </button>
        ))}
      </div>
      <div className="panel admin-panel">
        <div className="toolbar">
          <h1>编辑产品展示字段</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" type="button" onClick={removeProduct}>
              删除
            </button>
            <button className="btn primary" type="button" onClick={save}>
              保存全部
            </button>
          </div>
        </div>

        <div className="admin-form-grid">
          <label className="admin-field full">
            <span>产品分类</span>
            <input className="field" list="product-categories" value={active.category} onChange={(event) => update("category", event.target.value)} placeholder="选择或输入产品分类" />
            <datalist id="product-categories">
              {categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
            <div className="inline-controls">
              <input className="field" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="新增类别名称" />
              <button className="btn" type="button" onClick={addCategory}>
                添加并应用
              </button>
            </div>
            {categories.length > 0 && (
              <div className="category-pills">
                {categories.map((category) => (
                  <button type="button" key={category} onClick={() => update("category", category)}>
                    {category}
                  </button>
                ))}
              </div>
            )}
          </label>

          <label className="admin-field full">
            <span>产品图片</span>
            <input className="field" value={active.image} onChange={(event) => update("image", event.target.value)} placeholder="上传后自动生成图片地址" />
            <input className="field" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => uploadImage(event.target.files?.[0])} />
            {uploading && <span className="result-count">图片上传中...</span>}
            {active.image && <img className="admin-preview" src={active.image} alt="产品图片预览" />}
          </label>

          <label className="admin-field">
            <span>Product Name *</span>
            <input className="field" value={active.nameEn} onChange={(event) => update("nameEn", event.target.value)} />
            {errors.nameEn && <span className="field-error">{errors.nameEn}</span>}
          </label>
          <label className="admin-field">
            <span>CAS Number</span>
            <input className="field" value={active.cas} onChange={(event) => update("cas", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Synonyms</span>
            <input className="field" value={active.synonyms} onChange={(event) => update("synonyms", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Chemical Formula</span>
            <input className="field" value={active.formula} onChange={(event) => update("formula", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Pack Size</span>
            <input className="field" value={active.packageSize} onChange={(event) => update("packageSize", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>Catalog # *</span>
            <input className="field" value={active.catalogNo || active.sku} onChange={(event) => update("catalogNo", event.target.value)} />
            {errors.catalogNo && <span className="field-error">{errors.catalogNo}</span>}
          </label>
          <label className="admin-field">
            <span>MW</span>
            <input className="field" value={active.molecularWeight} onChange={(event) => update("molecularWeight", event.target.value)} />
          </label>
          <label className="admin-field full">
            <span>Details</span>
            <textarea className="field" value={active.details} onChange={(event) => update("details", event.target.value)} />
          </label>
          <label className="admin-field full">
            <span>规模供货说明</span>
            <input className="field" value={active.scaleNote} onChange={(event) => update("scaleNote", event.target.value)} />
          </label>
        </div>
        {message && <div className="notice">{message}</div>}
      </div>
    </div>
  );
}
