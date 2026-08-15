import { BadgeCheck, FlaskConical, Headset, Mail, MapPin, Phone, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";
import { getInfoArticles, getNewsArticles, getProducts } from "@/lib/cms";
import type { SiteContent } from "@/lib/types";

export async function Footer({ site }: { site: SiteContent }) {
  const [products, news, info] = await Promise.all([getProducts(), getNewsArticles(), getInfoArticles()]);
  const categories = Array.from(new Set(products.map((product) => product.category || "未分类"))).slice(0, 6);
  const latestNews = news
    .filter((article) => article.published)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 3);
  const latestInfo = info
    .filter((article) => article.published)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 3);

  return (
    <footer className="site-footer">
      {site.notice && <div className="footer-notice">{site.notice}</div>}

      <div className="footer-promises" aria-label="服务保障">
        <div>
          <span className="footer-icon">
            <FlaskConical size={26} aria-hidden="true" />
          </span>
          <b>产品全面</b>
          <span>20000+ 产品</span>
        </div>
        <div>
          <span className="footer-icon">
            <ShieldCheck size={26} aria-hidden="true" />
          </span>
          <b>优质采购方案</b>
          <span>按需求确认规格与报价</span>
        </div>
        <div>
          <span className="footer-icon">
            <BadgeCheck size={26} aria-hidden="true" />
          </span>
          <b>正品保障</b>
          <span>支持资料与质检信息维护</span>
        </div>
        <div>
          <span className="footer-icon">
            <Truck size={26} aria-hidden="true" />
          </span>
          <b>快速响应</b>
          <span>提交询价后销售跟进</span>
        </div>
        <div>
          <span className="footer-icon">
            <Headset size={26} aria-hidden="true" />
          </span>
          <b>售后支持</b>
          <span>电话与邮箱持续服务</span>
        </div>
      </div>

      <div className="footer-main">
        <section className="footer-contact" aria-label="联系方式">
          <b>{site.companyName}</b>
          <p>{site.tagline}</p>
          <a href={`tel:${site.supportPhone}`}>
            <Phone size={18} aria-hidden="true" />
            {site.supportPhone}
          </a>
          <a href={`mailto:${site.contactEmail}`}>
            <Mail size={18} aria-hidden="true" />
            {site.contactEmail}
          </a>
          <span>
            <MapPin size={18} aria-hidden="true" />
            {site.address}
          </span>
        </section>

        <nav className="footer-column" aria-label="订购指南">
          <b>订购指南</b>
          <Link href="/products">如何订购</Link>
          <Link href="/products">产品检索</Link>
          <Link href="/cart">提交询价</Link>
          <Link href="/contact">付款与配送咨询</Link>
        </nav>

        <nav className="footer-column" aria-label="服务支持">
          <b>服务支持</b>
          <Link href="/contact">客户服务</Link>
          <Link href="/contact">技术支持</Link>
          <Link href="/info">采购说明</Link>
          <Link href="/news">公司动态</Link>
        </nav>

        <nav className="footer-column" aria-label="产品分类">
          <b>产品</b>
          <Link href="/products">全部产品</Link>
          {categories.map((category) => (
            <Link href={`/products?category=${encodeURIComponent(category)}`} key={category}>
              {category}
            </Link>
          ))}
        </nav>

        <nav className="footer-column" aria-label="新闻资讯">
          <b>新闻资讯</b>
          <Link href="/news">新闻中心</Link>
          <Link href="/info">资讯信息</Link>
          {latestNews.slice(0, 1).map((article) => (
            <Link href={`/news/${article.slug}`} key={article.id}>
              {article.title}
            </Link>
          ))}
          {latestInfo.slice(0, 1).map((article) => (
            <Link href={`/info/${article.slug}`} key={article.id}>
              {article.title}
            </Link>
          ))}
        </nav>

        <nav className="footer-column" aria-label="关于我们">
          <b>关于我们</b>
          <Link href="/about">公司简介</Link>
          <Link href="/contact">联系我们</Link>
          <Link href="/products">产品中心</Link>
          <Link href="/cart">询价车</Link>
        </nav>
      </div>
    </footer>
  );
}
