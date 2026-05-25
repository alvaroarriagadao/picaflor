import { DIFFICULTY_LABELS, TECHNIQUE_LABELS } from "@/lib/types";
import type { Difficulty, Technique } from "@/lib/types";

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  principiante: "border-sage/40 bg-sage/10 text-sage",
  intermedio: "border-amber/40 bg-amber/10 text-amber",
  avanzado: "border-ember/40 bg-ember/10 text-ember",
  experto: "border-rust/50 bg-rust/15 text-rust",
};

export function TechniqueBadge({ technique }: { technique: Technique }) {
  return (
    <span className="inline-flex items-center rounded-full border border-smoke bg-smoke/40 px-3 py-1 text-xs font-medium uppercase tracking-wider text-stone-300">
      {TECHNIQUE_LABELS[technique]}
    </span>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wider ${DIFFICULTY_STYLES[difficulty]}`}
    >
      {DIFFICULTY_LABELS[difficulty]}
    </span>
  );
}
