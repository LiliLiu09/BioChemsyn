import { redirect } from "next/navigation";
import { isAdminAuthed } from "@/lib/adminAuth";
import { getProducts } from "@/lib/cms";
import { AdminShell } from "@/components/AdminShell";
import { ProductEditor } from "@/components/ProductEditor";

export default async function AdminProductsPage() {
  if (!(await isAdminAuthed())) {
    redirect("/admin/login");
  }

  const products = await getProducts({ includeInactive: true });

  return (
    <AdminShell>
      <ProductEditor initialProducts={products} />
    </AdminShell>
  );
}
