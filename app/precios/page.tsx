"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Pricing data ─────────────────────────────────────────────────────────────
// Prices shown here are display only. Actual amounts are set in Stripe / MP dashboards.
const PLANS = [
  {
    id: "monthly" as const,
    label: "Mensual",
    clp: "3.990",
    usd: "4",
    period: "/mes",
    note: null,
    badge: null,
  },
  {
    id: "yearly" as const,
    label: "Anual",
    clp: "29.990",
    usd: "32",
    period: "/año",
    note: "~$2.499 CLP/mes",
    badge: "Ahorra 37%",
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
  "Filtros avanzados y favoritos sin límite",
  "Acceso a ejercicios de la comunidad",
  "Apoyas directamente al creador 🤝",
];

// ─── Payment helpers ──────────────────────────────────────────────────────────
async function goToStripe(planId: "monthly" | "yearly") {
  const priceId =
    planId === "yearly"
      ? process.env.NEXT_PUBLIC_STRIPE_PRICE_YEARLY
      : process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY;

  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceId }),
  });
  const { url, error } = await res.json();
  if (error) throw new Error(error);
  window.location.href = url;
}

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
  const [selected, setSelected] = useState<"monthly" | "yearly">("yearly");
  const [loading, setLoading] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const plan = PLANS.find(p => p.id === selected)!;

  const handleStripe = async () => {
    setErr(null);
    setLoading("stripe");
    try {
      await goToStripe(selected);
    } catch (e: any) {
      setErr(e.message);
      setLoading(null);
    }
  };

  const handleMP = async () => {
    setErr(null);
    setLoading("mp");
    try {
      await goToMercadoPago(selected === "yearly" ? "year" : "month");
    } catch (e: any) {
      setErr(e.message);
      setLoading(null);
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
          Practica más, progresa más rápido. Acceso completo por menos de un café al mes.
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
            Desde $3.990 CLP<span className="text-sm font-normal text-stone-500">/mes</span>
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
              <p className="text-2xl font-display font-extrabold text-bone mt-1">
                ${p.clp}
                <span className="text-xs text-stone-500 font-normal"> CLP{p.period}</span>
              </p>
              {p.note && <p className="text-xs text-stone-500 mt-0.5">{p.note}</p>}
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

      {/* Payment buttons */}
      <div className="space-y-3">
        {/* Stripe — international cards */}
        <button onClick={handleStripe} disabled={!!loading}
          className="group flex w-full items-center justify-between rounded-xl border border-smoke bg-ash/60 px-5 py-4 transition hover:border-ember/50 hover:bg-ash disabled:opacity-50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#635BFF]/20">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="4" fill="#635BFF" fillOpacity=".15"/>
                <path d="M11.5 8c-1.7 0-2.8.9-2.8 2.2 0 1.5 1.1 2 2.3 2.4 1 .3 1.3.5 1.3.9 0 .5-.4.8-1.2.8-.9 0-1.7-.4-2.2-.9l-.8 1.4c.7.6 1.7 1 2.9 1 1.9 0 3-.9 3-2.3 0-1.5-1-2-2.2-2.4-1-.3-1.4-.5-1.4-.9 0-.4.3-.7 1-.7.8 0 1.5.3 2 .7l.8-1.4C13.5 8.4 12.6 8 11.5 8z" fill="#635BFF"/>
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium text-bone text-sm">Pagar con tarjeta internacional</p>
              <p className="text-xs text-stone-500">Visa, Mastercard, Amex — vía Stripe</p>
            </div>
          </div>
          <span className="text-stone-500 group-hover:text-ember transition text-sm">
            {loading === "stripe" ? "Redirigiendo…" : "→"}
          </span>
        </button>

        {/* MercadoPago — Chile */}
        <button onClick={handleMP} disabled={!!loading}
          className="group flex w-full items-center justify-between rounded-xl border border-smoke bg-ash/60 px-5 py-4 transition hover:border-[#009EE3]/40 hover:bg-ash disabled:opacity-50">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#009EE3]/15">
              <svg className="h-5 w-5" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="16" fill="#009EE3" fillOpacity=".2"/>
                <text x="5" y="22" fontSize="14" fontWeight="bold" fill="#009EE3">MP</text>
              </svg>
            </div>
            <div className="text-left">
              <p className="font-medium text-bone text-sm">Pagar con MercadoPago</p>
              <p className="text-xs text-stone-500">Webpay, tarjetas chilenas, cuotas</p>
            </div>
          </div>
          <span className="text-stone-500 group-hover:text-[#009EE3] transition text-sm">
            {loading === "mp" ? "Redirigiendo…" : "→"}
          </span>
        </button>
      </div>

      {/* Fine print */}
      <p className="mt-5 text-center text-xs text-stone-600 leading-relaxed">
        Suscripción recurrente · Cancela cuando quieras desde tu perfil ·
        Sin contratos ni letra chica
      </p>
    </div>
  );
}
