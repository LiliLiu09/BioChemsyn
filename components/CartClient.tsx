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
    [lines]
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
        <h2>询价 / 购物车</h2>
        <Link className="btn" href="/products">
          继续选购
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="notice">询价车还是空的。先去产品中心添加几个产品。</div>
      ) : (
        <>
          <div className="notice" style={{ marginBottom: 14 }}>
            提交后销售会根据数量、库存和客户信息通过邮件或电话回复报价。
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
                    <b>{product.nameCn}</b>
                    <br />
                    <span style={{ color: "#667382" }}>{product.nameEn}</span>
                  </td>
                  <td>
                    {product.cas}
                    <br />
                    {product.sku}
                  </td>
                  <td>{product.packageSize}</td>
                  <td>
                    <input
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
                    <button className="btn" onClick={() => remove(product.id)}>
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="price-row" style={{ justifyContent: "flex-end", gap: 18 }}>
            <span>共 {items.length} 个产品</span>
            <button className="btn primary">提交询价</button>
          </div>
        </>
      )}
    </div>
  );
}
