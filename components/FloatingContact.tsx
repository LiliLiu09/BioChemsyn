"use client";

import { Mail, Phone, QrCode } from "lucide-react";
import { usePathname } from "next/navigation";
import type { SiteContent } from "@/lib/types";
import { useLanguage } from "./LanguageProvider";
import { stripLocale } from "@/lib/i18n";

export function FloatingContact({ site }: { site: SiteContent }) {
  const pathname = usePathname();
  const { t } = useLanguage();

  if (stripLocale(pathname).startsWith("/admin")) {
    return null;
  }

  return (
    <aside className="floating-contact" aria-label={t("快速联系", "Quick contact")}>
      <div className="float-item">
        <Phone size={24} aria-hidden="true" />
        <div className="float-popover">
          <b>{t("电话", "Phone")}</b>
          <a href={`tel:${site.supportPhone}`}>{site.supportPhone}</a>
        </div>
      </div>
      <div className="float-item">
        <QrCode size={24} aria-hidden="true" />
        <div className="float-popover qr-popover">
          <b>{t("微信", "WeChat")}</b>
          {site.contactQrImage || site.aboutQrImage ? <img src={site.contactQrImage || site.aboutQrImage} alt={t("微信二维码", "WeChat QR code")} /> : <span>{t("暂无二维码", "QR code unavailable")}</span>}
        </div>
      </div>
      <div className="float-item">
        <Mail size={24} aria-hidden="true" />
        <div className="float-popover">
          <b>{t("邮箱", "Email")}</b>
          <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
        </div>
      </div>
    </aside>
  );
}
