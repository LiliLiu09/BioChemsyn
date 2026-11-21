import { localizePath, stripLocale } from "./i18n";

// Only known navigation aliases have replacements. Unknown old product/article IDs
// stay 404 rather than sending unrelated pages to the homepage (a soft 404).
const navigationAliases = new Map([
  ["/products-全部产品", "/products"], ["/products-产品检索", "/products"],
  ["/products-如何订购", "/products"],
  ["/news-新闻中心", "/news"], ["/news-News", "/en/news"],
  ["/info-资讯信息", "/info"], ["/info-Resources", "/en/info"], ["/info-采购说明", "/info"],
  ["/about-公司简介", "/about"],
  ["/contact-联系我们", "/contact"], ["/contact-客户服务", "/contact"],
  ["/contact-技术支持", "/contact"], ["/contact-付款与配送咨询", "/contact"],
  ["/cart-提交询价", "/cart"]
]);

export function legacyDestination(path: string, search = ""): string | undefined {
  try {
    const decoded = decodeURIComponent(path);
    const english = decoded === "/en" || decoded.startsWith("/en/");
    const bare = stripLocale(decoded);
    const alias = navigationAliases.get(bare);
    if (alias) return english ? localizePath(alias, "en") : alias;
    if (bare.toLowerCase() === "/default.aspx") return localizePath("/", english ? "en" : "zh");
    if (bare.toLowerCase() === "/product.aspx" && !search) return localizePath("/products", english ? "en" : "zh");
  } catch {
    // Malformed percent encodings do not identify a known replacement.
  }
  return undefined;
}
