"use client";

import { useState } from "react";
import { RichTextEditor } from "@/components/RichTextEditor";
import type { SiteContent } from "@/lib/types";

export function ContactEditor({ initialSite }: { initialSite: SiteContent }) {
  const [site, setSite] = useState(initialSite);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const updateContent = (value: string) => {
    setSite((current) => ({ ...current, contactDescription: value }));
    setError("");
  };

  const save = async () => {
    setMessage("");
    if (!site.contactDescription.trim()) {
      setError("联系我们内容不能为空");
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
          <span className="result-count">维护前台联系我们页面的富文本内容。</span>
        </div>
        <button className="btn primary" type="button" onClick={save}>
          保存
        </button>
      </div>

      <div className="admin-form-grid">
        <div className="admin-field full">
          <span>联系我们内容</span>
          <RichTextEditor value={site.contactDescription} onChange={updateContent} uploadFolder="contact" imageAlt="联系我们图片" />
          {error && <span className="field-error">{error}</span>}
        </div>
      </div>

      {message && <div className="notice">{message}</div>}
    </div>
  );
}
