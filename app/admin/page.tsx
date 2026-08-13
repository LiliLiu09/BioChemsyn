import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/adminAuth";
import { getInfoArticles, getNewsArticles, getProducts, getQuotes, getSiteContent } from "@/lib/cms";
import { AdminShell } from "@/components/AdminShell";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";

export default async function AdminPage() {
  if (!(await isAdminAuthed())) {
    redirect("/admin/login");
  }

  const [site, products, quotes, news, info] = await Promise.all([getSiteContent(), getProducts(), getQuotes(), getNewsArticles(), getInfoArticles()]);
  const pendingQuotes = quotes.filter((quote) => quote.status !== "已处理").length;
  const processedQuotes = quotes.filter((quote) => quote.status === "已处理").length;
  const publishedNews = news.filter((article) => article.published).length;
  const publishedInfo = info.filter((article) => article.published).length;

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
          <b>{pendingQuotes}</b>
          <span>待跟进询价</span>
        </div>
        <div className="stat">
          <b>{processedQuotes}</b>
          <span>已处理询价</span>
        </div>
        <div className="stat">
          <b>{publishedNews}</b>
          <span>已发布新闻</span>
        </div>
        <div className="stat">
          <b>{publishedInfo}</b>
          <span>已发布资讯信息</span>
        </div>
      </div>
      <div className="grid" style={{ marginTop: 18 }}>
        <Link className="product-card" href="/admin/site">
          <h3>首页管理</h3>
          <p>修改品牌名、首页标题、首页描述、按钮和基础联系方式。</p>
        </Link>
        <Link className="product-card" href="/admin/products">
          <h3>产品管理</h3>
          <p>维护产品展示字段、分类、图片和详情内容。</p>
        </Link>
        <Link className="product-card" href="/admin/news">
          <h3>新闻管理</h3>
          <p>发布公司新闻、活动动态和品牌内容。</p>
        </Link>
        <Link className="product-card" href="/admin/info">
          <h3>资讯信息管理</h3>
          <p>维护资讯信息分类、正文、封面图片和发布状态。</p>
        </Link>
        <Link className="product-card" href="/admin/about">
          <h3>关于我们管理</h3>
          <p>编辑关于我们页面的文字和二维码图片。</p>
        </Link>
        <Link className="product-card" href="/admin/contact">
          <h3>联系我们管理</h3>
          <p>编辑联系电话、邮箱、地址和联系页说明。</p>
        </Link>
        <Link className="product-card" href="/admin/quotes">
          <h3>询价管理</h3>
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
