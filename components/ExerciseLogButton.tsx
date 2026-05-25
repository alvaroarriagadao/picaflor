"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase-client";

export default function ExerciseLogButton({
  exerciseId,
  completedToday,
}: {
  exerciseId: string;
  completedToday: boolean;
}) {
  const [done, setDone] = useState(completedToday);
  const [saving, setSaving] = useState(false);

  const mark = async () => {
    if (done || saving) return;
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }
    const { error } = await supabase
      .from("practice_logs")
      .insert({ user_id: user.id, exercise_id: exerciseId });
    if (!error) setDone(true);
    setSaving(false);
  };

  return (
    <button
      onClick={mark}
      disabled={done || saving}
      className={`flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-display font-bold uppercase tracking-wider transition sm:w-auto ${
        done
          ? "cursor-default border border-sage/40 bg-sage/10 text-sage"
          : "bg-ember text-ink hover:bg-amber disabled:opacity-50"
      }`}
    >
      {done ? "✓ Practicado hoy" : saving ? "Guardando…" : "Marcar practicado"}
    </button>
  );
}
