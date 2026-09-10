"use client";

import Link from "@/components/LocaleLink";
import { useLanguage } from "./LanguageProvider";
import { useEffect, useMemo, useState } from "react";
import { cartStorageKey } from "@/lib/session";
import type { Product, QuoteCustomer } from "@/lib/types";

type CartLine = {
  id: string;
  qty: number;
};

const emptyCustomer: QuoteCustomer = {
  name: "",
  company: "",
  phone: "",
  email: "",
  region: "",
  remark: ""
};

export function CartClient({ products }: { products: Product[] }) {
  const { locale, t } = useLanguage();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [customer, setCustomer] = useState(emptyCustomer);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    try {
      setLines(JSON.parse(localStorage.getItem(cartStorageKey) || "[]") as CartLine[]);
      const draft = sessionStorage.getItem("kasons-inquiry-contact");
      if (draft) setCustomer({ ...emptyCustomer, ...JSON.parse(draft) });
    } catch { /* A corrupt or unavailable browser store must not prevent an inquiry. */ }
  }, []);

  const items = useMemo(
    () =>
      lines
        .map((line) => ({
          line,
          product: products.find((product) => product.id === line.id)
        }))
        .filter((item): item is { line: CartLine; product: (typeof products)[number] } => Boolean(item.product)),
    [lines, products]
  );

  const persistLines = (next: CartLine[]) => {
    setLines(next);
    localStorage.setItem(cartStorageKey, JSON.stringify(next));
    window.dispatchEvent(new Event("cart-updated"));
  };

  const updateQty = (id: string, qty: number) => {
    persistLines(lines.map((line) => (line.id === id ? { ...line, qty: Math.max(1, qty) } : line)));
  };

  const remove = (id: string) => {
    persistLines(lines.filter((line) => line.id !== id));
  };

  const updateCustomer = (key: keyof QuoteCustomer, value: string) => {
    const next = { ...customer, [key]: value };
    setCustomer(next);
    try { sessionStorage.setItem("kasons-inquiry-contact", JSON.stringify(next)); } catch { /* Storage is optional. */ }
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const submitQuote = async () => {
    setSubmitting(true);
    setErrors({});
    setMessage("");

    try {
    const response = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer,
        locale,
        lines: items.map(({ product, line }) => ({ id: product.id, qty: line.qty }))
      })
    });

    const payload = (await response.json()) as { quote?: { id: string }; errors?: Record<string, string> };

    if (!response.ok) {
      setErrors(payload.errors || { form: t("提交失败，请检查表单后重试", "Unable to submit. Check the form and try again.") });
      return;
    }

    persistLines([]);
    setCustomer(emptyCustomer);
    try { sessionStorage.removeItem("kasons-inquiry-contact"); } catch { /* Storage is optional. */ }
    setMessage(t(`询价已提交，单号：${payload.quote?.id || "已生成"}。销售团队会尽快联系您。`, `Inquiry submitted. Reference: ${payload.quote?.id || "created"}. Our sales team will contact you shortly.`));
    } catch {
      setErrors({ form: t("网络连接失败，请稍后重试。", "Connection failed. Please try again shortly.") });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="quote-layout">
      <div className="panel quote-panel">
        <div className="toolbar">
          <h2>{t("询价车", "Inquiry cart")}</h2>
          <Link className="btn" href="/products">
            {t("继续选购", "Continue browsing")}
          </Link>
        </div>

        {message && <div className="success">{message}</div>}
        {errors.lines && <div className="notice">{errors.lines}</div>}
        {items.length === 0 ? (
          <div className="notice">{t("询价车还是空的。请先前往产品中心添加需要咨询的产品。", "Your inquiry cart is empty. Browse the catalog and add products to request a quote.")}</div>
        ) : (
          <>
            <div className="notice" style={{ marginBottom: 14 }}>
              {t("提交后，销售团队会根据数量、库存和客户信息，通过邮件或电话回复正式报价。", "After submission, our sales team will confirm quantities and availability, then send a quotation by email or phone.")}
            </div>
            <table className="cart-table">
              <thead>
                <tr>
                  <th>{t("产品", "Product")}</th>
                  <th>{t("CAS / 货号", "CAS / Catalog No.")}</th>
                  <th>{t("规格", "Pack size")}</th>
                  <th>{t("数量", "Quantity")}</th>
                  <th>{t("报价状态", "Quote status")}</th>
                  <th>{t("操作", "Actions")}</th>
                </tr>
              </thead>
              <tbody>
                {items.map(({ product, line }) => (
                  <tr key={product.id}>
                    <td>
                      <b>{product.nameCn || product.nameEn || t("未命名产品", "Product")}</b>
                      <br />
                      {locale === "zh" && <span style={{ color: "#667382" }}>{product.nameEn || "英文名称待补充"}</span>}
                    </td>
                    <td>
                      {product.cas || t("待确认", "On request")}
                      <br />
                      {product.sku}
                    </td>
                    <td>{product.packageSize || t("待确认", "On request")}</td>
                    <td>
                      <input
                        aria-label={`${product.nameCn || product.sku} ${t("数量", "quantity")}`}
                        className="field"
                        style={{ width: 74 }}
                        type="number"
                        min={1}
                        value={line.qty}
                        onChange={(event) => updateQty(product.id, Number(event.target.value))}
                      />
                    </td>
                    <td>{t("提交后报价", "Price on request")}</td>
                    <td>
                      <button className="btn" type="button" onClick={() => remove(product.id)}>
                        {t("删除", "Remove")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      <aside className="panel quote-panel">
        <h2>{t("询价联系人", "Contact details")}</h2>
        <div className="form-stack">
          <label className="admin-field">
            <span>{t("联系人姓名 *", "Contact name *")}</span>
            <input className="field" value={customer.name} onChange={(event) => updateCustomer("name", event.target.value)} />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </label>
          <label className="admin-field">
            <span>{t("公司名称 *", "Company name *")}</span>
            <input className="field" value={customer.company} onChange={(event) => updateCustomer("company", event.target.value)} />
            {errors.company && <span className="field-error">{errors.company}</span>}
          </label>
          <label className="admin-field">
            <span>{t("联系电话 *", "Phone number *")}</span>
            <input className="field" value={customer.phone} onChange={(event) => updateCustomer("phone", event.target.value)} />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </label>
          <label className="admin-field">
            <span>{t("邮箱 *", "Email *")}</span>
            <input className="field" value={customer.email} onChange={(event) => updateCustomer("email", event.target.value)} />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </label>
          <label className="admin-field">
            <span>{t("收货地区", "Delivery location")}</span>
            <input className="field" value={customer.region} onChange={(event) => updateCustomer("region", event.target.value)} placeholder={t("例如：上海 / 深圳 / 北京", "City, region and country")} />
          </label>
          <label className="admin-field">
            <span>{t("备注", "Notes")}</span>
            <textarea className="field" value={customer.remark} onChange={(event) => updateCustomer("remark", event.target.value)} placeholder={t("请填写目标数量、交期、证书或发票需求", "Specify quantities, required delivery date, certificates or invoicing requirements")} />
          </label>
          {errors.form && <div className="notice">{errors.form}</div>}
          <button className="btn primary" type="button" disabled={submitting || items.length === 0} onClick={submitQuote}>
            {submitting ? t("提交中...", "Submitting...") : t("提交询价", "Submit inquiry")}
          </button>
        </div>
      </aside>
    </div>
  );
}
