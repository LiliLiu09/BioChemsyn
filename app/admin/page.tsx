import Link from "@/components/LocaleLink";
import { getLocale } from "@/lib/locale-server";
import { translate, localizePath } from "@/lib/i18n";
import { localizeSiteContent } from "@/lib/content-locale";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/adminAuth";
import { getInfoArticles, getNewsArticles, getProducts, getQuotes, getSiteContent } from "@/lib/cms";
import { AdminShell } from "@/components/AdminShell";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";

export default async function AdminPage() {
  const locale = await getLocale();
  const t = (zh: string, en: string) => translate(locale, zh, en);
  if (!(await isAdminAuthed())) {
    redirect(localizePath("/admin/login", locale));
  }

  const [site, products, quotes, news, info] = await Promise.all([getSiteContent(), getProducts(), getQuotes(), getNewsArticles(), getInfoArticles()]);
  const pendingQuotes = quotes.filter((quote) => quote.status !== "已处理").length;
  const processedQuotes = quotes.filter((quote) => quote.status === "已处理").length;
  const publishedNews = news.filter((article) => article.published).length;
  const publishedInfo = info.filter((article) => article.published).length;

  return (
    <AdminShell>
      <div className="toolbar">
        <h1>{t("后台概览", "Dashboard")}</h1>
        <AdminLogoutButton />
      </div>
      <div className="stats">
        <div className="stat">
          <b>{products.length}</b>
          <span>{t("产品数量", "Products")}</span>
        </div>
        <div className="stat">
          <b>{pendingQuotes}</b>
          <span>{t("待跟进询价", "Open inquiries")}</span>
        </div>
        <div className="stat">
          <b>{processedQuotes}</b>
          <span>{t("已处理询价", "Processed inquiries")}</span>
        </div>
        <div className="stat">
          <b>{publishedNews}</b>
          <span>{t("已发布新闻", "Published news")}</span>
        </div>
        <div className="stat">
          <b>{publishedInfo}</b>
          <span>{t("已发布资讯信息", "Published resources")}</span>
        </div>
      </div>
      <div className="grid" style={{ marginTop: 18 }}>
        <Link className="product-card" href="/admin/site">
          <h3>{t("首页管理", "Homepage")}</h3>
          <p>{t("修改品牌名、首页标题、首页描述、按钮和基础联系方式。", "Edit branding, homepage copy, buttons and contact details in both languages.")}</p>
        </Link>
        <Link className="product-card" href="/admin/products">
          <h3>{t("产品管理", "Products")}</h3>
          <p>{t("维护产品展示字段、分类、图片和详情内容。", "Manage specifications, categories, images and product descriptions.")}</p>
        </Link>
        <Link className="product-card" href="/admin/news">
          <h3>{t("新闻管理", "News")}</h3>
          <p>{t("发布公司新闻、活动动态和品牌内容。", "Publish company news, events and brand updates.")}</p>
        </Link>
        <Link className="product-card" href="/admin/info">
          <h3>{t("资讯信息管理", "Resources")}</h3>
          <p>{t("维护资讯信息分类、正文、封面图片和发布状态。", "Manage resource categories, articles, cover images and publication.")}</p>
        </Link>
        <Link className="product-card" href="/admin/about">
          <h3>{t("关于我们管理", "About us")}</h3>
          <p>{t("编辑关于我们页面的富文本内容。", "Edit the About page in both languages.")}</p>
        </Link>
        <Link className="product-card" href="/admin/contact">
          <h3>{t("联系我们管理", "Contact us")}</h3>
          <p>{t("编辑联系我们页面的富文本内容。", "Edit the Contact page in both languages.")}</p>
        </Link>
        <Link className="product-card" href="/admin/quotes">
          <h3>{t("询价管理", "Inquiries")}</h3>
          <p>{t("查看客户信息、产品清单、处理状态和销售备注。", "Review customer details, products, inquiry status and sales notes.")}</p>
        </Link>
        <div className="product-card">
          <h3>{t("站点品牌", "Website brand")}</h3>
          <p>{localizeSiteContent(site, locale).brandName}</p>
        </div>
      </div>
    </AdminShell>
  );
}
