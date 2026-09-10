import { getLocale } from "@/lib/locale-server";
import { localizePath } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/adminAuth";
import { getSiteContent } from "@/lib/cms";
import { AdminShell } from "@/components/AdminShell";
import { AboutEditor } from "@/components/AboutEditor";

export default async function AdminAboutPage() {
  if (!(await isAdminAuthed())) {
    redirect(localizePath("/admin/login", await getLocale()));
  }

  const site = await getSiteContent();

  return (
    <AdminShell>
      <AboutEditor initialSite={site} />
    </AdminShell>
  );
}
