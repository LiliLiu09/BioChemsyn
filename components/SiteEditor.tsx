import { SiteContentEditor } from "@/components/SiteContentEditor";
import type { SiteContent } from "@/lib/types";

export function SiteEditor({ initialSite }: { initialSite: SiteContent }) {
  return <SiteContentEditor initialSite={initialSite} section="site" />;
}
