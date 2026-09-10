import { AdminLoginForm } from "@/components/AdminLoginForm";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getLocale } from "@/lib/locale-server";
import { translate } from "@/lib/i18n";

export default async function AdminLoginPage() {
  const locale = await getLocale();
  return (
    <main className="main">
      <div className="admin-language-toolbar"><LanguageSwitcher /></div>
      <div className="login-wrap">
        <div className="hero-copy">
          <h1>{translate(locale, "内容管理后台", "Content management")}</h1>
          <p>{translate(locale, "登录后可以维护中英文首页文案、公司信息、产品、新闻资讯和询价记录。", "Sign in to manage Chinese and English website content, company information, products, articles and inquiries.")}</p>
        </div>
        <AdminLoginForm />
      </div>
    </main>
  );
}
