"use client";

import { useRouter } from "next/navigation";

import { localizePath } from "@/lib/i18n";
import { useAdminLanguage } from "@/components/admin-language";
export function AdminLogoutButton() {
  const { locale, t } = useAdminLanguage();
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push(localizePath("/admin/login", locale));
  };

  return (
    <button className="btn" type="button" onClick={logout}>{t("退出登录")}</button>
  );
}
