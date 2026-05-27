"use client";

import { useState } from "react";
import Link from "next/link";

interface MPPlanInfo {
  id: string;
  reason: string;
  auto_recurring: {
    frequency: number;
    frequency_type: string;
    transaction_amount: number;
    currency_id: string;
  };
}

interface Props {
  planA: MPPlanInfo | null;
  planB: MPPlanInfo | null;
}

function freqLabel(ft: string): string {
  if (ft === "weeks")  return "/semana";
  if (ft === "months") return "/mes";
  if (ft === "days")   return "/día";
  return `/${ft}`;
}

function formatAmount(amount: number, currency: string) {
  if (currency === "CLP") return `$${amount.toLocaleString("es-CL")}`;
  return `${currency} ${amount}`;
}

const FREE_FEATURES = [
  "Ejercicio del día — siempre gratis",
  "7 ejercicios de la biblioteca",
  "Metrónomo Web Audio de precisión",
  "Afinador con micrófono",
];

const PRO_FEATURES = [
  "Todo lo gratuito, más:",
  "Biblioteca completa — todos los ejercicios",
  "Planificador mensual de práctica",
  "Filtros avanzados sin límite",
  "Acceso a todos los aportes de la comunidad",
  "Apoyas directamente al creador 🤝",
];

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

export default function PreciosClient({ planA, planB }: Props) {
  const [selected, setSelected] = useState<"a" | "b">("b");
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState<string | null>(null);

  const plan = selected === "a" ? planA : planB;

  const handleMP = async () => {
    setErr(null);
    setLoading(true);
    try {
      await goToMercadoPago(selected === "a" ? "month" : "year");
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
        <h1 className="font-display text-4xl font-extrabold text-bone">Pickaflor Pro</h1>
        <p className="mt-3 text-stone-400 text-lg max-w-sm mx-auto leading-relaxed">
          Practica más, progresa más rápido. Acceso completo por menos de un café.
        </p>
      </div>

      {/* Free vs Pro */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-smoke bg-ash/40 p-5">
          <p className="mb-1 font-display font-bold text-stone-400 text-sm uppercase tracking-wider">Gratis</p>
          <p className="font-display text-2xl font-extrabold text-bone mb-4">$0</p>
          <ul className="space-y-2">
            {FREE_FEATURES.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-stone-400">
                <span className="text-stone-600 mt-0.5">✓</span><span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

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
      {(planA || planB) && (
        <div className="mb-6">
          <p className="mb-3 text-xs uppercase tracking-wider text-stone-500">Elige tu plan</p>
          <div className="grid grid-cols-2 gap-3">
            {([["a", planA], ["b", planB]] as ["a" | "b", MPPlanInfo | null][]).map(([key, p]) => {
              if (!p) return null;
              const ar = p.auto_recurring;
              return (
                <button key={key} onClick={() => setSelected(key)}
                  className={`relative rounded-2xl border p-4 text-left transition-all ${
                    selected === key
                      ? "border-ember/60 bg-ember/8 ring-1 ring-ember/30"
                      : "border-smoke bg-ash/40 hover:border-stone-600"
                  }`}>
                  {key === "b" && (
                    <span className="absolute -top-2.5 right-3 rounded-full bg-sage px-2 py-0.5 text-[10px] font-bold text-ink uppercase tracking-wider">
                      Recomendado
                    </span>
                  )}
                  <p className="font-display font-bold text-bone">{p.reason}</p>
                  <p className="text-2xl font-display font-extrabold text-bone mt-1">
                    {formatAmount(ar.transaction_amount, ar.currency_id)}
                    <span className="text-xs text-stone-500 font-normal ml-0.5">
                      {ar.currency_id}{freqLabel(ar.frequency_type)}
                    </span>
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Fallback si env vars no están listos */}
      {!planA && !planB && (
        <div className="mb-6 rounded-2xl border border-smoke bg-ash/40 px-5 py-4 text-center">
          <p className="text-stone-400 text-sm">Cargando planes de suscripción…</p>
        </div>
      )}

      {/* Error */}
      {err && (
        <div className="mb-4 rounded-xl border border-rust/40 bg-rust/10 px-4 py-3 text-sm text-rust">
          {err}
        </div>
      )}

      {/* CTA MercadoPago */}
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
            <p className="font-display font-bold text-bone">
              {plan
                ? `Suscribirse — ${plan.reason}`
                : "Suscribirse con MercadoPago"}
            </p>
            <p className="text-xs text-stone-500 mt-0.5">Webpay · tarjetas chilenas · cuotas</p>
          </div>
        </div>
        <span className="text-[#009EE3] text-lg font-bold">
          {loading ? "…" : "→"}
        </span>
      </button>

      {/* Contribuye y gana */}
      <div className="mt-6 rounded-2xl border border-amber/20 bg-amber/5 px-5 py-4">
        <p className="font-display font-bold text-amber text-sm mb-1">💡 ¿Preferes ganarlo?</p>
        <p className="text-xs text-stone-400 leading-relaxed">
          Aporta ejercicios a la comunidad — cada aprobado desbloquea +1 ejercicio extra.
          Cada <strong className="text-amber">15 aportes aprobados</strong> te ganas{" "}
          <strong className="text-amber">1 mes de Pro gratis</strong>. Los meses se acumulan.
        </p>
        <Link href="/comunidad/nuevo"
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-amber hover:underline">
          Aportar ejercicio →
        </Link>
      </div>

      <p className="mt-5 text-center text-xs text-stone-600 leading-relaxed">
        Suscripción recurrente · Cancela cuando quieras desde tu cuenta MercadoPago ·
        Sin contratos ni letra chica
      </p>
    </div>
  );
}
