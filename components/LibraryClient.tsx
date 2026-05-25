"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { DifficultyBadge, TechniqueBadge } from "@/components/Badges";
import FavoriteButton from "@/components/FavoriteButton";
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_ORDER,
  TECHNIQUE_LABELS,
} from "@/lib/types";
import type { Difficulty, Exercise, Technique } from "@/lib/types";

interface Props {
  exercises: Exercise[];
  practicedIds: string[];
  favoriteIds: string[];
}

export default function LibraryClient({
  exercises,
  practicedIds,
  favoriteIds,
}: Props) {
  const [tech, setTech] = useState<Technique | "all">("all");
  const [diff, setDiff] = useState<Difficulty | "all">("all");
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const practiced = useMemo(() => new Set(practicedIds), [practicedIds]);
  const favorites = useMemo(() => new Set(favoriteIds), [favoriteIds]);

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
          (diff === "all" || e.difficulty === diff) &&
          (!onlyFavorites || favorites.has(e.id))
      ),
    [exercises, tech, diff, onlyFavorites, favorites]
  );

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-bone">
            Biblioteca
          </h1>
          <p className="mt-1 text-stone-400">
            {exercises.length} ejercicios · filtra por técnica y dificultad
          </p>
        </div>
        <button
          onClick={() => setOnlyFavorites((f) => !f)}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition ${
            onlyFavorites
              ? "border-amber/40 bg-amber/10 text-amber"
              : "border-smoke bg-ash/40 text-stone-400 hover:border-amber/30 hover:text-amber"
          }`}
        >
          {onlyFavorites ? "★" : "☆"} Favoritos
          {favorites.size > 0 && (
            <span className="rounded-full bg-amber/20 px-1.5 py-0.5 text-xs text-amber">
              {favorites.size}
            </span>
          )}
        </button>
      </div>

      {/* Filtros de técnica */}
      <div className="mb-3 flex flex-wrap gap-2">
        <FilterChip active={tech === "all"} onClick={() => setTech("all")}>
          Todas
        </FilterChip>
        {techniques.map((t) => (
          <FilterChip key={t} active={tech === t} onClick={() => setTech(t)}>
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
          {onlyFavorites
            ? "Aún no tienes favoritos. Toca ★ en cualquier ejercicio."
            : "No hay ejercicios con esos filtros."}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((e) => (
            <Link
              key={e.id}
              href={`/biblioteca/${e.slug}`}
              className="group relative overflow-hidden rounded-2xl border border-smoke bg-ash/40 p-5 transition hover:border-ember/50 hover:bg-ash/70"
            >
              <div className="absolute right-3 top-3 flex items-center gap-1">
                {practiced.has(e.id) && (
                  <span className="text-sage text-sm">✓</span>
                )}
                <FavoriteButton
                  exerciseId={e.id}
                  initialFavorited={favorites.has(e.id)}
                  size="sm"
                />
              </div>
              <div className="mb-3 flex flex-wrap gap-2">
                <TechniqueBadge technique={e.technique} />
                <DifficultyBadge difficulty={e.difficulty} />
              </div>
              <h3 className="font-display text-xl font-bold text-bone transition group-hover:text-ember pr-10">
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
