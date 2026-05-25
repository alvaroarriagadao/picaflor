"use client";

import { useState, useTransition } from "react";
import { deleteExercise } from "./editar/actions";

export function DeleteExerciseButton({ exerciseId, title }: { exerciseId: string; title: string }) {
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="rounded-lg border border-smoke px-3 py-1.5 text-xs text-stone-400 transition hover:border-rust/40 hover:text-rust"
      >
        Eliminar
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-rust/40 bg-rust/5 px-3 py-1.5">
      <span className="text-xs text-rust">¿Eliminar &quot;{title.slice(0, 20)}&hellip;&quot;?</span>
      <button
        onClick={() => {
          startTransition(async () => {
            await deleteExercise(exerciseId);
          });
        }}
        disabled={isPending}
        className="text-xs font-bold text-rust hover:underline disabled:opacity-50"
      >
        {isPending ? "…" : "Sí"}
      </button>
      <button onClick={() => setConfirm(false)} className="text-xs text-stone-500 hover:text-bone">
        No
      </button>
    </div>
  );
}
