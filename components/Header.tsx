"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cartStorageKey } from "@/lib/session";
import type { SiteContent } from "@/lib/types";

export function Header({ site }: { site: SiteContent }) {
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const refresh = () => {
      const cart = JSON.parse(localStorage.getItem(cartStorageKey) || "[]") as unknown[];
      setCartCount(cart.length);
    };

    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("cart-updated", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("cart-updated", refresh);
    };
  }, []);

  return (
    <>
      <div className="topbar">
        <div className="topbar-inner">
          <span>{site.notice}</span>
          <span>服务热线：{site.supportPhone}　邮箱：{site.contactEmail}</span>
        </div>
      </div>
      <header className="header">
        <div className="header-inner">
          <Link className="brand" href="/">
            <span className="brand-mark">C</span>
            <span>
              <b>{site.brandName}</b>
              <span>{site.tagline}</span>
            </span>
          </Link>
          <nav className="nav">
            <Link href="/">首页</Link>
            <Link href="/products">产品中心</Link>
            <Link href="/cart">询价车</Link>
            <a href="#support">服务支持</a>
          </nav>
          <div className="header-actions">
            <Link className="btn" href="/admin">
              管理后台
            </Link>
            <Link className="btn primary" href="/cart">
              询价车 {cartCount > 0 ? `(${cartCount})` : ""}
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
