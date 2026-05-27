import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import AdminSidebar from "./AdminSidebar";

const ADMIN_EMAIL = "alvaro.arriagada101@gmail.com";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) redirect("/practica");

  const { count: pendingCount } = await supabase
    .from("exercise_submissions")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <div className="flex min-h-screen">
      <AdminSidebar pendingCount={pendingCount ?? 0} />
      <main className="flex-1 min-w-0 px-6 py-8 lg:px-10">
        {children}
      </main>
    </div>
  );
}
