import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/adminAuth";
import { getSiteContent } from "@/lib/cms";
import { AdminShell } from "@/components/AdminShell";
import { AboutEditor } from "@/components/AboutEditor";

export default async function AdminAboutPage() {
  if (!(await isAdminAuthed())) {
    redirect("/admin/login");
  }

  const site = await getSiteContent();

  return (
    <AdminShell>
      <AboutEditor initialSite={site} />
    </AdminShell>
  );
}
