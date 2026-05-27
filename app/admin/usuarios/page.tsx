import { createAdminClient } from "@/lib/supabase-admin";
import UserRow from "./UserRow";

export const dynamic = "force-dynamic";

const ADMIN_EMAIL = "alvaro.arriagada101@gmail.com";

export default async function UsuariosPage() {
  const admin = createAdminClient();

  // Fetch all users + subscriptions + contribution counts in parallel
  const [usersResult, subsResult, contribResult] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from("user_subscriptions").select("user_id, plan, payment_provider, subscription_status, current_period_end"),
    admin.from("exercise_submissions").select("submitter_email").eq("status", "approved"),
  ]);

  const users        = usersResult.data?.users ?? [];
  const subs         = subsResult.data ?? [];
  const approvedSubs = contribResult.data ?? [];

  // Build contribution count map by email
  const contribByEmail: Record<string, number> = {};
  approvedSubs.forEach(s => {
    if (s.submitter_email) contribByEmail[s.submitter_email] = (contribByEmail[s.submitter_email] ?? 0) + 1;
  });

  // Build subscription map by user_id
  const subMap: Record<string, { plan: string; provider: string | null }> = {};
  subs.forEach(s => {
    const periodEnd = (s as any).current_period_end;
    const isActive  = !periodEnd || new Date(periodEnd) > new Date();
    subMap[s.user_id] = {
      plan:     s.plan === "pro" && isActive ? "pro" : "free",
      provider: s.payment_provider ?? null,
    };
  });

  // Sort: admins first, then Pro, then Free, alphabetical within each group
  const enriched = users.map(u => ({
    id:                u.id,
    email:             u.email ?? "(sin email)",
    created_at:        u.created_at,
    isAdmin:           u.email === ADMIN_EMAIL,
    plan:              (u.email === ADMIN_EMAIL ? "pro" : subMap[u.id]?.plan ?? "free") as "free" | "pro",
    provider:          u.email === ADMIN_EMAIL ? "admin" : subMap[u.id]?.provider ?? null,
    contributionCount: contribByEmail[u.email ?? ""] ?? 0,
  }));

  enriched.sort((a, b) => {
    if (a.isAdmin !== b.isAdmin) return a.isAdmin ? -1 : 1;
    if (a.plan !== b.plan)       return a.plan === "pro" ? -1 : 1;
    return a.email.localeCompare(b.email);
  });

  const proCount  = enriched.filter(u => u.plan === "pro").length;
  const freeCount = enriched.filter(u => u.plan === "free").length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-bone">Usuarios</h1>
          <p className="mt-1 text-stone-500 text-sm">
            {enriched.length} usuarios · {proCount} Pro · {freeCount} Free
          </p>
        </div>
        {/* Summary badges */}
        <div className="flex gap-3">
          <div className="rounded-xl border border-amber/30 bg-amber/5 px-4 py-2 text-center">
            <p className="font-display text-xl font-extrabold text-amber">{proCount}</p>
            <p className="text-[10px] uppercase tracking-wider text-stone-500">Pro</p>
          </div>
          <div className="rounded-xl border border-smoke bg-ash/40 px-4 py-2 text-center">
            <p className="font-display text-xl font-extrabold text-stone-400">{freeCount}</p>
            <p className="text-[10px] uppercase tracking-wider text-stone-500">Free</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 rounded-xl border border-smoke/50 bg-ash/20 px-4 py-3 text-xs text-stone-500 leading-relaxed">
        <strong className="text-stone-400">Asignar Pro</strong> — acceso completo sin pago, sin caducidad. ·
        <strong className="text-stone-400"> Reset</strong> — envía email de cambio de contraseña al usuario. ·
        <strong className="text-stone-400"> ×</strong> — elimina la cuenta definitivamente.
      </div>

      {/* Users list */}
      <div className="space-y-2">
        {enriched.map(u => (
          <UserRow key={u.id} user={u} />
        ))}
      </div>
    </div>
  );
}
