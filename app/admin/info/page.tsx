import { getLocale } from "@/lib/locale-server";
import { localizePath } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/adminAuth";
import { getInfoArticles } from "@/lib/cms";
import { AdminShell } from "@/components/AdminShell";
import { InfoEditor } from "@/components/InfoEditor";

export default async function AdminInfoPage() {
  if (!(await isAdminAuthed())) {
    redirect(localizePath("/admin/login", await getLocale()));
  }

  const info = await getInfoArticles();

  return (
    <AdminShell>
      <InfoEditor initialInfo={info} />
    </AdminShell>
  );
}
