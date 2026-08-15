import type { SiteContent } from "@/lib/types";

export function Footer({ site }: { site: SiteContent }) {
  return (
    <footer className="site-footer">
      <div>
        <b>{site.companyName}</b>
        <span>{site.tagline}</span>
      </div>
      <div>
        <span>{site.contactEmail}</span>
        <span>{site.address}</span>
      </div>
    </footer>
  );
}
