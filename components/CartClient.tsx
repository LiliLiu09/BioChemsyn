"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { cartStorageKey } from "@/lib/session";
import type { Product } from "@/lib/types";

type CartLine = {
  id: string;
  qty: number;
};

export function CartClient({ products }: { products: Product[] }) {
  const [lines, setLines] = useState<CartLine[]>([]);

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

  const updateQty = (id: string, qty: number) => {
    const next = lines.map((line) => (line.id === id ? { ...line, qty: Math.max(1, qty) } : line));
    setLines(next);
    localStorage.setItem(cartStorageKey, JSON.stringify(next));
    window.dispatchEvent(new Event("cart-updated"));
  };

  const remove = (id: string) => {
    const next = lines.filter((line) => line.id !== id);
    setLines(next);
    localStorage.setItem(cartStorageKey, JSON.stringify(next));
    window.dispatchEvent(new Event("cart-updated"));
  };

  return (
    <div className="panel" style={{ padding: 20 }}>
      <div className="toolbar">
        <h2>询价车</h2>
        <Link className="btn" href="/products">
          继续选购
        </Link>
      </div>

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
          <div className="price-row" style={{ justifyContent: "flex-end", gap: 18 }}>
            <span>共 {items.length} 个产品</span>
            <button className="btn primary" type="button">
              提交询价
            </button>
          </div>
        </>
      )}
    </div>
  );
}
