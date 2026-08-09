"use client";

import { useState } from "react";
import type { SiteContent } from "@/lib/types";

export function SiteEditor({ initialSite }: { initialSite: SiteContent }) {
  const [site, setSite] = useState(initialSite);
  const [message, setMessage] = useState("");

  const update = (key: keyof SiteContent, value: string) => {
    setSite((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    setMessage("");
    const response = await fetch("/api/admin/site", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(site)
    });
    setMessage(response.ok ? "已保存首页内容" : "保存失败，请重新登录后台");
  };

  return (
    <div className="panel admin-panel">
      <div className="toolbar">
        <h1>首页内容</h1>
        <button className="btn primary" onClick={save}>
          保存
        </button>
      </div>
      <div className="admin-form-grid">
        {Object.entries(site).map(([key, value]) => (
          <label className="admin-field" key={key}>
            <span>{key}</span>
            {key === "heroDescription" || key === "notice" ? (
              <textarea className="field" value={value} onChange={(event) => update(key as keyof SiteContent, event.target.value)} />
            ) : (
              <input className="field" value={value} onChange={(event) => update(key as keyof SiteContent, event.target.value)} />
            )}
          </label>
        ))}
      </div>
      {message && <div className="notice">{message}</div>}
    </div>
  );
}
