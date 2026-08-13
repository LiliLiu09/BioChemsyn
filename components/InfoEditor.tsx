"use client";

import { useMemo, useState } from "react";
import type { InfoArticle } from "@/lib/types";
import { RichTextEditor } from "@/components/RichTextEditor";

const emptyArticle: InfoArticle = {
  id: "",
  slug: "",
  title: "",
  category: "服务资讯",
  author: "凯森斯生物",
  source: "凯森斯生物",
  publishedAt: new Date().toISOString().slice(0, 10),
  summary: "",
  content: "",
  coverImage: "",
  views: 0,
  published: true
};

function createSlug(title: string) {
  return (
    title
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || `info-${Date.now()}`
  );
}

export function InfoEditor({ initialInfo }: { initialInfo: InfoArticle[] }) {
  const [info, setInfo] = useState(initialInfo);
  const [activeId, setActiveId] = useState(initialInfo[0]?.id || "");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const active = info.find((item) => item.id === activeId) || info[0];
  const categories = useMemo(() => Array.from(new Set(info.map((article) => article.category.trim()).filter(Boolean))).sort(), [info]);

  const update = (key: keyof InfoArticle, value: string | number | boolean) => {
    if (!active) return;
    setInfo((current) =>
      current.map((article) => {
        if (article.id !== active.id) return article;
        const next = { ...article, [key]: value };
        if (key === "title" && !article.slug) {
          next.slug = createSlug(String(value));
        }
        return next;
      })
    );
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const addCategory = () => {
    const category = newCategory.trim();
    if (!category || !active) return;
    update("category", category);
    setNewCategory("");
    setMessage(`已将当前资讯分类设为：${category}。请保存全部资讯。`);
  };

  const addArticle = () => {
    const now = Date.now();
    const article: InfoArticle = {
      ...emptyArticle,
      id: `i-${now}`,
      slug: `info-${now}`,
      title: "新资讯"
    };
    setInfo((current) => [article, ...current]);
    setActiveId(article.id);
  };

  const removeArticle = () => {
    if (!active) return;
    const next = info.filter((article) => article.id !== active.id);
    setInfo(next);
    setActiveId(next[0]?.id || "");
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    info.forEach((article) => {
      if (!article.title.trim()) nextErrors.title = "标题不能为空";
      if (!article.slug.trim()) nextErrors.slug = "链接 slug 不能为空";
      if (!article.category.trim()) nextErrors.category = "分类不能为空";
      if (!article.summary.trim()) nextErrors.summary = "摘要不能为空";
      if (!article.content.trim()) nextErrors.content = "正文不能为空";
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const save = async () => {
    setMessage("");
    if (!validate()) {
      setMessage("请先修正表单错误");
      return;
    }

    const response = await fetch("/api/admin/info", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ info })
    });
    setMessage(response.ok ? "资讯内容已保存" : "保存失败，请重新登录后台或检查 Supabase 配置");
  };

  const uploadCover = async (file: File | undefined) => {
    if (!file || !active) return;
    setUploading(true);
    setMessage("");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "info");
    const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
    const payload = (await response.json()) as { url?: string; message?: string };
    setUploading(false);
    if (!response.ok || !payload.url) {
      setMessage(payload.message || "图片上传失败");
      return;
    }
    update("coverImage", payload.url);
    setMessage("封面图片已上传，请保存全部资讯");
  };

  if (!active) {
    return (
      <div className="panel admin-panel">
        <button className="btn primary" type="button" onClick={addArticle}>
          新增第一条资讯
        </button>
      </div>
    );
  }

  return (
    <div className="admin-products">
      <div className="panel admin-list">
        <div className="toolbar">
          <h2>资讯</h2>
          <button className="btn primary" type="button" onClick={addArticle}>
            新增
          </button>
        </div>
        {info.map((article) => (
          <button className={`admin-list-item ${article.id === active.id ? "active" : ""}`} key={article.id} type="button" onClick={() => setActiveId(article.id)}>
            <b>{article.title || "未命名资讯"}</b>
            <span>
              {article.category} · {article.publishedAt} · {article.published ? "已发布" : "草稿"}
            </span>
          </button>
        ))}
      </div>

      <div className="panel admin-panel">
        <div className="toolbar">
          <h1>资讯信息管理</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" type="button" onClick={removeArticle}>
              删除
            </button>
            <button className="btn primary" type="button" onClick={save}>
              保存全部
            </button>
          </div>
        </div>

        <div className="admin-form-grid">
          <label className="admin-field full">
            <span>标题 *</span>
            <input className="field" value={active.title} onChange={(event) => update("title", event.target.value)} />
            {errors.title && <span className="field-error">{errors.title}</span>}
          </label>
          <label className="admin-field">
            <span>链接 slug *</span>
            <input className="field" value={active.slug} onChange={(event) => update("slug", event.target.value)} />
            {errors.slug && <span className="field-error">{errors.slug}</span>}
          </label>
          <label className="admin-field">
            <span>发布日期</span>
            <input className="field" type="date" value={active.publishedAt} onChange={(event) => update("publishedAt", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>阅读量</span>
            <input className="field" type="number" min={0} value={active.views} onChange={(event) => update("views", Number(event.target.value))} />
          </label>
          <label className="admin-field full">
            <span>资讯分类 *</span>
            <input className="field" list="info-categories" value={active.category} onChange={(event) => update("category", event.target.value)} placeholder="选择或输入资讯分类" />
            <datalist id="info-categories">
              {categories.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
            <div className="inline-controls">
              <input className="field" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="新增资讯类别" />
              <button className="btn" type="button" onClick={addCategory}>
                添加并应用
              </button>
            </div>
            {categories.length > 0 && (
              <div className="category-pills">
                {categories.map((category) => (
                  <button type="button" key={category} onClick={() => update("category", category)}>
                    {category}
                  </button>
                ))}
              </div>
            )}
            {errors.category && <span className="field-error">{errors.category}</span>}
          </label>
          <label className="admin-field">
            <span>作者</span>
            <input className="field" value={active.author} onChange={(event) => update("author", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>来源</span>
            <input className="field" value={active.source} onChange={(event) => update("source", event.target.value)} />
          </label>
          <label className="admin-field full">
            <span>封面图片</span>
            <input className="field" value={active.coverImage} onChange={(event) => update("coverImage", event.target.value)} placeholder="上传后自动生成图片地址" />
            <input className="field" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => uploadCover(event.target.files?.[0])} />
            {uploading && <span className="result-count">封面上传中...</span>}
            {active.coverImage && <img className="admin-preview" src={active.coverImage} alt="资讯封面预览" />}
          </label>
          <label className="admin-field full">
            <span>摘要 *</span>
            <textarea className="field" value={active.summary} onChange={(event) => update("summary", event.target.value)} />
            {errors.summary && <span className="field-error">{errors.summary}</span>}
          </label>
          <label className="admin-field full">
            <span>正文 *</span>
            <RichTextEditor value={active.content} onChange={(value) => update("content", value)} uploadFolder="info" imageAlt="资讯图片" />
            {errors.content && <span className="field-error">{errors.content}</span>}
          </label>
          <label className="admin-field full checkbox-field">
            <input type="checkbox" checked={active.published} onChange={(event) => update("published", event.target.checked)} />
            <span>发布到前台资讯信息页</span>
          </label>
        </div>
        {message && <div className="notice">{message}</div>}
      </div>
    </div>
  );
}
