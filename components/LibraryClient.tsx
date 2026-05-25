"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { DifficultyBadge, TechniqueBadge } from "@/components/Badges";
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_ORDER,
  TECHNIQUE_LABELS,
} from "@/lib/types";
import type { Difficulty, Exercise, Technique } from "@/lib/types";

interface Props {
  exercises: Exercise[];
  practicedIds: string[];
}

export default function LibraryClient({ exercises, practicedIds }: Props) {
  const [tech, setTech] = useState<Technique | "all">("all");
  const [diff, setDiff] = useState<Difficulty | "all">("all");
  const practiced = useMemo(() => new Set(practicedIds), [practicedIds]);

  const techniques = useMemo(() => {
    const present = new Set(exercises.map((e) => e.technique));
    return (Object.keys(TECHNIQUE_LABELS) as Technique[]).filter((t) =>
      present.has(t)
    );
  }, [exercises]);

  const filtered = useMemo(
    () =>
      exercises.filter(
        (e) =>
          (tech === "all" || e.technique === tech) &&
          (diff === "all" || e.difficulty === diff)
      ),
    [exercises, tech, diff]
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-4xl font-extrabold tracking-tight text-bone">
          Biblioteca
        </h1>
        <p className="mt-1 text-stone-400">
          {exercises.length} ejercicios · filtra por técnica y dificultad
        </p>
      </div>

      {/* Filtros de técnica */}
      <div className="mb-3 flex flex-wrap gap-2">
        <FilterChip active={tech === "all"} onClick={() => setTech("all")}>
          Todas
        </FilterChip>
        {techniques.map((t) => (
          <FilterChip
            key={t}
            active={tech === t}
            onClick={() => setTech(t)}
          >
            {TECHNIQUE_LABELS[t]}
          </FilterChip>
        ))}
      </div>

      {/* Filtros de dificultad */}
      <div className="mb-8 flex flex-wrap gap-2">
        <FilterChip active={diff === "all"} onClick={() => setDiff("all")}>
          Cualquier nivel
        </FilterChip>
        {DIFFICULTY_ORDER.map((d) => (
          <FilterChip key={d} active={diff === d} onClick={() => setDiff(d)}>
            {DIFFICULTY_LABELS[d]}
          </FilterChip>
        ))}
      </div>

      {/* Grid de ejercicios */}
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-stone-500">
          No hay ejercicios con esos filtros.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((e) => (
            <Link
              key={e.id}
              href={`/biblioteca/${e.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-smoke bg-ash/40 p-5 transition hover:border-ember/50 hover:bg-ash/70"
            >
              {practiced.has(e.id) && (
                <span className="absolute right-4 top-4 text-sage">✓</span>
              )}
              <div className="mb-3 flex flex-wrap gap-2">
                <TechniqueBadge technique={e.technique} />
                <DifficultyBadge difficulty={e.difficulty} />
              </div>
              <h3 className="font-display text-xl font-bold text-bone transition group-hover:text-ember">
                {e.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm text-stone-400">
                {e.description}
              </p>
              <div className="mt-4 flex items-center gap-3 font-mono text-xs text-stone-500">
                <span>♩ {e.bpm_start}→{e.bpm_target} BPM</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-sm transition ${
        active
          ? "border-ember bg-ember text-ink"
          : "border-smoke bg-ash/40 text-stone-400 hover:border-stone-600 hover:text-bone"
      }`}
    >
      {children}
    </button>
  );
}
