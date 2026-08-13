"use client";

import { useState } from "react";
import type { SiteContent } from "@/lib/types";
import { RichTextEditor } from "@/components/RichTextEditor";

export function AboutEditor({ initialSite }: { initialSite: SiteContent }) {
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
    formData.append("folder", "about");

    const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const payload = (await response.json()) as { url?: string; message?: string };
    setUploading(false);

    if (!response.ok || !payload.url) {
      setMessage(payload.message || "二维码图片上传失败");
      return;
    }

    update("aboutQrImage", payload.url);
    setMessage("二维码图片已上传，请保存关于我们内容");
  };

  const save = async () => {
    setMessage("");
    const nextErrors: Record<string, string> = {};
    if (!site.aboutTitle.trim()) nextErrors.aboutTitle = "页面标题不能为空";
    if (!site.aboutDescription.trim()) nextErrors.aboutDescription = "关于我们文字不能为空";
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
          <span className="result-count">维护前台关于我们页面的文字和二维码图片。</span>
        </div>
        <button className="btn primary" type="button" onClick={save}>
          保存
        </button>
      </div>

      <div className="admin-form-grid">
        <label className="admin-field">
          <span>页面标题</span>
          <input className="field" value={site.aboutTitle} onChange={(event) => update("aboutTitle", event.target.value)} />
          {errors.aboutTitle && <span className="field-error">{errors.aboutTitle}</span>}
        </label>

        <label className="admin-field full">
          <span>关于我们文字</span>
          <RichTextEditor value={site.aboutDescription} onChange={(value) => update("aboutDescription", value)} uploadFolder="about" imageAlt="关于我们图片" />
          {errors.aboutDescription && <span className="field-error">{errors.aboutDescription}</span>}
        </label>

        <label className="admin-field">
          <span>二维码图片地址</span>
          <input className="field" value={site.aboutQrImage} onChange={(event) => update("aboutQrImage", event.target.value)} placeholder="上传后自动生成，也可以手动粘贴图片地址" />
        </label>

        <label className="admin-field">
          <span>上传二维码图片</span>
          <input className="field" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => uploadQrImage(event.target.files?.[0])} />
          {uploading && <span className="result-count">二维码图片上传中...</span>}
        </label>

        {site.aboutQrImage && (
          <div className="admin-field">
            <span>二维码预览</span>
            <img className="admin-preview" src={site.aboutQrImage} alt="二维码预览" />
          </div>
        )}
      </div>

      {message && <div className="notice">{message}</div>}
    </div>
  );
}
