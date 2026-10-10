"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { localizePath } from "@/lib/i18n";
import { useAdminLanguage } from "@/components/admin-language";
export function AdminLoginForm() {
  const { locale, t } = useAdminLanguage();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    setLoading(false);
    if (!response.ok) {
      setMessage(response.status === 401 ? t("账号或密码错误") : t("登录服务暂时不可用，请检查数据库配置"));
      return;
    }

    router.replace(localizePath("/admin", locale));
    router.refresh();
  };

  return (
    <div className="login-card">
      <h1>{t("后台登录")}</h1>
      <form className="form-stack" onSubmit={login}>
        <input className="field" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t("管理员邮箱")} type="email" autoComplete="username" required />
        <input
          className="field"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          autoComplete="current-password"
          placeholder={t("管理员密码")}
          required
        />
        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? t("登录中...") : t("进入后台")}
        </button>
        {message && <div className="notice">{message}</div>}
      </form>
    </div>
  );
}
