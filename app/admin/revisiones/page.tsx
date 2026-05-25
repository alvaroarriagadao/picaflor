import { createClient } from "@/lib/supabase-server";
import type { ExerciseSubmission } from "@/lib/types";
import { TECHNIQUE_LABELS, DIFFICULTY_LABELS } from "@/lib/types";
import Link from "next/link";
import { ReviewActions } from "./ReviewActions";

export const dynamic = "force-dynamic";

export default async function RevisionesPage() {
  const supabase = await createClient();

  const { data: pending } = await supabase
    .from("exercise_submissions")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  const { data: reviewed } = await supabase
    .from("exercise_submissions")
    .select("*")
    .neq("status", "pending")
    .order("reviewed_at", { ascending: false })
    .limit(10);

  const pendingList = (pending ?? []) as ExerciseSubmission[];
  const reviewedList = (reviewed ?? []) as ExerciseSubmission[];

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-3xl font-extrabold text-bone">Revisiones</h1>
        <p className="mt-1 text-stone-400">
          {pendingList.length === 0
            ? "Todo al día — no hay ejercicios pendientes."
            : `${pendingList.length} ejercicio${pendingList.length > 1 ? "s" : ""} esperando revisión`}
        </p>
      </div>

      {/* Pendientes */}
      {pendingList.length > 0 && (
        <div className="mb-10 space-y-4">
          {pendingList.map((sub) => (
            <SubmissionCard key={sub.id} sub={sub} />
          ))}
        </div>
      )}

      {/* Historial */}
      {reviewedList.length > 0 && (
        <div>
          <h2 className="mb-4 text-xs uppercase tracking-wider text-stone-500">Últimas revisadas</h2>
          <div className="space-y-2">
            {reviewedList.map((sub) => (
              <div key={sub.id}
                className="flex items-center justify-between rounded-xl border border-smoke bg-ash/30 px-4 py-3">
                <div>
                  <span className="font-medium text-stone-300">{sub.title}</span>
                  <span className="ml-2 text-xs text-stone-600">{TECHNIQUE_LABELS[sub.technique]}</span>
                </div>
                <span className={`text-xs font-medium rounded-full px-2.5 py-0.5 ${
                  sub.status === "approved"
                    ? "bg-sage/20 text-sage"
                    : "bg-rust/20 text-rust"
                }`}>
                  {sub.status === "approved" ? "✓ Aprobado" : "✕ Rechazado"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingList.length === 0 && reviewedList.length === 0 && (
        <div className="py-20 text-center text-stone-600">
          <p className="text-4xl mb-3">◆</p>
          <p>Aún no hay ejercicios enviados por la comunidad.</p>
        </div>
      )}
    </div>
  );
}

function SubmissionCard({ sub }: { sub: ExerciseSubmission }) {
  return (
    <div className="rounded-2xl border border-amber/30 bg-amber/5 p-5">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap gap-2 mb-1.5">
            <span className="text-xs rounded-md bg-smoke px-2 py-0.5 text-stone-400">
              {TECHNIQUE_LABELS[sub.technique]}
            </span>
            <span className="text-xs rounded-md bg-smoke px-2 py-0.5 text-stone-400">
              {DIFFICULTY_LABELS[sub.difficulty]}
            </span>
            <span className="text-xs text-stone-600">
              ♩ {sub.bpm_start}→{sub.bpm_target} BPM
            </span>
          </div>
          <h3 className="font-display text-xl font-bold text-bone">{sub.title}</h3>
          {sub.submitter_notes && (
            <p className="mt-1 text-sm text-stone-400 italic">&ldquo;{sub.submitter_notes}&rdquo;</p>
          )}
        </div>
        <span className="shrink-0 rounded-full border border-amber/30 bg-amber/10 px-2.5 py-0.5 text-xs text-amber">
          Pendiente
        </span>
      </div>

      <p className="mb-3 text-sm text-stone-300 leading-relaxed">{sub.description}</p>

      <div className="mb-4 rounded-lg border border-smoke bg-ink/60 p-3 overflow-x-auto">
        <pre className="tab-block text-xs text-amber">{sub.tab}</pre>
      </div>

      <div className="rounded-xl border border-smoke/60 bg-ash/40 p-3 mb-4">
        <p className="text-xs uppercase tracking-wider text-stone-500 mb-1">Focus</p>
        <p className="text-sm text-stone-300">{sub.focus}</p>
      </div>

      <ReviewActions submissionId={sub.id} title={sub.title} />
    </div>
  );
}
