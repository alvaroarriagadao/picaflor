"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Planes — los IDs vienen de env vars (server → MP checkout route) ─────────
const PLANS = [
  {
    id: "plan_a" as const,
    interval: "month" as const,       // mapea a MP_PLAN_ID_MONTHLY en el server
    label: "Plan A",
    price: "—",                        // actualiza con el precio real de tu plan MP
    period: "/sem",
    note: null,
    badge: null,
  },
  {
    id: "plan_b" as const,
    interval: "year" as const,        // mapea a MP_PLAN_ID_YEARLY en el server
    label: "Plan B",
    price: "—",
    period: "/sem",
    note: "Mejor valor",
    badge: "Recomendado",
  },
];

const FREE_FEATURES = [
  "Ejercicio del día — siempre gratis",
  "5 ejercicios de la biblioteca",
  "Metrónomo de precisión Web Audio",
  "Afinador con micrófono",
];

const PRO_FEATURES = [
  "Todo lo gratuito, más:",
  "Biblioteca completa — todos los ejercicios",
  "Planificador diario de práctica",
  "Nuevos ejercicios cada mes",
  "Filtros avanzados sin límite",
  "Acceso a ejercicios de la comunidad",
  "Apoyas directamente al creador 🤝",
];

// ─── MP checkout ──────────────────────────────────────────────────────────────
async function goToMercadoPago(interval: "month" | "year") {
  const res = await fetch("/api/mercadopago/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ interval }),
  });
  const { url, error } = await res.json();
  if (error) throw new Error(error);
  window.location.href = url;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PreciosPage() {
  const [selected, setSelected] = useState<"plan_a" | "plan_b">("plan_b");
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState<string | null>(null);

  const plan = PLANS.find(p => p.id === selected)!;

  const handleMP = async () => {
    setErr(null);
    setLoading(true);
    try {
      await goToMercadoPago(plan.interval);
    } catch (e: any) {
      setErr(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Back */}
      <Link href="/biblioteca"
        className="mb-8 inline-flex items-center gap-1 text-sm text-stone-500 hover:text-ember transition">
        ← Volver
      </Link>

      {/* Hero */}
      <div className="mb-10 text-center">
        <p className="mb-3 text-4xl">◆</p>
        <h1 className="font-display text-4xl font-extrabold text-bone">
          Picaflor Pro
        </h1>
        <p className="mt-3 text-stone-400 text-lg max-w-sm mx-auto leading-relaxed">
          Practica más, progresa más rápido. Acceso completo a toda la biblioteca.
        </p>
      </div>

      {/* Free vs Pro comparison */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        {/* Free card */}
        <div className="rounded-2xl border border-smoke bg-ash/40 p-5">
          <p className="mb-1 font-display font-bold text-stone-400 text-sm uppercase tracking-wider">Gratis</p>
          <p className="font-display text-2xl font-extrabold text-bone mb-4">$0</p>
          <ul className="space-y-2">
            {FREE_FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-stone-400">
                <span className="text-stone-600 mt-0.5">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pro card */}
        <div className="rounded-2xl border border-ember/40 bg-ember/5 p-5 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-ember/10" />
          <p className="mb-1 font-display font-bold text-ember text-sm uppercase tracking-wider">Pro</p>
          <p className="font-display text-2xl font-extrabold text-bone mb-4">
            Suscripción<span className="text-sm font-normal text-stone-500 ml-1">recurrente</span>
          </p>
          <ul className="space-y-2">
            {PRO_FEATURES.map((f, i) => (
              <li key={i} className={`flex items-start gap-2 text-sm ${i === 0 ? "text-stone-500 italic" : "text-stone-200"}`}>
                {i > 0 && <span className="text-ember mt-0.5 shrink-0">✓</span>}
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Plan selector */}
      <div className="mb-6">
        <p className="mb-3 text-xs uppercase tracking-wider text-stone-500">Elige tu plan</p>
        <div className="grid grid-cols-2 gap-3">
          {PLANS.map(p => (
            <button key={p.id}
              onClick={() => setSelected(p.id)}
              className={`relative rounded-2xl border p-4 text-left transition-all ${
                selected === p.id
                  ? "border-ember/60 bg-ember/8 ring-1 ring-ember/30"
                  : "border-smoke bg-ash/40 hover:border-stone-600"
              }`}>
              {p.badge && (
                <span className="absolute -top-2.5 right-3 rounded-full bg-sage px-2 py-0.5 text-[10px] font-bold text-ink uppercase tracking-wider">
                  {p.badge}
                </span>
              )}
              <p className="font-display font-bold text-bone">{p.label}</p>
              {p.note && <p className="text-xs text-stone-500 mt-1">{p.note}</p>}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {err && (
        <div className="mb-4 rounded-xl border border-rust/40 bg-rust/10 px-4 py-3 text-sm text-rust">
          {err}
        </div>
      )}

      {/* CTA — MercadoPago */}
      <button onClick={handleMP} disabled={loading}
        className="group flex w-full items-center justify-between rounded-xl border border-[#009EE3]/30 bg-[#009EE3]/8 px-5 py-4 transition hover:border-[#009EE3]/60 hover:bg-[#009EE3]/12 disabled:opacity-50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#009EE3]/20">
            <svg className="h-5 w-5" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="16" fill="#009EE3" fillOpacity=".25"/>
              <text x="5" y="22" fontSize="14" fontWeight="bold" fill="#009EE3">MP</text>
            </svg>
          </div>
          <div className="text-left">
            <p className="font-display font-bold text-bone">Suscribirse con MercadoPago</p>
            <p className="text-xs text-stone-500 mt-0.5">Webpay · tarjetas chilenas · cuotas</p>
          </div>
        </div>
        <span className="text-[#009EE3] transition text-lg font-bold">
          {loading ? "…" : "→"}
        </span>
      </button>

      {/* Fine print */}
      <p className="mt-5 text-center text-xs text-stone-600 leading-relaxed">
        Suscripción recurrente · Cancela cuando quieras desde tu cuenta MercadoPago ·
        Sin contratos ni letra chica
      </p>
    </div>
  );
}
