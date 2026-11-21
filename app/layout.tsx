import type { Metadata } from "next";
import { FloatingContact } from "@/components/FloatingContact";
import { getSiteContent } from "@/lib/cms";
import { headers } from "next/headers";
import { LanguageProvider } from "@/components/LanguageProvider";
import { getLocale } from "@/lib/locale-server";
import { translate } from "@/lib/i18n";
import { pageMetadata, siteOrigin } from "@/lib/seo";
import { localizeSiteContent } from "@/lib/content-locale";
import { PageViewTracker } from "@/components/PageViewTracker";
import "./globals.css";
import "./i18n.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const path = (await headers()).get("x-site-path") || "/";
  return {
    metadataBase: new URL(siteOrigin),
    ...pageMetadata(path, locale,
      translate(locale, "凯森斯生物 KASONS 科研试剂与化学品产品库", "KASONS | Research Reagents & Chemicals"),
      translate(locale, "凯森斯生物 KASONS 面向科研试剂、标准品与化学品采购的 B2B 产品展示、搜索与询价网站", "Browse research reagents, reference standards and chemicals. Search product specifications and request a quotation from KASONS.")),
    ...(path.startsWith("/admin") || path === "/search" || path === "/cart" ? { robots: { index: false, follow: false } } : {})
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  const site = localizeSiteContent(await getSiteContent(), locale);

  return (
    <html lang={locale === "en" ? "en" : "zh-CN"}>
      <body>
        <LanguageProvider locale={locale}>
          <PageViewTracker />
          {children}
          <FloatingContact site={site} />
        </LanguageProvider>
      </body>
    </html>
  );
}
