import Link from "@/components/LocaleLink";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getLocale } from "@/lib/locale-server";
import { translate } from "@/lib/i18n";

export default async function NotFound() {
  const locale = await getLocale();
  return <main className="main global-search-page">
    <LanguageSwitcher />
    <h1>{translate(locale, "页面未找到", "Page not found")}</h1>
    <p>{translate(locale, "页面不存在或尚未发布。", "This page does not exist or has not been published.")}</p>
    <Link className="btn primary" href="/">{translate(locale, "返回首页", "Back to home")}</Link>
  </main>;
}
