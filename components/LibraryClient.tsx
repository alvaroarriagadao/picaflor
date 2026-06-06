"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { DifficultyBadge, TechniqueBadge } from "@/components/Badges";
import FavoriteButton from "@/components/FavoriteButton";
import PaywallModal from "@/components/PaywallModal";
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_ORDER,
  TECHNIQUE_LABELS,
} from "@/lib/types";
import { FREE_EXERCISE_LIMIT } from "@/lib/plan-config";
import type { Difficulty, Exercise, Technique } from "@/lib/types";

interface Props {
  exercises: Exercise[];
  practicedIds: string[];
  favoriteIds: string[];
  isPro: boolean;
}

export default function LibraryClient({
  exercises,
  practicedIds,
  favoriteIds,
  isPro,
}: Props) {
  const [tech, setTech]           = useState<Technique | "all">("all");
  const [diff, setDiff]           = useState<Difficulty | "all">("all");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [paywallOpen, setPaywallOpen]     = useState(false);

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

  // First FREE_EXERCISE_LIMIT exercises (by original order) are always free
  const freeIds = useMemo(
    () => new Set(exercises.slice(0, FREE_EXERCISE_LIMIT).map((e) => e.id)),
    [exercises]
  );

  const lockedCount = !isPro
    ? filtered.filter((e) => !freeIds.has(e.id)).length
    : 0;

  return (
    <>
      <div>
        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-bone">
              Biblioteca
            </h1>
            <p className="mt-1 text-stone-400">
              {filtered.length} de {exercises.length} ejercicios
              {!isPro && (
                <span className="ml-2 text-xs text-stone-600">
                  · {FREE_EXERCISE_LIMIT} gratis
                </span>
              )}
            </p>
          </div>

          {isPro ? (
            <span className="mt-1 shrink-0 rounded-full border border-amber/40 bg-amber/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber">
              ◆ Pro
            </span>
          ) : (
            <button
              onClick={() => setPaywallOpen(true)}
              className="mt-1 shrink-0 rounded-full border border-ember/40 bg-ember/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-ember hover:bg-ember/20 transition"
            >
              ↑ Desbloquear todo
            </button>
          )}
        </div>

        {/* ── Filters ─────────────────────────────────────────────── */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <select
            value={tech}
            onChange={(e) => setTech(e.target.value as Technique | "all")}
            className="min-w-0 flex-1 rounded-xl border border-smoke bg-ash/60 px-3 py-2.5 text-sm text-bone outline-none transition focus:border-ember sm:flex-none"
          >
            <option value="all">Todas las técnicas</option>
            {techniques.map((t) => (
              <option key={t} value={t}>{TECHNIQUE_LABELS[t]}</option>
            ))}
          </select>

          <select
            value={diff}
            onChange={(e) => setDiff(e.target.value as Difficulty | "all")}
            className="min-w-0 flex-1 rounded-xl border border-smoke bg-ash/60 px-3 py-2.5 text-sm text-bone outline-none transition focus:border-ember sm:flex-none"
          >
            <option value="all">Cualquier nivel</option>
            {DIFFICULTY_ORDER.map((d) => (
              <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
            ))}
          </select>

          <button
            onClick={() => setOnlyFavorites((f) => !f)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm transition active:bg-smoke/50 ${
              onlyFavorites
                ? "border-amber/40 bg-amber/10 text-amber"
                : "border-smoke bg-ash/60 text-stone-400 hover:text-amber"
            }`}
          >
            {onlyFavorites ? "★" : "☆"}
            <span className="hidden xs:inline sm:inline">Favoritos</span>
            {favorites.size > 0 && (
              <span className="rounded-full bg-amber/20 px-1.5 text-xs text-amber">
                {favorites.size}
              </span>
            )}
          </button>

          {(tech !== "all" || diff !== "all" || onlyFavorites) && (
            <button
              onClick={() => {
                setTech("all");
                setDiff("all");
                setOnlyFavorites(false);
              }}
              className="rounded-xl border border-smoke/40 px-3 py-2.5 text-xs text-stone-600 transition hover:text-stone-400 active:bg-smoke/30"
            >
              Limpiar ×
            </button>
          )}
        </div>

        {/* ── Grid ────────────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-stone-500">
            {onlyFavorites
              ? "Aún no tienes favoritos. Toca ★ en cualquier ejercicio."
              : "No hay ejercicios con esos filtros."}
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              {filtered.map((e) => {
                const isLocked = !isPro && !freeIds.has(e.id);
                return isLocked ? (
                  <LockedCard
                    key={e.id}
                    exercise={e}
                    onUnlock={() => setPaywallOpen(true)}
                  />
                ) : (
                  <ExerciseCard
                    key={e.id}
                    exercise={e}
                    practiced={practiced.has(e.id)}
                    favorited={favorites.has(e.id)}
                  />
                );
              })}
            </div>

            {/* Upgrade banner when locked exercises visible */}
            {!isPro && lockedCount > 0 && (
              <div className="mt-6 rounded-2xl border border-ember/30 bg-ember/5 p-5 text-center">
                <p className="font-display font-bold text-bone">
                  {lockedCount} ejercicio{lockedCount > 1 ? "s" : ""} bloqueado{lockedCount > 1 ? "s" : ""}
                </p>
                <p className="mt-1 text-sm text-stone-400">
                  Hazte Pro para acceder a la biblioteca completa.
                </p>
                <button
                  onClick={() => setPaywallOpen(true)}
                  className="mt-4 rounded-xl bg-ember px-6 py-2.5 font-display font-bold uppercase tracking-wider text-ink text-sm transition hover:bg-amber"
                >
                  Ver planes →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </>
  );
}

// ─── Normal exercise card ──────────────────────────────────────────────────────

function ExerciseCard({
  exercise: e,
  practiced,
  favorited,
}: {
  exercise: Exercise;
  practiced: boolean;
  favorited: boolean;
}) {
  return (
    <Link
      href={`/biblioteca/${e.slug}`}
      className="group relative overflow-hidden rounded-2xl border border-smoke bg-ash/40 transition hover:border-ember/50 hover:bg-ash/70"
    >
      {e.image_url && (
        <div className="relative h-36 overflow-hidden border-b border-smoke bg-ink/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={e.image_url}
            alt={e.title}
            className="h-full w-full object-cover object-top opacity-80 group-hover:opacity-100 transition-opacity"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-ink/60" />
        </div>
      )}

      <div className="p-5">
        <div className="absolute right-3 top-3 flex items-center gap-1">
          {practiced && <span className="text-sage text-sm">✓</span>}
          <FavoriteButton exerciseId={e.id} initialFavorited={favorited} size="sm" />
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          <TechniqueBadge technique={e.technique} />
          <DifficultyBadge difficulty={e.difficulty} />
          {e.submitted_by_email && (
            <span className="rounded-full border border-smoke px-2 py-0.5 text-[10px] text-stone-500">
              comunidad
            </span>
          )}
        </div>
        <h3 className="pr-10 font-display text-xl font-bold text-bone transition group-hover:text-ember">
          {e.title}
        </h3>
        {e.description && (
          <p className="mt-2 line-clamp-2 text-sm text-stone-400">{e.description}</p>
        )}
        <div className="mt-4 font-mono text-xs text-stone-500">
          ♩ {e.bpm_start}→{e.bpm_target} BPM
        </div>
      </div>
    </Link>
  );
}

// ─── Locked exercise card (free limit reached) ────────────────────────────────

function LockedCard({
  exercise: e,
  onUnlock,
}: {
  exercise: Exercise;
  onUnlock: () => void;
}) {
  return (
    <button
      onClick={onUnlock}
      className="group relative overflow-hidden rounded-2xl border border-smoke/40 bg-ash/20 text-left transition hover:border-ember/40 hover:bg-ash/30"
    >
      {/* Blurred content preview */}
      <div className="select-none blur-[2px] pointer-events-none p-5 opacity-40">
        <div className="mb-3 flex flex-wrap gap-2">
          <TechniqueBadge technique={e.technique} />
          <DifficultyBadge difficulty={e.difficulty} />
        </div>
        <h3 className="pr-10 font-display text-xl font-bold text-bone">{e.title}</h3>
        <div className="mt-4 font-mono text-xs text-stone-500">
          ♩ {e.bpm_start}→{e.bpm_target} BPM
        </div>
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-1.5 rounded-xl border border-ember/30 bg-ink/90 px-4 py-3 shadow-lg backdrop-blur-sm group-hover:border-ember/60 transition">
          <span className="text-lg">🔒</span>
          <span className="font-display text-xs font-bold uppercase tracking-wider text-ember">
            Pro
          </span>
        </div>
      </div>
    </button>
  );
}
