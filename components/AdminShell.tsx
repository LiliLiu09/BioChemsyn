"use client";

import Link from "@/components/LocaleLink";

import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useAdminLanguage } from "@/components/admin-language";
export function AdminShell({ children }: { children: React.ReactNode }) {
  const { t } = useAdminLanguage();
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link className="brand" href="/admin">
          <span className="brand-mark">A</span>
          <span>
            <b>{t("后台概览")}</b>
            <span>{t("轻量 CMS 后台")}</span>
          </span>
        </Link>
        <nav className="admin-nav">
          <Link href="/admin">{t("后台概览")}</Link>
          <Link href="/admin/site">{t("首页管理")}</Link>
          <Link href="/admin/products">{t("产品管理")}</Link>
          <Link href="/admin/news">{t("新闻管理")}</Link>
          <Link href="/admin/info">{t("资讯信息管理")}</Link>
          <Link href="/admin/about">{t("关于我们管理")}</Link>
          <Link href="/admin/contact">{t("联系我们管理")}</Link>
          <Link href="/admin/quotes">{t("询价管理")}</Link>
          <Link href="/">{t("返回前台")}</Link>
        </nav>
      </aside>
      <main className="admin-main"><div className="admin-language-toolbar"><LanguageSwitcher /></div>{children}</main>
    </div>
  );
}
