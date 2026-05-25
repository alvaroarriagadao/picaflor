import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { TECHNIQUE_LABELS, DIFFICULTY_LABELS } from "@/lib/types";
import type { Exercise } from "@/lib/types";
import { DeleteExerciseButton } from "./DeleteExerciseButton";

export const dynamic = "force-dynamic";

export default async function AdminEjerciciosPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercises")
    .select("*")
    .order("created_at", { ascending: false });

  const exercises = (data ?? []) as Exercise[];

  // Contar submissions pendientes
  const { count: pendingCount } = await supabase
    .from("exercise_submissions")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-bone">
            Ejercicios
          </h1>
          <p className="mt-1 text-stone-400">
            {exercises.length} ejercicios en la biblioteca
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(pendingCount ?? 0) > 0 && (
            <Link
              href="/admin/revisiones"
              className="flex items-center gap-2 rounded-xl border border-amber/40 bg-amber/10 px-4 py-2 text-sm font-medium text-amber transition hover:bg-amber/20"
            >
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber" />
              {pendingCount} por revisar
            </Link>
          )}
          <Link
            href="/admin/ejercicios/nuevo"
            className="rounded-xl bg-ember px-5 py-2 font-display font-bold uppercase tracking-wider text-ink text-sm transition hover:bg-amber"
          >
            + Nuevo ejercicio
          </Link>
        </div>
      </div>

      <div className="space-y-2">
        {exercises.map((ex) => (
          <div
            key={ex.id}
            className="flex items-center gap-4 rounded-xl border border-smoke bg-ash/40 px-5 py-4 transition hover:border-smoke/80"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs rounded-md bg-smoke px-2 py-0.5 text-stone-400">
                  {TECHNIQUE_LABELS[ex.technique]}
                </span>
                <span className="text-xs rounded-md bg-smoke px-2 py-0.5 text-stone-400">
                  {DIFFICULTY_LABELS[ex.difficulty]}
                </span>
              </div>
              <h3 className="mt-1 font-display font-bold text-bone truncate">
                {ex.title}
              </h3>
              <p className="text-xs text-stone-600 font-mono mt-0.5">/{ex.slug}</p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <Link
                href={`/biblioteca/${ex.slug}`}
                className="rounded-lg border border-smoke px-3 py-1.5 text-xs text-stone-400 transition hover:text-bone"
              >
                Ver
              </Link>
              <Link
                href={`/admin/ejercicios/editar/${ex.id}`}
                className="rounded-lg border border-smoke px-3 py-1.5 text-xs text-stone-400 transition hover:border-ember/40 hover:text-ember"
              >
                Editar
              </Link>
              <DeleteExerciseButton exerciseId={ex.id} title={ex.title} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
