"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
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
      setMessage("账号或密码错误");
      return;
    }

    router.push("/admin");
  };

  return (
    <div className="login-card">
      <h1>后台登录</h1>
      <div className="form-stack">
        <input className="field" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="管理员邮箱" />
        <input
          className="field"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          placeholder="管理员密码"
        />
        <button className="btn primary" type="button" onClick={login} disabled={loading}>
          {loading ? "登录中..." : "进入后台"}
        </button>
        <div className="notice">
          默认账号：admin@example.com，默认密码：admin123456。正式部署时请用环境变量 ADMIN_EMAIL / ADMIN_PASSWORD 修改。
        </div>
        {message && <div className="notice">{message}</div>}
      </div>
    </div>
  );
}
