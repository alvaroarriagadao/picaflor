"use client";

import { useState } from "react";
import Link from "next/link";
import { FREE_EXERCISE_LIMIT } from "@/lib/plan-config";
import type { SubscriptionInfo } from "@/lib/subscription";

export default function SubscriptionSection({
  subscription,
}: {
  subscription: SubscriptionInfo;
}) {
  const [loadingPortal, setLoadingPortal] = useState(false);
  const { plan, billingInterval, currentPeriodEnd, provider, status } =
    subscription;

  const openPortal = async () => {
    setLoadingPortal(true);
    try {
      const res  = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } finally {
      setLoadingPortal(false);
    }
  };

  const intervalLabel = billingInterval === "year" ? "anual" : "mensual";
  const periodEndLabel = currentPeriodEnd
    ? currentPeriodEnd.toLocaleDateString("es-CL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="mt-10">
      <h2 className="mb-4 font-display text-2xl font-bold text-bone">
        Suscripción
      </h2>

      {plan === "pro" ? (
        <div className="rounded-2xl border border-amber/30 bg-amber/5 p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-display font-extrabold text-lg text-bone">
                  Pickaflor Pro
                </span>
                <span className="rounded-full border border-amber/40 bg-amber/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber">
                  Activo
                </span>
              </div>
              <p className="text-sm text-stone-400">
                Plan {intervalLabel}
                {periodEndLabel && (
                  <> · Renueva el {periodEndLabel}</>
                )}
              </p>
              {provider && (
                <p className="text-xs text-stone-600 mt-0.5 capitalize">
                  Vía {provider === "mercadopago" ? "MercadoPago" : "Stripe"}
                </p>
              )}
            </div>

            {/* Manage button — only for Stripe customers */}
            {provider === "stripe" && (
              <button
                onClick={openPortal}
                disabled={loadingPortal}
                className="rounded-xl border border-smoke px-4 py-2 text-sm text-stone-400 transition hover:border-ember/40 hover:text-bone disabled:opacity-50"
              >
                {loadingPortal ? "Cargando…" : "Gestionar suscripción →"}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-smoke bg-ash/40 p-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-display font-bold text-stone-300">
                Plan Gratuito
              </p>
              <p className="text-sm text-stone-500 mt-0.5">
                Acceso a {FREE_EXERCISE_LIMIT} ejercicios · Metrónomo · Afinador
              </p>
            </div>
            <Link
              href="/precios"
              className="rounded-xl bg-ember px-4 py-2 text-sm font-display font-bold uppercase tracking-wider text-ink transition hover:bg-amber"
            >
              Actualizar a Pro →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
