import { SiteContentEditor } from "@/components/SiteContentEditor";
import type { SiteContent } from "@/lib/types";

export function ContactEditor({ initialSite }: { initialSite: SiteContent }) {
  return <SiteContentEditor initialSite={initialSite} section="contact" />;
}
