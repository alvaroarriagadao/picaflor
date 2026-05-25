"use client";

import { useState, useTransition } from "react";
import { approveSubmission, rejectSubmission } from "./actions";

export function ReviewActions({ submissionId, title }: { submissionId: string; title: string }) {
  const [mode, setMode] = useState<"idle" | "reject">("idle");
  const [reason, setReason] = useState("");
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const handleApprove = () => {
    startTransition(async () => {
      const res = await approveSubmission(submissionId);
      if (res.error) setMsg({ type: "err", text: res.error });
      else setMsg({ type: "ok", text: "¡Ejercicio publicado en la biblioteca!" });
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      const res = await rejectSubmission(submissionId, reason);
      if (res.error) setMsg({ type: "err", text: res.error });
      else setMsg({ type: "ok", text: "Ejercicio rechazado." });
    });
  };

  if (msg) {
    return (
      <div className={`rounded-lg px-4 py-2 text-sm ${
        msg.type === "ok" ? "bg-sage/10 text-sage" : "bg-rust/10 text-rust"
      }`}>
        {msg.text}
      </div>
    );
  }

  if (mode === "reject") {
    return (
      <div className="space-y-2">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Motivo del rechazo (se enviará al usuario)…"
          rows={2}
          className="w-full resize-none rounded-lg border border-smoke bg-ink/60 px-3 py-2 text-sm text-bone outline-none focus:border-rust/60 placeholder:text-stone-600"
        />
        <div className="flex gap-2">
          <button
            onClick={handleReject}
            disabled={isPending}
            className="rounded-lg bg-rust px-4 py-2 text-sm font-bold text-bone transition hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Rechazando…" : "Confirmar rechazo"}
          </button>
          <button onClick={() => setMode("idle")} className="text-sm text-stone-500 hover:text-bone transition">
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleApprove}
        disabled={isPending}
        className="rounded-xl bg-sage px-5 py-2 text-sm font-bold text-ink transition hover:opacity-90 disabled:opacity-50"
      >
        {isPending ? "Publicando…" : "✓ Aprobar y publicar"}
      </button>
      <button
        onClick={() => setMode("reject")}
        disabled={isPending}
        className="rounded-xl border border-rust/40 px-5 py-2 text-sm font-medium text-rust transition hover:bg-rust/10 disabled:opacity-50"
      >
        Rechazar
      </button>
    </div>
  );
}
