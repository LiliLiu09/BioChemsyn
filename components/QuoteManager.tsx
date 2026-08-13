"use client";

import { useState } from "react";
import type { QuoteRequest } from "@/lib/types";

const statuses: QuoteRequest["status"][] = ["待处理", "已报价", "已关闭", "已处理"];

export function QuoteManager({ initialQuotes }: { initialQuotes: QuoteRequest[] }) {
  const [quotes, setQuotes] = useState(initialQuotes);
  const [showAll, setShowAll] = useState(false);
  const [activeId, setActiveId] = useState(initialQuotes.find((quote) => quote.status !== "已处理")?.id || initialQuotes[0]?.id || "");
  const [message, setMessage] = useState("");

  const visibleQuotes = showAll ? quotes : quotes.filter((quote) => quote.status !== "已处理" || quote.id === activeId);
  const active = visibleQuotes.find((quote) => quote.id === activeId) || visibleQuotes[0];
  const hiddenCount = quotes.filter((quote) => quote.status === "已处理").length;

  const updateQuote = (id: string, patch: Partial<QuoteRequest>) => {
    setQuotes((current) => current.map((quote) => (quote.id === id ? { ...quote, ...patch } : quote)));
  };

  const persistQuotes = async (nextQuotes: QuoteRequest[], successMessage: string) => {
    setMessage("");
    const response = await fetch("/api/admin/quotes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quotes: nextQuotes })
    });

    if (response.ok) {
      setQuotes(nextQuotes);
      setMessage(successMessage);
      return true;
    }

    setMessage("保存失败，请重新登录后台或检查 Supabase 配置");
    return false;
  };

  const save = async () => {
    await persistQuotes(quotes, "询价记录已保存");
  };

  const markProcessed = async () => {
    if (!active) return;

    const nextQuotes = quotes.map((quote) => (quote.id === active.id ? { ...quote, status: "已处理" as const } : quote));
    const saved = await persistQuotes(nextQuotes, "询价已标记为已处理");
    if (saved && !showAll) {
      setActiveId(nextQuotes.find((quote) => quote.status !== "已处理")?.id || "");
    }
  };

  if (!active) {
    return (
      <div className="panel admin-panel">
        <div className="toolbar">
          <div>
            <h1>询价管理</h1>
            <span className="result-count">默认隐藏已处理询价。</span>
          </div>
          {hiddenCount > 0 && (
            <button className="btn ghost" type="button" onClick={() => setShowAll(true)}>
              显示全部
            </button>
          )}
        </div>
        <div className="notice">{quotes.length > 0 ? "暂无未处理询价记录。" : "暂无询价记录。"}</div>
      </div>
    );
  }

  return (
    <div className="admin-products">
      <div className="panel admin-list">
        <div className="toolbar">
          <div>
            <h2>询价单</h2>
            <span className="result-count">
              {showAll ? `全部 ${quotes.length} 条` : `未处理 ${visibleQuotes.filter((quote) => quote.status !== "已处理").length} 条`}
            </span>
          </div>
          <button className="btn ghost" type="button" onClick={() => setShowAll((current) => !current)}>
            {showAll ? "隐藏已处理" : "显示全部"}
          </button>
        </div>
        {visibleQuotes.map((quote) => (
          <button
            className={`admin-list-item ${quote.id === active.id ? "active" : ""}`}
            key={quote.id}
            type="button"
            onClick={() => setActiveId(quote.id)}
          >
            <b>{quote.customer.company || quote.customer.name}</b>
            <span>
              {quote.id} · {quote.status}
            </span>
          </button>
        ))}
      </div>

      <div className="panel admin-panel">
        <div className="toolbar">
          <div>
            <h1>询价详情</h1>
            <span className="result-count">
              {active.id} · {new Date(active.createdAt).toLocaleString("zh-CN")}
            </span>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {active.status !== "已处理" && (
              <button className="btn ghost" type="button" onClick={markProcessed}>
                标记已处理
              </button>
            )}
            <button className="btn primary" type="button" onClick={save}>
              保存
            </button>
          </div>
        </div>

        <div className="admin-form-grid">
          <label className="admin-field">
            <span>处理状态</span>
            <select className="field" value={active.status} onChange={(event) => updateQuote(active.id, { status: event.target.value as QuoteRequest["status"] })}>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-field">
            <span>联系人</span>
            <input className="field" value={active.customer.name} readOnly />
          </label>
          <label className="admin-field">
            <span>公司</span>
            <input className="field" value={active.customer.company} readOnly />
          </label>
          <label className="admin-field">
            <span>电话</span>
            <input className="field" value={active.customer.phone} readOnly />
          </label>
          <label className="admin-field">
            <span>邮箱</span>
            <input className="field" value={active.customer.email} readOnly />
          </label>
          <label className="admin-field">
            <span>地区</span>
            <input className="field" value={active.customer.region || "未填写"} readOnly />
          </label>
          <label className="admin-field full">
            <span>客户备注</span>
            <textarea className="field" value={active.customer.remark || "未填写"} readOnly />
          </label>
          <label className="admin-field full">
            <span>销售备注</span>
            <textarea className="field" value={active.salesNote} onChange={(event) => updateQuote(active.id, { salesNote: event.target.value })} />
          </label>
        </div>

        <h2>产品清单</h2>
        <table className="cart-table">
          <thead>
            <tr>
              <th>产品</th>
              <th>CAS / 货号</th>
              <th>规格</th>
              <th>数量</th>
            </tr>
          </thead>
          <tbody>
            {active.lines.map((line) => (
              <tr key={`${active.id}-${line.productId}`}>
                <td>
                  <b>{line.nameCn || line.nameEn}</b>
                  <br />
                  <span style={{ color: "#667382" }}>{line.nameEn}</span>
                </td>
                <td>
                  {line.cas || "待确认"}
                  <br />
                  {line.sku}
                </td>
                <td>{line.packageSize || "待确认"}</td>
                <td>{line.qty}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {message && <div className="notice">{message}</div>}
      </div>
    </div>
  );
}
