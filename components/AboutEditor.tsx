"use client";

import { useState } from "react";
import type { SiteContent } from "@/lib/types";

const aboutFields: { key: keyof SiteContent; label: string; multiline?: boolean }[] = [
  { key: "aboutTitle", label: "页面标题" },
  { key: "aboutDescription", label: "页面介绍", multiline: true },
  { key: "aboutPointOneTitle", label: "亮点一标题" },
  { key: "aboutPointOneText", label: "亮点一内容", multiline: true },
  { key: "aboutPointTwoTitle", label: "亮点二标题" },
  { key: "aboutPointTwoText", label: "亮点二内容", multiline: true },
  { key: "aboutPointThreeTitle", label: "亮点三标题" },
  { key: "aboutPointThreeText", label: "亮点三内容", multiline: true }
];

export function AboutEditor({ initialSite }: { initialSite: SiteContent }) {
  const [site, setSite] = useState(initialSite);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: keyof SiteContent, value: string) => {
    setSite((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const save = async () => {
    setMessage("");
    const nextErrors: Record<string, string> = {};
    if (!site.aboutTitle.trim()) nextErrors.aboutTitle = "页面标题不能为空";
    if (!site.aboutDescription.trim()) nextErrors.aboutDescription = "页面介绍不能为空";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setMessage("请先修正表单错误");
      return;
    }

    const response = await fetch("/api/admin/about", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(site)
    });
    setMessage(response.ok ? "已保存关于我们内容" : "保存失败，请重新登录后台或检查 Supabase 配置");
  };

  return (
    <div className="panel admin-panel">
      <div className="toolbar">
        <div>
          <h1>关于我们管理</h1>
          <span className="result-count">维护前台关于我们页面的介绍和亮点内容。</span>
        </div>
        <button className="btn primary" type="button" onClick={save}>
          保存
        </button>
      </div>
      <div className="admin-form-grid">
        {aboutFields.map((field) => (
          <label className={`admin-field ${field.multiline ? "full" : ""}`} key={field.key}>
            <span>{field.label}</span>
            {field.multiline ? (
              <textarea className="field" value={site[field.key]} onChange={(event) => update(field.key, event.target.value)} />
            ) : (
              <input className="field" value={site[field.key]} onChange={(event) => update(field.key, event.target.value)} />
            )}
            {errors[field.key] && <span className="field-error">{errors[field.key]}</span>}
          </label>
        ))}
      </div>
      {message && <div className="notice">{message}</div>}
    </div>
  );
}
