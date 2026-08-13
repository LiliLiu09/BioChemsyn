"use client";

import { useState } from "react";
import type { SiteContent } from "@/lib/types";

const contactFields: { key: keyof SiteContent; label: string; multiline?: boolean }[] = [
  { key: "contactTitle", label: "页面标题" },
  { key: "contactDescription", label: "页面说明", multiline: true },
  { key: "supportPhone", label: "联系电话" },
  { key: "contactEmail", label: "联系邮箱" },
  { key: "address", label: "公司地址", multiline: true },
  { key: "contactCta", label: "按钮文案" }
];

export function ContactEditor({ initialSite }: { initialSite: SiteContent }) {
  const [site, setSite] = useState(initialSite);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  const update = (key: keyof SiteContent, value: string) => {
    setSite((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const uploadQrImage = async (file: File | undefined) => {
    if (!file) return;

    setUploading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "contact");

    const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const payload = (await response.json()) as { url?: string; message?: string };
    setUploading(false);

    if (!response.ok || !payload.url) {
      setMessage(payload.message || "二维码图片上传失败");
      return;
    }

    update("contactQrImage", payload.url);
    setMessage("二维码图片已上传，请保存联系我们内容");
  };

  const save = async () => {
    setMessage("");
    const nextErrors: Record<string, string> = {};
    if (!site.contactTitle.trim()) nextErrors.contactTitle = "页面标题不能为空";
    if (!site.contactEmail.includes("@")) nextErrors.contactEmail = "请填写有效邮箱";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setMessage("请先修正表单错误");
      return;
    }

    const response = await fetch("/api/admin/contact", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(site)
    });
    setMessage(response.ok ? "已保存联系我们内容" : "保存失败，请重新登录后台或检查 Supabase 配置");
  };

  return (
    <div className="panel admin-panel">
      <div className="toolbar">
        <div>
          <h1>联系我们管理</h1>
          <span className="result-count">维护前台联系我们页面的电话、邮箱、地址、说明文案和二维码。</span>
        </div>
        <button className="btn primary" type="button" onClick={save}>
          保存
        </button>
      </div>

      <div className="admin-form-grid">
        {contactFields.map((field) => (
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

        <label className="admin-field">
          <span>二维码图片地址</span>
          <input className="field" value={site.contactQrImage} onChange={(event) => update("contactQrImage", event.target.value)} placeholder="上传后自动生成，也可以手动粘贴图片地址" />
        </label>

        <label className="admin-field">
          <span>上传二维码图片</span>
          <input className="field" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => uploadQrImage(event.target.files?.[0])} />
          {uploading && <span className="result-count">二维码图片上传中...</span>}
        </label>

        {site.contactQrImage && (
          <div className="admin-field">
            <span>二维码预览</span>
            <img className="admin-preview" src={site.contactQrImage} alt="二维码预览" />
          </div>
        )}
      </div>

      {message && <div className="notice">{message}</div>}
    </div>
  );
}
