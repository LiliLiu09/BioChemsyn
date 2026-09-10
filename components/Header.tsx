"use client";

import { LayoutDashboard, Phone, ShoppingCart } from "lucide-react";
import Link from "@/components/LocaleLink";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useLanguage } from "./LanguageProvider";
import { useEffect, useState } from "react";
import { cartStorageKey } from "@/lib/session";
import type { SiteContent } from "@/lib/types";

export function Header({ site }: { site: SiteContent }) {
  const { t } = useLanguage();
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
          <span>{t("你好，欢迎来到上海凯森斯科技有限公司！", "Welcome to Shanghai KASONS Technology Co., Ltd.")}</span>
          <div className="topbar-actions"><a href={`tel:${site.supportPhone}`}>
            <Phone size={14} aria-hidden="true" />
            {site.supportPhone}
          </a><LanguageSwitcher /></div>
        </div>
      </div>
      <header className="header">
        <div className="header-inner">
          <Link className="brand" href="/" aria-label={`${site.brandName} ${t("首页", "home")}`}>
            <span className="brand-logo">
              <img src="/kasons-logo.jpg" alt={`${site.brandName} ${t("标志", "logo")}`} />
            </span>
            <span>
              <b>{site.brandName}</b>
              <span>{site.tagline}</span>
            </span>
          </Link>
          <nav className="nav" aria-label={t("主导航", "Main navigation")}>
            <Link href="/">{t("首页", "Home")}</Link>
            <Link href="/products">{t("产品中心", "Products")}</Link>
            <Link href="/news">{t("新闻中心", "News")}</Link>
            <Link href="/info">{t("资讯信息", "Resources")}</Link>
            <Link href="/about">{t("关于我们", "About")}</Link>
            <Link href="/contact">{t("联系我们", "Contact")}</Link>
          </nav>
          <div className="header-actions">
            <Link className="icon-link" href="/admin" aria-label={t("管理后台", "Administration")}>
              <LayoutDashboard size={18} aria-hidden="true" />
              <span>{t("后台", "Admin")}</span>
            </Link>
            <Link className="btn primary" href="/cart">
              <ShoppingCart size={17} aria-hidden="true" />
              {t("询价车", "Inquiry cart")} {cartCount > 0 ? `(${cartCount})` : ""}
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
