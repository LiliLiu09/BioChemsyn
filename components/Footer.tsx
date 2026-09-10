import { BadgeCheck, FlaskConical, Headset, Mail, MapPin, Phone, ShieldCheck, Truck } from "lucide-react";
import Link from "@/components/LocaleLink";
import { getProducts } from "@/lib/cms";
import { getLocale } from "@/lib/locale-server";
import { translate } from "@/lib/i18n";
import { isProductAvailable, localizeProduct } from "@/lib/content-locale";
import type { SiteContent } from "@/lib/types";

export async function Footer({ site }: { site: SiteContent }) {
  const locale = await getLocale();
  const t = (zh: string, en: string) => translate(locale, zh, en);
  const products = (await getProducts()).filter((product) => isProductAvailable(product, locale)).map((product) => localizeProduct(product, locale));
  const categories = Array.from(new Map(products.map((product) => [product.categoryKey || product.category, product.category || t("未分类", "Uncategorized")])).entries()).slice(0, 6);
  const qrImage = site.contactQrImage || site.aboutQrImage;
  const promises = [
    { Icon: FlaskConical, title: t("产品全面", "Extensive range"), detail: t("20000+ 产品", "20,000+ products") },
    { Icon: ShieldCheck, title: t("优质采购方案", "Procurement support"), detail: t("按需求确认规格与报价", "Specifications and quotes to suit your needs") },
    { Icon: BadgeCheck, title: t("正品保障", "Product assurance"), detail: t("支持资料与质检信息维护", "Product documentation and quality information") },
    { Icon: Truck, title: t("快速响应", "Responsive service"), detail: t("提交询价后销售跟进", "Sales follow-up after your inquiry") },
    { Icon: Headset, title: t("售后支持", "After-sales support"), detail: t("电话与邮箱持续服务", "Ongoing support by phone and email") }
  ];
  const columns = [
    { title: t("订购指南", "Ordering"), links: [
      ["/products", t("如何订购", "How to order")], ["/products", t("产品检索", "Find products")],
      ["/cart", t("提交询价", "Request a quote")], ["/contact", t("付款与配送咨询", "Payment and delivery")]
    ] },
    { title: t("服务支持", "Support"), links: [
      ["/contact", t("客户服务", "Customer service")], ["/contact", t("技术支持", "Technical support")], ["/info", t("采购说明", "Purchasing information")]
    ] },
    { title: t("产品", "Products"), links: [
      ["/products", t("全部产品", "All products")], ...categories.map(([key, label]) => [`/products?category=${encodeURIComponent(key)}`, label])
    ] },
    { title: t("新闻资讯", "News & resources"), links: [
      ["/news", t("新闻中心", "News")], ["/info", t("资讯信息", "Resources")]
    ] },
    { title: t("关于我们", "About"), links: [
      ["/about", t("公司简介", "Company profile")], ["/contact", t("联系我们", "Contact us")]
    ] }
  ];
  return (
    <footer className="site-footer">
      {site.notice && <div className="footer-notice">{site.notice}</div>}
      <div className="footer-promises" aria-label={t("服务保障", "Our services")}>
        {promises.map(({ Icon, title, detail }) => <div key={title}>
          <span className="footer-icon"><Icon size={26} aria-hidden="true" /></span><b>{title}</b><span>{detail}</span>
        </div>)}
      </div>
      <div className="footer-main">
        <section className="footer-contact" aria-label={t("联系方式", "Contact details")}>
          <b>{site.companyName}</b><p>{site.tagline}</p>
          <a href={`tel:${site.supportPhone}`}><Phone size={18} aria-hidden="true" />{site.supportPhone}</a>
          <a href={`mailto:${site.contactEmail}`}><Mail size={18} aria-hidden="true" />{site.contactEmail}</a>
          <span><MapPin size={18} aria-hidden="true" />{site.address}</span>
        </section>
        {columns.map((column) => <nav className="footer-column" key={column.title} aria-label={column.title}>
          <b>{column.title}</b>
          {column.links.map(([href, label]) => <Link key={`${href}-${label}`} href={href}>{label}</Link>)}
        </nav>)}
        <section className="footer-qr" aria-label={t("公司二维码", "Company QR code")}>
          <b>{t("公司二维码", "Company QR code")}</b>
          {qrImage ? <img src={qrImage} alt={t("公司二维码", "Company QR code")} /> : <span>{t("暂无二维码", "QR code unavailable")}</span>}
        </section>
      </div>
    </footer>
  );
}
