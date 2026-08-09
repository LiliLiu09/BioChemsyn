import { AdminLoginForm } from "@/components/AdminLoginForm";

export default function AdminLoginPage() {
  return (
    <main className="main">
      <div className="login-wrap">
        <div className="hero-copy">
          <h1>轻量 CMS 后台</h1>
          <p>登录后可以维护首页文案、公司信息和产品数据。当前版本使用 JSON 文件保存内容，不需要数据库。</p>
        </div>
        <AdminLoginForm />
      </div>
    </main>
  );
}
