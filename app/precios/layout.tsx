import { createClient } from "@/lib/supabase-server";
import { getUserPlan } from "@/lib/subscription";
import Nav from "@/components/Nav";

export default async function PreciosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const plan = await getUserPlan();
  const isAdmin =
    user?.email === "alvaro.arriagada101@gmail.com" ||
    user?.email === "alvaroarriagada101@gmail.com";

  return (
    <div className="min-h-screen bg-ink">
      <Nav isAdmin={isAdmin} isPro={plan === "pro"} />
      <main className="mx-auto max-w-4xl px-5 py-10">{children}</main>
    </div>
  );
}
