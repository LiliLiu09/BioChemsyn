import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/adminAuth";
import { getSiteContent } from "@/lib/cms";
import { AdminShell } from "@/components/AdminShell";
import { SiteEditor } from "@/components/SiteEditor";

export default async function AdminSitePage() {
  if (!(await isAdminAuthed())) {
    redirect("/admin/login");
  }

  const site = await getSiteContent();

  return (
    <AdminShell>
      <SiteEditor initialSite={site} />
    </AdminShell>
  );
}
