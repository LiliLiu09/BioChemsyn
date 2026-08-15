"use client";

import { Mail, Phone, QrCode } from "lucide-react";
import { usePathname } from "next/navigation";
import type { SiteContent } from "@/lib/types";

export function FloatingContact({ site }: { site: SiteContent }) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <aside className="floating-contact" aria-label="快速联系">
      <div className="float-item">
        <Phone size={24} aria-hidden="true" />
        <div className="float-popover">
          <b>电话</b>
          <a href={`tel:${site.supportPhone}`}>{site.supportPhone}</a>
        </div>
      </div>
      <div className="float-item">
        <QrCode size={24} aria-hidden="true" />
        <div className="float-popover qr-popover">
          <b>微信</b>
          {site.contactQrImage || site.aboutQrImage ? <img src={site.contactQrImage || site.aboutQrImage} alt="微信二维码" /> : <span>暂无二维码</span>}
        </div>
      </div>
      <div className="float-item">
        <Mail size={24} aria-hidden="true" />
        <div className="float-popover">
          <b>邮箱</b>
          <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>
        </div>
      </div>
    </aside>
  );
}
