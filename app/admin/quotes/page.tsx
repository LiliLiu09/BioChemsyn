import { getLocale } from "@/lib/locale-server";
import { localizePath } from "@/lib/i18n";
import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/adminAuth";
import { getQuotes } from "@/lib/cms";
import { AdminShell } from "@/components/AdminShell";
import { QuoteManager } from "@/components/QuoteManager";

export default async function AdminQuotesPage() {
  if (!(await isAdminAuthed())) {
    redirect(localizePath("/admin/login", await getLocale()));
  }

  const quotes = await getQuotes();

  return (
    <AdminShell>
      <QuoteManager initialQuotes={quotes} />
    </AdminShell>
  );
}
