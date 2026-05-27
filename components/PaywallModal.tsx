"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PRO_FEATURES = [
  { icon: "🎸", text: "Biblioteca completa — todos los ejercicios" },
  { icon: "📅", text: "Planificador diario de práctica" },
  { icon: "⭐", text: "Nuevos ejercicios cada mes" },
  { icon: "🔍", text: "Filtros avanzados y favoritos sin límite" },
  { icon: "🤝", text: "Apoyas directamente al creador" },
];

export default function PaywallModal({ open, onClose }: Props) {
  const router = useRouter();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md mx-0 sm:mx-4 overflow-hidden rounded-t-3xl sm:rounded-3xl border border-smoke bg-ash">
        {/* Header accent */}
        <div className="h-1 w-full bg-gradient-to-r from-ember via-amber to-ember" />

        <div className="p-6">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-smoke text-stone-400 hover:text-bone transition"
          >
            ×
          </button>

          {/* Hero */}
          <div className="mb-5 text-center">
            <p className="text-3xl mb-2">◆</p>
            <h2 className="font-display text-2xl font-extrabold text-bone">
              Picaflor Pro
            </h2>
            <p className="mt-1 text-stone-400 text-sm">
              Accede a la biblioteca completa y al planificador.
            </p>
          </div>

          {/* Features */}
          <ul className="mb-6 space-y-2">
            {PRO_FEATURES.map((f, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span className="text-base">{f.icon}</span>
                <span className="text-stone-300">{f.text}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button
            onClick={() => { onClose(); router.push("/precios"); }}
            className="w-full rounded-xl bg-ember py-3.5 font-display font-bold uppercase tracking-wider text-ink transition hover:bg-amber"
          >
            Ver planes y precios →
          </button>

          <p className="mt-3 text-center text-xs text-stone-600">
            Desde $3.990 CLP/mes · Cancela cuando quieras
          </p>
        </div>
      </div>
    </div>
  );
}
