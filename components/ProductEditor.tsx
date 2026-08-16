"use client";

import { useMemo, useRef, useState } from "react";
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
  brand: "",
  formula: "",
  molecularWeight: "",
  purity: "",
  stock: 0,
  packageSize: "",
  price: 0,
  leadTime: "",
  image: "",
  details: "",
  references: "",
  certificate: "",
  scaleNote: "",
  tags: []
};

const csvHeaderMap: Record<string, keyof Product> = {
  id: "id",
  sku: "sku",
  "catalog no": "catalogNo",
  catalog: "catalogNo",
  catalogno: "catalogNo",
  "catalog #": "catalogNo",
  "产品编号": "catalogNo",
  "货号": "catalogNo",
  cas: "cas",
  "cas号": "cas",
  "cas number": "cas",
  "中文名": "nameCn",
  "中文名称": "nameCn",
  namecn: "nameCn",
  "英文名": "nameEn",
  "英文名称": "nameEn",
  nameen: "nameEn",
  synonyms: "synonyms",
  "同义词": "synonyms",
  category: "category",
  "分类": "category",
  "产品分类": "category",
  brand: "brand",
  "品牌": "brand",
  formula: "formula",
  "分子式": "formula",
  molecularweight: "molecularWeight",
  "molecular weight": "molecularWeight",
  "分子量": "molecularWeight",
  purity: "purity",
  "纯度": "purity",
  stock: "stock",
  "库存": "stock",
  "现货": "stock",
  packagesize: "packageSize",
  "pack size": "packageSize",
  "package size": "packageSize",
  "包装": "packageSize",
  price: "price",
  "价格": "price",
  leadtime: "leadTime",
  "lead time": "leadTime",
  "货期": "leadTime",
  image: "image",
  "图片": "image",
  "图片地址": "image",
  details: "details",
  "基本信息": "details",
  references: "references",
  "参考文献": "references",
  certificate: "certificate",
  "质检证书": "certificate",
  scalenote: "scaleNote",
  "scale note": "scaleNote",
  "规模说明": "scaleNote",
  tags: "tags",
  "标签": "tags"
};

const gridColumns: Array<{ key: keyof Product; label: string }> = [
  { key: "id", label: "ID" },
  { key: "sku", label: "SKU" },
  { key: "catalogNo", label: "产品编号" },
  { key: "nameCn", label: "中文名" },
  { key: "nameEn", label: "英文名" },
  { key: "category", label: "产品分类" },
  { key: "cas", label: "CAS 号" },
  { key: "formula", label: "分子式" },
  { key: "molecularWeight", label: "分子量" },
  { key: "purity", label: "纯度" },
  { key: "packageSize", label: "包装" },
  { key: "leadTime", label: "货期" },
  { key: "price", label: "价格" },
  { key: "stock", label: "库存" },
  { key: "brand", label: "品牌" },
  { key: "synonyms", label: "同义词" },
  { key: "image", label: "图片" },
  { key: "tags", label: "标签" },
  { key: "details", label: "基本信息" },
  { key: "references", label: "参考文献" },
  { key: "certificate", label: "质检证书" },
  { key: "scaleNote", label: "规模说明" }
];

function createProduct(seed?: Partial<Product>): Product {
  const now = Date.now();
  const catalogNo = seed?.catalogNo || seed?.sku || `SKU-${now}`;
  return {
    ...emptyProduct,
    id: seed?.id || `p-${now}-${Math.random().toString(36).slice(2, 8)}`,
    ...seed,
    catalogNo,
    sku: seed?.sku || catalogNo,
    stock: Number(seed?.stock || 0),
    price: Number(seed?.price || 0),
    tags: Array.isArray(seed?.tags) ? seed.tags : typeof seed?.tags === "string" ? String(seed.tags).split(/[;，,]/).map((tag) => tag.trim()).filter(Boolean) : []
  };
}

function normalizeHeader(header: string) {
  return header.replace(/^\ufeff/, "").trim().replace(/[\s_-]+/g, " ").toLowerCase();
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  row.push(cell.trim());
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}

