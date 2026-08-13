import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/adminAuth";
import { getSiteContent } from "@/lib/cms";
import { AdminShell } from "@/components/AdminShell";
import { ContactEditor } from "@/components/ContactEditor";

export default async function AdminContactPage() {
  if (!(await isAdminAuthed())) {
    redirect("/admin/login");
  }

  const site = await getSiteContent();

  return (
    <AdminShell>
      <ContactEditor initialSite={site} />
    </AdminShell>
  );
}
