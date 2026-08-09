import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/adminAuth";
import { getProducts, getQuotes, getSiteContent } from "@/lib/cms";
import { AdminShell } from "@/components/AdminShell";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";

export default async function AdminPage() {
  if (!(await isAdminAuthed())) {
    redirect("/admin/login");
  }

  const [site, products, quotes] = await Promise.all([getSiteContent(), getProducts(), getQuotes()]);
  const pendingQuotes = quotes.filter((quote) => quote.status === "待处理").length;

  return (
    <AdminShell>
      <div className="toolbar">
        <h1>后台概览</h1>
        <AdminLogoutButton />
      </div>
      <div className="stats">
        <div className="stat">
          <b>{products.length}</b>
          <span>产品数量</span>
        </div>
        <div className="stat">
          <b>{quotes.length}</b>
          <span>询价总数</span>
        </div>
        <div className="stat">
          <b>{pendingQuotes}</b>
          <span>待处理询价</span>
        </div>
      </div>
      <div className="grid" style={{ marginTop: 18 }}>
        <Link className="product-card" href="/admin/site">
          <h3>编辑首页内容</h3>
          <p>修改品牌名、首页标题、联系方式和公告文案。</p>
        </Link>
        <Link className="product-card" href="/admin/products">
          <h3>管理产品</h3>
          <p>新增、删除、编辑产品，并上传本地产品图片。</p>
        </Link>
        <Link className="product-card" href="/admin/quotes">
          <h3>处理询价</h3>
          <p>查看客户信息、产品清单、处理状态和销售备注。</p>
        </Link>
        <div className="product-card">
          <h3>站点品牌</h3>
          <p>{site.brandName}</p>
        </div>
      </div>
    </AdminShell>
  );
}
