"use client";

import { LayoutDashboard, Phone, ShoppingCart } from "lucide-react";
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
          <span>你好，欢迎来到上海凯森斯科技有限公司！</span>
          <a href={`tel:${site.supportPhone}`}>
            <Phone size={14} aria-hidden="true" />
            {site.supportPhone}
          </a>
        </div>
      </div>
      <header className="header">
        <div className="header-inner">
          <Link className="brand" href="/" aria-label={`${site.brandName} 首页`}>
            <span className="brand-logo">
              <img src="/kasons-logo.jpg" alt={`${site.brandName} 标志`} />
            </span>
            <span>
              <b>{site.brandName}</b>
              <span>{site.tagline}</span>
            </span>
          </Link>
          <nav className="nav" aria-label="主导航">
            <Link href="/">首页</Link>
            <Link href="/products">产品中心</Link>
            <Link href="/news">新闻中心</Link>
            <Link href="/info">资讯信息</Link>
            <Link href="/about">关于我们</Link>
            <Link href="/contact">联系我们</Link>
          </nav>
          <div className="header-actions">
            <Link className="icon-link" href="/admin" aria-label="管理后台">
              <LayoutDashboard size={18} aria-hidden="true" />
              <span>后台</span>
            </Link>
            <Link className="btn primary" href="/cart">
              <ShoppingCart size={17} aria-hidden="true" />
              询价车 {cartCount > 0 ? `(${cartCount})` : ""}
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
