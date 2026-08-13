"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import type { InfoArticle } from "@/lib/types";

export function InfoExplorer({ articles }: { articles: InfoArticle[] }) {
  const [category, setCategory] = useState("全部");
  const [query, setQuery] = useState("");
  const categories = useMemo(() => ["全部", ...Array.from(new Set(articles.map((article) => article.category).filter(Boolean)))], [articles]);
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return articles.filter((article) => {
      const categoryMatched = category === "全部" || article.category === category;
      const haystack = [article.title, article.summary, article.content, article.category, article.author, article.source].join(" ").toLowerCase();
      return categoryMatched && (!keyword || haystack.includes(keyword));
    });
  }, [articles, category, query]);

  return (
    <section className="info-layout">
      <aside className="info-filter panel">
          <h2>咨询分类</h2>
        <div className="info-category-list" aria-label="咨询分类">
          {categories.map((item) => (
            <button className={item === category ? "active" : ""} type="button" key={item} onClick={() => setCategory(item)}>
              <span>{item}</span>
              <b>{item === "全部" ? articles.length : articles.filter((article) => article.category === item).length}</b>
            </button>
          ))}
        </div>
      </aside>

      <div className="info-results">
        <label className="search-field info-search">
          <Search size={18} aria-hidden="true" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索咨询关键词、标题或摘要" />
        </label>

        <div className="result-count">
          当前显示 {filtered.length} 条咨询{category !== "全部" ? ` · ${category}` : ""}
        </div>

        <div className="news-list">
          {filtered.length === 0 ? (
            <div className="notice">没有找到匹配的咨询。</div>
          ) : (
            filtered.map((article) => (
              <article className="news-card" key={article.id}>
                <div className="news-date">
                  <b>{article.publishedAt.slice(8, 10)}</b>
                  <span>{article.publishedAt.slice(0, 7)}</span>
                </div>
                <div className="news-card-body">
                  <div className="news-meta">
                    <span>{article.category}</span>
                    <span>阅读量：{article.views}</span>
                  </div>
                  <h2>
                    <Link href={`/info/${article.slug}`}>{article.title}</Link>
                  </h2>
                  <p>{article.summary}</p>
                  <Link className="locked" href={`/info/${article.slug}`}>
                    查看全文
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