function productValue(product: Product, key: keyof Product) {
  const value = product[key];
  if (Array.isArray(value)) return value.join("，");
  return String(value ?? "");
}

function normalizeRows(rows: unknown[][]) {
  return rows
    .map((row) => row.map((value) => String(value ?? "").trim()))
    .filter((row) => row.some((value) => value.length > 0));
}

function transposeVerticalRows(rows: string[][]) {
  if (rows.length < 2) return rows;
  const firstColumn = rows.map((row) => normalizeHeader(row[0] || ""));
  const recognizedCount = firstColumn.filter((header) => csvHeaderMap[header]).length;
  const maxColumns = Math.max(...rows.map((row) => row.length));
  if (recognizedCount < 2 || maxColumns < 2) return rows;

  const headers = rows.map((row) => row[0] || "");
  const records: string[][] = [];
  for (let columnIndex = 1; columnIndex < maxColumns; columnIndex += 1) {
    records.push(rows.map((row) => row[columnIndex] || ""));
  }
  return [headers, ...records];
}

function draftHasProductData(draft: Partial<Product>) {
  return Boolean(
    draft.id ||
      draft.sku ||
      draft.catalogNo ||
      draft.cas ||
      draft.nameCn ||
      draft.nameEn ||
      draft.synonyms ||
      draft.category ||
      draft.brand ||
      draft.formula ||
      draft.molecularWeight ||
      draft.purity ||
      draft.packageSize ||
      draft.leadTime ||
      draft.image ||
      draft.details ||
      draft.references ||
      draft.certificate ||
      draft.scaleNote ||
      (Array.isArray(draft.tags) && draft.tags.length > 0) ||
      Number(draft.stock || 0) > 0 ||
      Number(draft.price || 0) > 0
  );
}

