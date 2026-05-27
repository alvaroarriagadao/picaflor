import Nav from "@/components/Nav";
import { createClient } from "@/lib/supabase-server";
import { getUserPlan } from "@/lib/subscription";

const ADMIN_EMAIL = "alvaro.arriagada101@gmail.com";

export default async function ComunidadLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const plan = await getUserPlan();
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <>
      <Nav isAdmin={isAdmin} isPro={plan === "pro"} />
      {children}
    </>
  );
}
