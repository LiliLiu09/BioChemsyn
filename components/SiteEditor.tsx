"use client";

import { useState } from "react";
import type { SiteContent } from "@/lib/types";

const labels: Record<keyof SiteContent, string> = {
  brandName: "品牌名称",
  tagline: "品牌标语",
  supportPhone: "服务电话",
  heroTitle: "首页主标题",
  heroDescription: "首页描述",
  primaryCta: "主按钮文案",
  notice: "用途声明",
  companyName: "公司名称",
  contactEmail: "联系邮箱",
  address: "公司地址"
};

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
        <h1>首页内容</h1>
        <button className="btn primary" type="button" onClick={save}>
          保存
        </button>
      </div>
      <div className="admin-form-grid">
        {Object.entries(site).map(([key, value]) => {
          const typedKey = key as keyof SiteContent;
          return (
            <label className="admin-field" key={key}>
              <span>{labels[typedKey]}</span>
              {key === "heroDescription" || key === "notice" ? (
                <textarea className="field" value={value} onChange={(event) => update(typedKey, event.target.value)} />
              ) : (
                <input className="field" value={value} onChange={(event) => update(typedKey, event.target.value)} />
              )}
              {errors[key] && <span className="field-error">{errors[key]}</span>}
            </label>
          );
        })}
      </div>
      {message && <div className="notice">{message}</div>}
    </div>
  );
}
