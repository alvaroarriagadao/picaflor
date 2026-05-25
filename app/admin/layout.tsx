import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

const ADMIN_EMAIL = "alvaroarriagada101@gmail.com";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect("/practica");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <span className="text-ember">◆</span>
        <span className="font-display text-sm uppercase tracking-widest text-stone-500">
          Admin · Picaflor
        </span>
      </div>
      {children}
    </div>
  );
}
