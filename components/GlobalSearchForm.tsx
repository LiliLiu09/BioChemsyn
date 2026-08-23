import { Search } from "lucide-react";

export function GlobalSearchForm({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/search" method="get" className="search-card global-search-form">
      <label className="search-field">
        <Search size={18} aria-hidden="true" />
        <span className="sr-only">全站搜索</span>
        <input
          name="q"
          defaultValue={defaultValue}
          placeholder="搜索产品、CAS、新闻、资讯或公司信息"
        />
      </label>

      <button className="btn primary" type="submit">
        全站搜索
      </button>
    </form>
  );
}