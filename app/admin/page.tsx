import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/adminAuth";
import { getProducts, getSiteContent } from "@/lib/cms";
import { AdminShell } from "@/components/AdminShell";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";

export default async function AdminPage() {
  if (!(await isAdminAuthed())) {
    redirect("/admin/login");
  }

  const [site, products] = await Promise.all([getSiteContent(), getProducts()]);

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
          <b>{site.brandName}</b>
          <span>站点品牌</span>
        </div>
        <div className="stat">
          <b>{site.supportPhone}</b>
          <span>服务热线</span>
        </div>
      </div>
      <div className="grid" style={{ marginTop: 18 }}>
        <Link className="product-card" href="/admin/site">
          <h3>编辑首页内容</h3>
          <p>修改品牌名、首页标题、联系方式和公告文案。</p>
        </Link>
        <Link className="product-card" href="/admin/products">
          <h3>管理产品</h3>
          <p>新增、删除、编辑产品。保存后前台产品库立刻读取 JSON 内容。</p>
        </Link>
      </div>
    </AdminShell>
  );
}
