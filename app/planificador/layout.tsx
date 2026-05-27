import Nav from "@/components/Nav";
import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { getUserPlan } from "@/lib/subscription";

const ADMIN_EMAIL = "alvaro.arriagada101@gmail.com";

export default async function PlanificadorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [plan] = await Promise.all([getUserPlan()]);
  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <>
      <Nav isAdmin={isAdmin} />
      <div className="mx-auto max-w-2xl px-5 py-8">
        {plan === "pro" ? (
          children
        ) : (
          /* ── Free-tier gate ─────────────────────────────────────── */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="mb-4 text-5xl">📅</p>
            <h2 className="font-display text-2xl font-extrabold text-bone mb-2">
              Planificador — Pro
            </h2>
            <p className="text-stone-400 mb-6 max-w-sm leading-relaxed">
              Organiza tu práctica diaria, fija metas y sigue tu progreso
              semanal. Disponible con Picaflor Pro.
            </p>
            <Link
              href="/precios"
              className="rounded-xl bg-ember px-6 py-3 font-display font-bold uppercase tracking-wider text-ink transition hover:bg-amber"
            >
              Ver planes y precios →
            </Link>
            <Link
              href="/practica"
              className="mt-4 text-sm text-stone-500 hover:text-stone-300 transition"
            >
              Volver al ejercicio del día
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
