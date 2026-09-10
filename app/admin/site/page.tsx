import { getLocale } from "@/lib/locale-server";
import { localizePath } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/adminAuth";
import { getSiteContent } from "@/lib/cms";
import { AdminShell } from "@/components/AdminShell";
import { SiteEditor } from "@/components/SiteEditor";

export default async function AdminSitePage() {
  if (!(await isAdminAuthed())) {
    redirect(localizePath("/admin/login", await getLocale()));
  }

  const site = await getSiteContent();

  return (
    <AdminShell>
      <SiteEditor initialSite={site} />
    </AdminShell>
  );
}