export function ProductEditor({ initialProducts }: { initialProducts: Product[] }) {
  const [products, setProducts] = useState(initialProducts.map((product) => createProduct(product)));
  const [activeId, setActiveId] = useState("");
  const [mode, setMode] = useState<"grid" | "detail">("grid");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const active = products.find((product) => product.id === activeId);
  const categories = useMemo(() => Array.from(new Set(products.map((product) => product.category.trim()).filter(Boolean))).sort(), [products]);
  const allSelected = products.length > 0 && selectedIds.length === products.length;

  const update = (key: keyof Product, value: string | number | string[]) => {
    if (!active) return;
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

  const openDetail = (id: string) => {
    setActiveId(id);
    setMode("detail");
    setMessage("");
  };

  const toggleSelected = (id: string, checked: boolean) => {
    setSelectedIds((current) => (checked ? Array.from(new Set([...current, id])) : current.filter((item) => item !== id)));
  };

  const toggleAllSelected = (checked: boolean) => {
    setSelectedIds(checked ? products.map((product) => product.id) : []);
  };

  const addCategory = () => {
    const category = newCategory.trim();
    if (!category || !active) return;
    update("category", category);
    setNewCategory("");
    setMessage(`已将当前产品分类设为：${category}。请保存全部产品。`);
  };

  const addProduct = () => {
    const product = createProduct({ nameCn: "新产品", nameEn: "New Product" });
    setProducts((current) => [...current, product]);
    setSelectedIds([]);
    setActiveId(product.id);
    setMode("detail");
    setMessage("已创建新产品，请填写信息后保存全部产品。");
  };

  const removeProduct = () => {
    if (!active) return;
    setProducts((current) => current.filter((product) => product.id !== active.id));
    setSelectedIds((current) => current.filter((id) => id !== active.id));
    setActiveId("");
    setMode("grid");
    setMessage("已删除当前产品，请保存全部产品。");
  };

  const removeSelectedProducts = () => {
    if (selectedIds.length === 0) {
      setMessage("请先选择要删除的产品。");
      return;
    }
    const selected = new Set(selectedIds);
    setProducts((current) => current.filter((product) => !selected.has(product.id)));
    setSelectedIds([]);
    setActiveId((current) => (selected.has(current) ? "" : current));
    setMode("grid");
    setMessage(`已删除 ${selected.size} 个选中产品，请保存全部产品。`);
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    products.forEach((product, index) => {
      const label = product.catalogNo || product.sku || product.nameCn || product.nameEn || `第 ${index + 1} 行`;
      if (!(product.catalogNo || product.sku).trim()) nextErrors.catalogNo = `${label}：产品编号不能为空`;
      if (!product.nameEn.trim() && !product.nameCn.trim()) nextErrors.nameEn = `${label}：产品名称不能为空`;
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

  const importSpreadsheet = async (file: File | undefined) => {
    if (!file) return;
    setMessage("");
    try {
      const isCsv = file.name.toLowerCase().endsWith(".csv");
      let rawRows: unknown[][];
      if (isCsv) {
        rawRows = parseCsv(await file.text());
      } else {
        const { read, utils } = await import("xlsx");
        const workbook = read(await file.arrayBuffer(), { type: "array" });
        rawRows = utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, blankrows: false, defval: "" }) as unknown[][];
      }
      const rows = transposeVerticalRows(normalizeRows(rawRows));
      const [headerRow, ...dataRows] = rows;
      if (!headerRow || dataRows.length === 0) {
        setMessage("表格文件没有可导入的数据");
        return;
      }
      const keys = headerRow.map((header) => csvHeaderMap[normalizeHeader(header)]);
      const imported = dataRows
        .map((row) => {
          const draft: Partial<Product> = {};
          row.forEach((value, index) => {
            const key = keys[index];
            if (!key || value === "") return;
            if (key === "price" || key === "stock") {
              draft[key] = Number(value) as never;
            } else if (key === "tags") {
              draft.tags = value.split(/[;，,]/).map((tag) => tag.trim()).filter(Boolean);
            } else {
              draft[key] = value as never;
            }
          });
          return draft;
        })
        .filter(draftHasProductData)
        .map((draft) => createProduct(draft));

      if (imported.length === 0) {
        setMessage("没有识别到可导入的产品。请确认表头包含产品编号、中文名、英文名、CAS 等字段。");
        return;
      }

      setProducts((current) => [...current, ...imported]);
      setSelectedIds([]);
      setMode("grid");
      setActiveId("");
      setMessage(`已从表格导入 ${imported.length} 个产品，请检查后保存全部产品。`);
    } catch {
      setMessage("表格解析失败，请上传 .xlsx、.xls 或 .csv 文件。");
    } finally {
      if (csvInputRef.current) csvInputRef.current.value = "";
    }
  };

  if (mode === "detail" && active) {
    return (
      <div className="panel admin-panel product-detail-editor">
        <div className="toolbar">
          <div>
            <h1>产品详情</h1>
            <p className="admin-subtitle">{active.catalogNo || active.sku || "新产品"}</p>
          </div>
          <div className="admin-actions">
            <button className="btn" type="button" onClick={() => setMode("grid")}>
              返回产品列表
            </button>
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
          </label>

          <label className="admin-field full">
            <span>产品图片</span>
            <input className="field" value={active.image} onChange={(event) => update("image", event.target.value)} placeholder="上传后自动生成图片地址" />
            <input className="field" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => uploadImage(event.target.files?.[0])} />
            {uploading && <span className="result-count">图片上传中...</span>}
            {active.image && <img className="admin-preview" src={active.image} alt="产品图片预览" />}
          </label>

          <label className="admin-field">
            <span>中文名</span>
            <input className="field" value={active.nameCn} onChange={(event) => update("nameCn", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>英文名 *</span>
            <input className="field" value={active.nameEn} onChange={(event) => update("nameEn", event.target.value)} />
            {errors.nameEn && <span className="field-error">{errors.nameEn}</span>}
          </label>
          <label className="admin-field">
            <span>产品编号 *</span>
            <input className="field" value={active.catalogNo || active.sku} onChange={(event) => update("catalogNo", event.target.value)} />
            {errors.catalogNo && <span className="field-error">{errors.catalogNo}</span>}
          </label>
          <label className="admin-field">
            <span>记录 ID</span>
            <input className="field" value={active.id} readOnly />
          </label>
          <label className="admin-field">
            <span>品牌</span>
            <input className="field" value={active.brand} onChange={(event) => update("brand", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>CAS 号</span>
            <input className="field" value={active.cas} onChange={(event) => update("cas", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>分子式</span>
            <input className="field" value={active.formula} onChange={(event) => update("formula", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>分子量</span>
            <input className="field" value={active.molecularWeight} onChange={(event) => update("molecularWeight", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>纯度</span>
            <input className="field" value={active.purity} onChange={(event) => update("purity", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>包装</span>
            <input className="field" value={active.packageSize} onChange={(event) => update("packageSize", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>货期</span>
            <input className="field" value={active.leadTime} onChange={(event) => update("leadTime", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>价格</span>
            <input className="field" type="number" min={0} value={active.price} onChange={(event) => update("price", Number(event.target.value))} />
          </label>
          <label className="admin-field">
            <span>库存</span>
            <input className="field" type="number" min={0} value={active.stock} onChange={(event) => update("stock", Number(event.target.value))} />
          </label>
          <label className="admin-field full">
            <span>同义词</span>
            <input className="field" value={active.synonyms} onChange={(event) => update("synonyms", event.target.value)} />
          </label>
          <label className="admin-field full">
            <span>标签</span>
            <input className="field" value={active.tags.join("，")} onChange={(event) => update("tags", event.target.value.split(/[;，,]/).map((tag) => tag.trim()).filter(Boolean))} placeholder="多个标签用逗号分隔" />
          </label>
          <label className="admin-field full">
            <span>基本信息</span>
            <textarea className="field" value={active.details} onChange={(event) => update("details", event.target.value)} />
          </label>
          <label className="admin-field full">
            <span>参考文献</span>
            <textarea className="field" value={active.references} onChange={(event) => update("references", event.target.value)} />
          </label>
          <label className="admin-field full">
            <span>质检证书</span>
            <textarea className="field" value={active.certificate} onChange={(event) => update("certificate", event.target.value)} />
          </label>
          <label className="admin-field full">
            <span>规模说明</span>
            <textarea className="field" value={active.scaleNote} onChange={(event) => update("scaleNote", event.target.value)} />
          </label>
        </div>
        {message && <div className="notice">{message}</div>}
      </div>
    );
  }

  return (
    <div className="panel admin-panel product-grid-panel">
      <div className="toolbar">
        <div>
          <h1>产品管理</h1>
          <p className="admin-subtitle">以表格方式查看全部产品，点击详情进入单个产品表单。</p>
        </div>
        <div className="admin-actions">
          <button className="btn primary" type="button" onClick={addProduct}>
            添加产品
          </button>
          <button className="btn" type="button" onClick={() => csvInputRef.current?.click()}>
            批量上传
          </button>
          <button className="btn danger" type="button" onClick={removeSelectedProducts} disabled={selectedIds.length === 0}>
            删除选中{selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
          </button>
          <button className="btn" type="button" onClick={save}>
            保存全部
          </button>
          <input ref={csvInputRef} className="sr-only" type="file" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv" onChange={(event) => importSpreadsheet(event.target.files?.[0])} />
        </div>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <b>还没有产品</b>
          <span>点击“添加产品”创建单个产品，或点击“批量上传”导入 Excel 表格。</span>
        </div>
      ) : (
        <div className="product-admin-grid-wrap">
          <table className="product-admin-grid">
            <thead>
              <tr>
                <th className="select-column">
                  <input aria-label="选择全部产品" type="checkbox" checked={allSelected} onChange={(event) => toggleAllSelected(event.target.checked)} />
                </th>
                <th>操作</th>
                {gridColumns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td className="select-column">
                    <input aria-label={`选择 ${product.nameCn || product.nameEn || product.catalogNo || product.id}`} type="checkbox" checked={selectedIds.includes(product.id)} onChange={(event) => toggleSelected(product.id, event.target.checked)} />
                  </td>
                  <td>
                    <button className="btn small" type="button" onClick={() => openDetail(product.id)}>
                      详情
                    </button>
                  </td>
                  {gridColumns.map((column) => (
                    <td key={column.key} title={productValue(product, column.key)}>
                      {productValue(product, column.key) || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {message && <div className="notice">{message}</div>}
    </div>
  );
}
