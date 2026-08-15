import Link from "next/link";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link className="brand" href="/admin">
          <span className="brand-mark">A</span>
          <span>
            <b>Admin</b>
            <span>轻量 CMS 后台</span>
          </span>
        </Link>
        <nav className="admin-nav">
          <Link href="/admin">后台概览</Link>
          <Link href="/admin/site">首页管理</Link>
          <Link href="/admin/products">产品管理</Link>
          <Link href="/admin/news">新闻管理</Link>
          <Link href="/admin/info">资讯信息管理</Link>
          <Link href="/admin/about">关于我们管理</Link>
          <Link href="/admin/contact">联系我们管理</Link>
          <Link href="/admin/quotes">询价管理</Link>
          <Link href="/">返回前台</Link>
        </nav>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
