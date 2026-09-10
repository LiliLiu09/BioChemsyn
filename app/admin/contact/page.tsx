import { getLocale } from "@/lib/locale-server";
import { localizePath } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/adminAuth";
import { getSiteContent } from "@/lib/cms";
import { AdminShell } from "@/components/AdminShell";
import { ContactEditor } from "@/components/ContactEditor";

export default async function AdminContactPage() {
  if (!(await isAdminAuthed())) {
    redirect(localizePath("/admin/login", await getLocale()));
  }

  const site = await getSiteContent();

  return (
    <AdminShell>
      <ContactEditor initialSite={site} />
    </AdminShell>
  );
}
