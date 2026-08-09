"use client";

import Link from "next/link";
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
  const [lines, setLines] = useState<CartLine[]>([]);
  const [customer, setCustomer] = useState(emptyCustomer);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLines(JSON.parse(localStorage.getItem(cartStorageKey) || "[]") as CartLine[]);
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
    setCustomer((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const submitQuote = async () => {
    setSubmitting(true);
    setErrors({});
    setMessage("");

    const response = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer,
        lines: items.map(({ product, line }) => ({ id: product.id, qty: line.qty }))
      })
    });

    const payload = (await response.json()) as { quote?: { id: string }; errors?: Record<string, string> };
    setSubmitting(false);

    if (!response.ok) {
      setErrors(payload.errors || { form: "提交失败，请检查表单后重试" });
      return;
    }

    persistLines([]);
    setCustomer(emptyCustomer);
    setMessage(`询价已提交，单号：${payload.quote?.id || "已生成"}。销售团队会尽快联系您。`);
  };

  return (
    <div className="quote-layout">
      <div className="panel quote-panel">
        <div className="toolbar">
          <h2>询价车</h2>
          <Link className="btn" href="/products">
            继续选购
          </Link>
        </div>

        {message && <div className="success">{message}</div>}
        {errors.lines && <div className="notice">{errors.lines}</div>}
        {items.length === 0 ? (
          <div className="notice">询价车还是空的。请先前往产品中心添加需要咨询的产品。</div>
        ) : (
          <>
            <div className="notice" style={{ marginBottom: 14 }}>
              提交后，销售团队会根据数量、库存和客户信息，通过邮件或电话回复正式报价。
            </div>
            <table className="cart-table">
              <thead>
                <tr>
                  <th>产品</th>
                  <th>CAS / 货号</th>
                  <th>规格</th>
                  <th>数量</th>
                  <th>报价状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {items.map(({ product, line }) => (
                  <tr key={product.id}>
                    <td>
                      <b>{product.nameCn || product.nameEn || "未命名产品"}</b>
                      <br />
                      <span style={{ color: "#667382" }}>{product.nameEn || "英文名称待补充"}</span>
                    </td>
                    <td>
                      {product.cas || "待确认"}
                      <br />
                      {product.sku}
                    </td>
                    <td>{product.packageSize || "待确认"}</td>
                    <td>
                      <input
                        aria-label={`${product.nameCn || product.sku} 数量`}
                        className="field"
                        style={{ width: 74 }}
                        type="number"
                        min={1}
                        value={line.qty}
                        onChange={(event) => updateQty(product.id, Number(event.target.value))}
                      />
                    </td>
                    <td>提交后报价</td>
                    <td>
                      <button className="btn" type="button" onClick={() => remove(product.id)}>
                        删除
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
        <h2>询价联系人</h2>
        <div className="form-stack">
          <label className="admin-field">
            <span>联系人姓名 *</span>
            <input className="field" value={customer.name} onChange={(event) => updateCustomer("name", event.target.value)} />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </label>
          <label className="admin-field">
            <span>公司名称 *</span>
            <input className="field" value={customer.company} onChange={(event) => updateCustomer("company", event.target.value)} />
            {errors.company && <span className="field-error">{errors.company}</span>}
          </label>
          <label className="admin-field">
            <span>联系电话 *</span>
            <input className="field" value={customer.phone} onChange={(event) => updateCustomer("phone", event.target.value)} />
            {errors.phone && <span className="field-error">{errors.phone}</span>}
          </label>
          <label className="admin-field">
            <span>邮箱 *</span>
            <input className="field" value={customer.email} onChange={(event) => updateCustomer("email", event.target.value)} />
            {errors.email && <span className="field-error">{errors.email}</span>}
          </label>
          <label className="admin-field">
            <span>收货地区</span>
            <input className="field" value={customer.region} onChange={(event) => updateCustomer("region", event.target.value)} placeholder="例如：上海 / 深圳 / 北京" />
          </label>
          <label className="admin-field">
            <span>备注</span>
            <textarea className="field" value={customer.remark} onChange={(event) => updateCustomer("remark", event.target.value)} placeholder="请填写目标数量、交期、证书或发票需求" />
          </label>
          {errors.form && <div className="notice">{errors.form}</div>}
          <button className="btn primary" type="button" disabled={submitting || items.length === 0} onClick={submitQuote}>
            {submitting ? "提交中..." : "提交询价"}
          </button>
        </div>
      </aside>
    </div>
  );
}
