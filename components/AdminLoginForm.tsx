"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { localizePath } from "@/lib/i18n";
import { useAdminLanguage } from "@/components/admin-language";
export function AdminLoginForm() {
  const { locale, t } = useAdminLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123456");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    setLoading(false);
    if (!response.ok) {
      setMessage(t("账号或密码错误"));
      return;
    }

    router.push(localizePath("/admin", locale));
  };

  return (
    <div className="login-card">
      <h1>{t("后台登录")}</h1>
      <div className="form-stack">
        <input className="field" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t("管理员邮箱")} />
        <input
          className="field"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          placeholder={t("管理员密码")}
        />
        <button className="btn primary" type="button" onClick={login} disabled={loading}>
          {loading ? t("登录中...") : t("进入后台")}
        </button>
        {message && <div className="notice">{message}</div>}
      </div>
    </div>
  );
}
