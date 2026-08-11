"use client";

import { useState } from "react";
import type { NewsArticle } from "@/lib/types";

const emptyArticle: NewsArticle = {
  id: "",
  slug: "",
  title: "",
  category: "公司新闻",
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
      .slice(0, 80) || `news-${Date.now()}`
  );
}

export function NewsEditor({ initialNews }: { initialNews: NewsArticle[] }) {
  const [news, setNews] = useState(initialNews);
  const [activeId, setActiveId] = useState(initialNews[0]?.id || "");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const active = news.find((item) => item.id === activeId) || news[0];

  const update = (key: keyof NewsArticle, value: string | number | boolean) => {
    setNews((current) =>
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

  const addArticle = () => {
    const now = Date.now();
    const article: NewsArticle = {
      ...emptyArticle,
      id: `n-${now}`,
      slug: `news-${now}`,
      title: "新新闻"
    };
    setNews((current) => [article, ...current]);
    setActiveId(article.id);
  };

  const removeArticle = () => {
    if (!active) return;
    const next = news.filter((article) => article.id !== active.id);
    setNews(next);
    setActiveId(next[0]?.id || "");
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    news.forEach((article) => {
      if (!article.title.trim()) nextErrors.title = "标题不能为空";
      if (!article.slug.trim()) nextErrors.slug = "链接 slug 不能为空";
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

    const response = await fetch("/api/admin/news", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ news })
    });
    setMessage(response.ok ? "新闻内容已保存" : "保存失败，请重新登录后台");
  };

  if (!active) {
    return (
      <div className="panel admin-panel">
        <button className="btn primary" type="button" onClick={addArticle}>
          新增第一篇新闻
        </button>
      </div>
    );
  }

  return (
    <div className="admin-products">
      <div className="panel admin-list">
        <div className="toolbar">
          <h2>新闻</h2>
          <button className="btn primary" type="button" onClick={addArticle}>
            新增
          </button>
        </div>
        {news.map((article) => (
          <button
            className={`admin-list-item ${article.id === active.id ? "active" : ""}`}
            key={article.id}
            type="button"
            onClick={() => setActiveId(article.id)}
          >
            <b>{article.title || "未命名新闻"}</b>
            <span>
              {article.publishedAt} · {article.published ? "已发布" : "草稿"}
            </span>
          </button>
        ))}
      </div>

      <div className="panel admin-panel">
        <div className="toolbar">
          <h1>撰写新闻</h1>
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
            <span>分类</span>
            <input className="field" value={active.category} onChange={(event) => update("category", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>发布日期</span>
            <input className="field" type="date" value={active.publishedAt} onChange={(event) => update("publishedAt", event.target.value)} />
          </label>
          <label className="admin-field">
            <span>阅读量</span>
            <input className="field" type="number" min={0} value={active.views} onChange={(event) => update("views", Number(event.target.value))} />
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
            <span>封面图片地址</span>
            <input className="field" value={active.coverImage} onChange={(event) => update("coverImage", event.target.value)} placeholder="/uploads/news/demo.jpg" />
          </label>
          <label className="admin-field full">
            <span>摘要 *</span>
            <textarea className="field" value={active.summary} onChange={(event) => update("summary", event.target.value)} />
            {errors.summary && <span className="field-error">{errors.summary}</span>}
          </label>
          <label className="admin-field full">
            <span>正文 *</span>
            <textarea className="field article-body-input" value={active.content} onChange={(event) => update("content", event.target.value)} />
            {errors.content && <span className="field-error">{errors.content}</span>}
          </label>
          <label className="admin-field full checkbox-field">
            <input type="checkbox" checked={active.published} onChange={(event) => update("published", event.target.checked)} />
            <span>发布到前台新闻中心</span>
          </label>
        </div>
        {message && <div className="notice">{message}</div>}
      </div>
    </div>
  );
}
