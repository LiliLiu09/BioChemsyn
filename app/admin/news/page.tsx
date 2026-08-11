import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/adminAuth";
import { getNewsArticles } from "@/lib/cms";
import { AdminShell } from "@/components/AdminShell";
import { NewsEditor } from "@/components/NewsEditor";

export default async function AdminNewsPage() {
  if (!(await isAdminAuthed())) {
    redirect("/admin/login");
  }

  const news = await getNewsArticles();

  return (
    <AdminShell>
      <NewsEditor initialNews={news} />
    </AdminShell>
  );
}
