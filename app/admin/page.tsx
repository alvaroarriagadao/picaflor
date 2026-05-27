import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase      = await createClient();
  const adminSupabase = createAdminClient();

  const [
    { count: totalExercises },
    { count: pendingReviews },
    { count: totalSubmissions },
    { count: proUsers },
    usersResult,
  ] = await Promise.all([
    supabase.from("exercises").select("*", { count: "exact", head: true }),
    supabase.from("exercise_submissions").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("exercise_submissions").select("*", { count: "exact", head: true }),
    supabase.from("user_subscriptions").select("*", { count: "exact", head: true }).eq("plan", "pro"),
    adminSupabase.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const totalUsers = usersResult.data?.users?.length ?? 0;

  const stats = [
    { label: "Usuarios registrados", value: totalUsers,            icon: "👥", href: "/admin/usuarios",   color: "ember" },
    { label: "Usuarios Pro",          value: proUsers ?? 0,         icon: "◆",  href: "/admin/usuarios",   color: "amber" },
    { label: "Ejercicios",            value: totalExercises ?? 0,   icon: "🎸", href: "/admin/ejercicios", color: "sage"  },
    { label: "Revisiones pendientes", value: pendingReviews ?? 0,   icon: "✦",  href: "/admin/revisiones", color: pendingReviews ? "rust" : "stone" },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold text-bone">Dashboard</h1>
        <p className="mt-1 text-stone-500 text-sm">Panel de administración · Pickaflor</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map(s => (
          <Link key={s.label} href={s.href}
            className={`group rounded-2xl border p-5 transition hover:scale-[1.02] ${
              s.color === "ember" ? "border-ember/30 bg-ember/5" :
              s.color === "amber" ? "border-amber/30 bg-amber/5" :
              s.color === "sage"  ? "border-sage/30 bg-sage/5"   :
              s.color === "rust"  ? "border-rust/40 bg-rust/8"   :
              "border-smoke bg-ash/40"
            }`}>
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{s.icon}</span>
            </div>
            <p className={`font-display text-3xl font-extrabold ${
              s.color === "ember" ? "text-ember" :
              s.color === "amber" ? "text-amber" :
              s.color === "sage"  ? "text-sage"  :
              s.color === "rust"  ? "text-rust"  :
              "text-stone-400"
            }`}>{s.value}</p>
            <p className="text-xs text-stone-500 mt-1 leading-snug">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <h2 className="mb-4 font-display text-lg font-bold text-stone-400 uppercase tracking-wider text-xs">
        Acciones rápidas
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink
          href="/admin/usuarios"
          icon="👥"
          title="Gestionar usuarios"
          desc="Asignar o quitar Pro, ver planes, reset de contraseña"
        />
        <QuickLink
          href="/admin/ejercicios/nuevo"
          icon="+"
          title="Nuevo ejercicio"
          desc="Agregar ejercicio directamente a la biblioteca"
        />
        <QuickLink
          href="/admin/revisiones"
          icon="✦"
          title={`Revisiones${(pendingReviews ?? 0) > 0 ? ` (${pendingReviews} pendientes)` : ""}`}
          desc="Aprobar o rechazar aportes de la comunidad"
          highlight={(pendingReviews ?? 0) > 0}
        />
        <QuickLink
          href="/admin/ejercicios"
          icon="🎸"
          title="Biblioteca completa"
          desc={`${totalExercises ?? 0} ejercicios · editar, eliminar`}
        />
      </div>

      {/* Community stats */}
      <div className="mt-10 rounded-2xl border border-smoke bg-ash/30 p-5">
        <h2 className="font-display font-bold text-bone mb-3">Comunidad</h2>
        <div className="flex flex-wrap gap-6 text-sm">
          <div>
            <p className="text-2xl font-display font-extrabold text-stone-300">{totalSubmissions ?? 0}</p>
            <p className="text-xs text-stone-500 mt-0.5">ejercicios enviados en total</p>
          </div>
          <div>
            <p className="text-2xl font-display font-extrabold text-sage">{(totalSubmissions ?? 0) - (pendingReviews ?? 0)}</p>
            <p className="text-xs text-stone-500 mt-0.5">revisados</p>
          </div>
          {(pendingReviews ?? 0) > 0 && (
            <div>
              <p className="text-2xl font-display font-extrabold text-amber">{pendingReviews}</p>
              <p className="text-xs text-stone-500 mt-0.5">esperando revisión</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickLink({ href, icon, title, desc, highlight = false }: {
  href: string; icon: string; title: string; desc: string; highlight?: boolean;
}) {
  return (
    <Link href={href}
      className={`group rounded-2xl border p-4 transition hover:border-ember/40 hover:bg-ash/60 ${
        highlight ? "border-amber/40 bg-amber/5" : "border-smoke bg-ash/30"
      }`}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-lg">{icon}</span>
        <p className={`font-display font-bold text-sm ${highlight ? "text-amber" : "text-bone"}`}>{title}</p>
      </div>
      <p className="text-xs text-stone-500 leading-relaxed">{desc}</p>
    </Link>
  );
}
