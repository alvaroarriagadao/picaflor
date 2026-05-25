import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase-server";

const ADMIN_EMAIL = "alvaroarriagada101@gmail.com";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <>
      <Nav isAdmin={isAdmin} />
      <div className="mx-auto max-w-5xl px-5 py-8">{children}</div>
    </>
  );
}
