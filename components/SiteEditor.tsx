"use client";

import { useState } from "react";
import type { SiteContent } from "@/lib/types";

type SiteField = {
  key: keyof SiteContent;
  label: string;
  multiline?: boolean;
};

const fields: SiteField[] = [
  { key: "brandName", label: "品牌名称" },
  { key: "tagline", label: "品牌标语" },
  { key: "heroTitle", label: "首页主标题" },
  { key: "heroDescription", label: "首页描述", multiline: true },
  { key: "primaryCta", label: "主按钮文案" },
  { key: "notice", label: "用途声明", multiline: true },
  { key: "companyName", label: "公司名称" },
  { key: "supportPhone", label: "服务电话" },
  { key: "contactEmail", label: "联系邮箱" },
  { key: "address", label: "公司地址" }
];

export function SiteEditor({ initialSite }: { initialSite: SiteContent }) {
  const [site, setSite] = useState(initialSite);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = (key: keyof SiteContent, value: string) => {
    setSite((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!site.brandName.trim()) nextErrors.brandName = "品牌名称不能为空";
    if (!site.heroTitle.trim()) nextErrors.heroTitle = "首页主标题不能为空";
    if (!site.contactEmail.includes("@")) nextErrors.contactEmail = "请填写有效邮箱";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const save = async () => {
    setMessage("");
    if (!validate()) {
      setMessage("请先修正表单错误");
      return;
    }
    const response = await fetch("/api/admin/site", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(site)
    });
    setMessage(response.ok ? "已保存首页内容" : "保存失败，请重新登录后台或检查 Supabase 配置");
  };

  return (
    <div className="panel admin-panel">
      <div className="toolbar">
        <div>
          <h1>首页管理</h1>
          <span className="result-count">管理前台首页、品牌和基础联系方式。</span>
        </div>
        <button className="btn primary" type="button" onClick={save}>
          保存
        </button>
      </div>
      <div className="admin-form-grid">
        {fields.map((field) => (
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
