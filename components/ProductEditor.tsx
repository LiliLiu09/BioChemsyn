"use client";

import { useMemo, useRef, useState } from "react";
import type { Product } from "@/lib/types";
import { localizeProduct } from "@/lib/content-locale";
import type { Locale } from "@/lib/i18n";

const emptyProduct: Product = {
  id: "",
  status: "draft",
  deletedAt: "",
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
  status: "status",
  "状态": "status",
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
  { key: "status", label: "状态" },
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
  { key: "scaleNote", label: "规模说明" },
  { key: "deletedAt", label: "删除时间" }
];

type ProductView = "all" | "deleted" | "draft" | "published";

function nextProductId(products: Array<Pick<Product, "id">>) {
  const maxId = products.reduce((max, product) => {
    const match = product.id.match(/^p-(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `p-${maxId + 1}`;
}

function createProduct(seed?: Partial<Product>, fallbackId = "p-1"): Product {
  const catalogNo = seed?.catalogNo || seed?.sku || `SKU-${fallbackId.replace(/^p-/, "")}`;
  return {
    ...emptyProduct,
    id: seed?.id || fallbackId,
    ...seed,
    status: seed?.status === "draft" ? "draft" : seed?.status === "published" ? "published" : "published",
    deletedAt: seed?.deletedAt || "",
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

function productValue(product: Product, key: keyof Product, locale: Locale) {
  if (key === "status") return product.deletedAt ? "已删除" : product.status === "draft" ? "草稿" : "已发布";
  if (key === "deletedAt") return product.deletedAt ? new Date(product.deletedAt).toLocaleString(locale === "en" ? "en-US" : "zh-CN") : "";
  const value = product[key];
  if (Array.isArray(value)) return value.join(locale === "en" ? ", " : "，");
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

import { useAdminLanguage, contentErrorMessage } from "@/components/admin-language";
import { useLanguage } from "@/components/LanguageProvider";
import { ContentLanguageTabs, isEnglishReady, TranslationEditor, type ContentLanguage } from "@/components/TranslationEditor";
import { productTranslationFields } from "@/components/admin-content-fields";
export function ProductEditor({ initialProducts }: { initialProducts: Product[] }) {
  const { locale, t } = useAdminLanguage();
  const { t: translate } = useLanguage();
  const [contentLanguage, setContentLanguage] = useState<ContentLanguage>(locale);
  const [products, setProducts] = useState(initialProducts.map((product) => createProduct(product)));
  const [activeId, setActiveId] = useState("");
  const [mode, setMode] = useState<"grid" | "detail">("grid");
  const [view, setView] = useState<ProductView>("all");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const active = products.find((product) => product.id === activeId);
  const english = { nameEn: active?.nameEn || "", published: active?.translations?.en ? active.translations.en.published === true : isEnglishReady({ nameEn: active?.nameEn }, ["nameEn"]), ...active?.translations?.en };
  const englishReady = isEnglishReady(english, ["nameEn"]);
  const updateEnglish = (key: string, value: string | string[] | boolean) => {
    if (!active) return;
    setProducts((current) => current.map((item) => {
      if (item.id !== active.id) return item;
      const en = { nameEn: item.nameEn, published: false, ...item.translations?.en, [key]: value };
      if (!isEnglishReady(en, ["nameEn"])) en.published = false;
      return { ...item, translations: { ...item.translations, en } };
    }));
  };
  const categories = useMemo(() => Array.from(new Set(products.map((product) => product.category.trim()).filter(Boolean))).sort(), [products]);
  const visibleProducts = useMemo(() => {
    return products.filter((product) => {
      if (view === "deleted") return Boolean(product.deletedAt);
      if (product.deletedAt) return false;
      if (view === "draft") return product.status === "draft";
      if (view === "published") return product.status === "published";
      return true;
    });
  }, [products, view]);
  const counts = useMemo(() => {
    const activeProducts = products.filter((product) => !product.deletedAt);
    return {
      all: activeProducts.length,
      deleted: products.filter((product) => product.deletedAt).length,
      draft: activeProducts.filter((product) => product.status === "draft").length,
      published: activeProducts.filter((product) => product.status === "published").length
    };
  }, [products]);
  const allSelected = visibleProducts.length > 0 && visibleProducts.every((product) => selectedIds.includes(product.id));
  const columns = gridColumns.filter((column) => locale === "zh" || column.key !== "nameCn");
  // Admins may preview their English drafts; public pages still enforce publication.
  const gridProducts = visibleProducts.map((product) => locale === "en" ? localizeProduct({
    ...product,
    translations: product.translations?.en ? { en: { ...product.translations.en, published: true } } : undefined
  }, "en") : product);

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
    const visibleIds = visibleProducts.map((product) => product.id);
    setSelectedIds((current) => (checked ? Array.from(new Set([...current, ...visibleIds])) : current.filter((id) => !visibleIds.includes(id))));
  };

  const addCategory = () => {
    const category = newCategory.trim();
    if (!category || !active) return;
    update("category", category);
    setNewCategory("");
    setMessage(translate(`已将当前产品分类设为：${category}。点击保存至草稿或发布产品后生效。`, `Category set to ${category}. Save as a draft or publish to apply.`));
  };

  const addProduct = () => {
    const product = createProduct({ nameCn: "新产品", nameEn: "New Product", status: "draft" }, nextProductId(products));
    setProducts((current) => [...current, product]);
    setSelectedIds([]);
    setActiveId(product.id);
    setMode("detail");
    setMessage(t("已创建草稿产品，请填写信息后保存至草稿或发布产品。"));
  };

  const removeProduct = async () => {
    if (!active) return;
    const deletedAt = new Date().toISOString();
    const nextProducts = products.map((product) => (product.id === active.id ? { ...product, deletedAt } : product));
    setProducts(nextProducts);
    setSelectedIds((current) => current.filter((id) => id !== active.id));
    setActiveId("");
    setMode("grid");
    setView("deleted");
    await saveProductsToServer(nextProducts, t("当前产品已移入已删除"));
  };

  const removeSelectedProducts = async () => {
    if (selectedIds.length === 0) {
      setMessage(t("请先选择要删除的产品。"));
      return;
    }
    const selected = new Set(selectedIds);
    const deletedAt = new Date().toISOString();
    const nextProducts = products.map((product) => (selected.has(product.id) ? { ...product, deletedAt } : product));
    setProducts(nextProducts);
    setSelectedIds([]);
    setActiveId((current) => (selected.has(current) ? "" : current));
    setMode("grid");
    setView("deleted");
    await saveProductsToServer(nextProducts, translate(`已将 ${selected.size} 个选中产品移入已删除`, `${selected.size} products moved to deleted`));
  };

  const restoreProduct = async () => {
    if (!active) return;
    const nextProducts = products.map((product) => (product.id === active.id ? { ...product, deletedAt: "", status: "draft" as const } : product));
    setProducts(nextProducts);
    await saveProductsToServer(nextProducts, t("已恢复为草稿"));
  };

  const validatePublish = (product: Product) => {
    const nextErrors: Record<string, string> = {};
    const label = product.catalogNo || product.sku || product.nameCn || product.nameEn || product.id;
    if (!(product.catalogNo || product.sku).trim()) nextErrors.catalogNo = translate(`${label}：产品编号不能为空`, `${label}: Catalog number is required`);
    if (!product.nameEn.trim() && !product.nameCn.trim()) nextErrors.nameEn = translate(`${label}：产品名称不能为空`, `${label}: Product name is required`);
    if (!product.image.trim()) nextErrors.image = translate(`${label}：发布产品需要产品图片`, `${label}: A product image is required to publish`);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveProductsToServer = async (nextProducts = products, successMessage = t("已保存产品数据")) => {
    setMessage("");
    const response = await fetch("/api/admin/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ products: nextProducts })
    });
    setMessage(response.ok ? successMessage : await contentErrorMessage(response, t("保存失败，请重新登录后台或检查 Supabase 配置")));
    return response.ok;
  };

  const saveActiveAsDraft = async () => {
    if (!active) return;
    const nextProducts = products.map((product) => (product.id === active.id ? { ...product, status: "draft" as const, deletedAt: "" } : product));
    setProducts(nextProducts);
    await saveProductsToServer(nextProducts, t("已保存至草稿"));
  };

  const publishActive = async () => {
    if (!active) return;
    const nextProduct = { ...active, status: "published" as const, deletedAt: "" };
    if (!validatePublish(nextProduct)) {
      setContentLanguage("zh");
      setMessage(t("请先修正表单错误"));
      return;
    }
    const nextProducts = products.map((product) => (product.id === active.id ? nextProduct : product));
    setProducts(nextProducts);
    await saveProductsToServer(nextProducts, t("产品已发布"));
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
      setMessage(locale === "en" ? t("图片上传失败") : payload.message || t("图片上传失败"));
      return;
    }
    update("image", payload.url);
    setMessage(t("图片已上传。点击保存至草稿或发布产品后生效。"));
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
        setMessage(t("表格文件没有可导入的数据"));
        return;
      }
      const keys = headerRow.map((header) => csvHeaderMap[normalizeHeader(header)]);
      let nextImportedNumber = Number(nextProductId(products).replace(/^p-/, ""));
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
        .map((draft) => {
          const product = createProduct({ ...draft, status: draft.image ? "published" : "draft" }, `p-${nextImportedNumber}`);
          if (!draft.id) nextImportedNumber += 1;
          return product;
        });

      if (imported.length === 0) {
        setMessage(t("没有识别到可导入的产品。请确认表头包含产品编号、中文名、英文名、CAS 等字段。"));
        return;
      }

      const nextProducts = [...products, ...imported];
      setProducts(nextProducts);
      setSelectedIds([]);
      setMode("grid");
      setActiveId("");
      setView("draft");
      await saveProductsToServer(nextProducts, translate(`已从表格导入 ${imported.length} 个产品；没有图片的产品已进入草稿。`, `Imported ${imported.length} products. Products without images were saved as drafts.`));
    } catch {
      setMessage(t("表格解析失败，请上传 .xlsx、.xls 或 .csv 文件。"));
    } finally {
      if (csvInputRef.current) csvInputRef.current.value = "";
    }
  };

  if (mode === "detail" && active) {
    return (
      <div className="panel admin-panel product-detail-editor">
        <div className="toolbar">
          <div>
            <h1>{t("产品详情")}</h1>
            <p className="admin-subtitle">
              {active.catalogNo || active.sku || t("新产品")} · <span className={`status-pill ${active.deletedAt ? "deleted" : active.status}`}>{t(productValue(active, "status", locale))}</span>
            </p>
          </div>
          <div className="admin-actions">
            <button className="btn" type="button" onClick={() => setMode("grid")}>{t("返回产品列表")}</button>
            {active.deletedAt ? (
              <button className="btn" type="button" onClick={restoreProduct}>{t("恢复为草稿")}</button>
            ) : (
              <>
                <button className="btn" type="button" onClick={removeProduct}>{t("删除")}</button>
                <button className="btn" type="button" onClick={saveActiveAsDraft}>{t("保存至草稿")}</button>
                <button className="btn primary" type="button" onClick={publishActive}>{t("发布产品")}</button>
              </>
            )}
          </div>
        </div>

        <ContentLanguageTabs value={contentLanguage} onChange={setContentLanguage} ready={englishReady} />
        {contentLanguage === "en" ? <>
          <TranslationEditor values={english} fields={productTranslationFields} onChange={updateEnglish} uploadFolder="products" ready={englishReady} />
          <p className="result-count">{translate("英文版本仅在产品已发布且未删除时公开；货号、CAS、分子式、价格和库存与中文共用。", "The English version is public only when the product is published and not deleted. Catalog number, CAS, formula, price, and stock are shared.")}</p>
          <button className="btn primary" type="button" onClick={() => saveProductsToServer()}>{translate("保存中英文内容", "Save Chinese and English content")}</button>
        </> : <div className="admin-form-grid">
          <label className="admin-field full">
            <span>{t("产品分类")}</span>
            <input className="field" list="product-categories" value={active.category} onChange={(event) => update("category", event.target.value)} placeholder={t("选择或输入产品分类")} />
            <datalist id="product-categories">
              {categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
            <div className="inline-controls">
              <input className="field" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder={t("新增类别名称")} />
              <button className="btn" type="button" onClick={addCategory}>{t("添加并应用")}</button>
            </div>
          </label>

          <label className="admin-field full">
            <span>{t("产品图片")}</span>
            <input className="field" value={active.image} onChange={(event) => update("image", event.target.value)} placeholder={t("上传后自动生成图片地址")} />
            <input className="field" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => uploadImage(event.target.files?.[0])} />
            {errors.image && <span className="field-error">{errors.image}</span>}
            {uploading && <span className="result-count">{t("图片上传中...")}</span>}
            {active.image && <img className="admin-preview" src={active.image} alt={t("产品图片预览")} />}
          </label>

          <label className="admin-field">
            <span>{t("中文名")}</span>
            <input className="field" value={active.nameCn} onChange={(event) => update("nameCn", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>{t("英文名 *")}</span>
            <input className="field" value={active.nameEn} onChange={(event) => update("nameEn", event.target.value)} />
            {errors.nameEn && <span className="field-error">{errors.nameEn}</span>}
          </label>
          <label className="admin-field">
            <span>{t("产品编号 *")}</span>
            <input className="field" value={active.catalogNo || active.sku} onChange={(event) => update("catalogNo", event.target.value)} />
            {errors.catalogNo && <span className="field-error">{errors.catalogNo}</span>}
          </label>
          <label className="admin-field">
            <span>{t("记录 ID")}</span>
            <input className="field" value={active.id} readOnly />
          </label>
          <label className="admin-field">
            <span>{t("品牌")}</span>
            <input className="field" value={active.brand} onChange={(event) => update("brand", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>{t("CAS 号")}</span>
            <input className="field" value={active.cas} onChange={(event) => update("cas", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>{t("分子式")}</span>
            <input className="field" value={active.formula} onChange={(event) => update("formula", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>{t("分子量")}</span>
            <input className="field" value={active.molecularWeight} onChange={(event) => update("molecularWeight", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>{t("纯度")}</span>
            <input className="field" value={active.purity} onChange={(event) => update("purity", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>{t("包装")}</span>
            <input className="field" value={active.packageSize} onChange={(event) => update("packageSize", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>{t("货期")}</span>
            <input className="field" value={active.leadTime} onChange={(event) => update("leadTime", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>{t("价格")}</span>
            <input className="field" type="number" min={0} value={active.price} onChange={(event) => update("price", Number(event.target.value))} />
          </label>
          <label className="admin-field">
            <span>{t("库存")}</span>
            <input className="field" type="number" min={0} value={active.stock} onChange={(event) => update("stock", Number(event.target.value))} />
          </label>
          <label className="admin-field full">
            <span>{t("同义词")}</span>
            <input className="field" value={active.synonyms} onChange={(event) => update("synonyms", event.target.value)} />
          </label>
          <label className="admin-field full">
            <span>{t("标签")}</span>
            <input className="field" value={active.tags.join("，")} onChange={(event) => update("tags", event.target.value.split(/[;，,]/).map((tag) => tag.trim()).filter(Boolean))} placeholder={t("多个标签用逗号分隔")} />
          </label>
          <label className="admin-field full">
            <span>{t("基本信息")}</span>
            <textarea className="field" value={active.details} onChange={(event) => update("details", event.target.value)} />
          </label>
          <label className="admin-field full">
            <span>{t("参考文献")}</span>
            <textarea className="field" value={active.references} onChange={(event) => update("references", event.target.value)} />
          </label>
          <label className="admin-field full">
            <span>{t("质检证书")}</span>
            <textarea className="field" value={active.certificate} onChange={(event) => update("certificate", event.target.value)} />
          </label>
          <label className="admin-field full">
            <span>{t("规模说明")}</span>
            <textarea className="field" value={active.scaleNote} onChange={(event) => update("scaleNote", event.target.value)} />
          </label>
        </div>
        }
        {message && <div className="notice">{message}</div>}
      </div>
    );
  }

  return (
    <div className="panel admin-panel product-grid-panel">
      <div className="toolbar">
        <div>
          <h1>{t("产品管理")}</h1>
          <p className="admin-subtitle">{t("以表格方式查看全部产品，点击详情进入单个产品表单。")}</p>
        </div>
        <div className="admin-actions">
          <button className="btn primary" type="button" onClick={addProduct}>{t("添加产品")}</button>
          <button className="btn" type="button" onClick={() => csvInputRef.current?.click()}>{t("批量上传")}</button>
          <button className="btn danger" type="button" onClick={removeSelectedProducts} disabled={selectedIds.length === 0}>
            {t("删除选中")}{selectedIds.length > 0 ? ` (${selectedIds.length})` : ""}
          </button>
          <button className="btn" type="button" onClick={() => saveProductsToServer()}>{t("保存全部")}</button>
          <input ref={csvInputRef} className="sr-only" type="file" accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv" onChange={(event) => importSpreadsheet(event.target.files?.[0])} />
        </div>
      </div>

      <div className="product-status-tabs" role="tablist" aria-label={t("产品状态筛选")}>
        <button className={view === "all" ? "active" : ""} type="button" onClick={() => { setView("all"); setSelectedIds([]); }}>
          {translate("所有产品", "All products")}（{counts.all}）
        </button>
        <button className={view === "deleted" ? "active" : ""} type="button" onClick={() => { setView("deleted"); setSelectedIds([]); }}>
          {t("已删除")}（{counts.deleted}）
        </button>
        <button className={view === "draft" ? "active" : ""} type="button" onClick={() => { setView("draft"); setSelectedIds([]); }}>
          {t("草稿")}（{counts.draft}）
        </button>
        <button className={view === "published" ? "active" : ""} type="button" onClick={() => { setView("published"); setSelectedIds([]); }}>
          {translate("所有已发布", "All published")}（{counts.published}）
        </button>
      </div>

      {products.length === 0 ? (
        <div className="empty-state">
          <b>{t("还没有产品")}</b>
          <span>{t("点击“添加产品”创建单个产品，或点击“批量上传”导入 Excel 表格。")}</span>
        </div>
      ) : visibleProducts.length === 0 ? (
        <div className="empty-state">
          <b>{t("当前分类没有产品")}</b>
          <span>{t("可以切换上方状态，或添加/批量上传新的产品。")}</span>
        </div>
      ) : (
        <div className="product-admin-grid-wrap">
          <table className="product-admin-grid">
            <thead>
              <tr>
                <th className="select-column">
                  <input aria-label={t("选择全部产品")} type="checkbox" checked={allSelected} onChange={(event) => toggleAllSelected(event.target.checked)} />
                </th>
                <th>{t("操作")}</th>
                {columns.map((column) => (
                  <th key={column.key}>{t(column.label)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gridProducts.map((product) => (
                <tr className={product.deletedAt ? "is-deleted" : product.status === "draft" ? "is-draft" : ""} key={product.id}>
                  <td className="select-column">
                    <input aria-label={translate(`选择 ${product.nameCn || product.nameEn || product.catalogNo || product.id}`, `Select ${product.nameEn || product.catalogNo || product.id}`)} type="checkbox" checked={selectedIds.includes(product.id)} onChange={(event) => toggleSelected(product.id, event.target.checked)} />
                  </td>
                  <td>
                    <button className="btn small" type="button" onClick={() => openDetail(product.id)}>{t("详情")}</button>
                  </td>
                  {columns.map((column) => (
                    <td key={column.key} title={t(productValue(product, column.key, locale))}>
                      {t(productValue(product, column.key, locale)) || "—"}
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
