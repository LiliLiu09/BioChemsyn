import { getLocale } from "@/lib/locale-server";
import { localizePath } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/adminAuth";
import { getNewsArticles } from "@/lib/cms";
import { AdminShell } from "@/components/AdminShell";
import { NewsEditor } from "@/components/NewsEditor";

export default async function AdminNewsPage() {
  if (!(await isAdminAuthed())) {
    redirect(localizePath("/admin/login", await getLocale()));
  }

  const news = await getNewsArticles();

  return (
    <AdminShell>
      <NewsEditor initialNews={news} />
    </AdminShell>
  );
}
