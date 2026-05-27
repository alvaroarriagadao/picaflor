"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Metronome from "@/components/Metronome";
import TabDisplay from "@/components/TabDisplay";
import { DifficultyBadge, TechniqueBadge } from "@/components/Badges";
import FavoriteButton from "@/components/FavoriteButton";
import { pickRandomExercise } from "@/lib/daily";
import { createClient } from "@/lib/supabase-client";
import type { Exercise } from "@/lib/types";

interface Props {
  dailyExercise: Exercise;
  allExercises: Exercise[];
  freePool: Exercise[];
  completedToday: boolean;
  streak: number;
  favoriteIds: string[];
  isPro: boolean;
  totalExercises: number;
}

export default function PracticeClient({
  dailyExercise,
  allExercises,
  freePool,
  completedToday,
  streak,
  favoriteIds,
  isPro,
  totalExercises,
}: Props) {
  const [current, setCurrent] = useState<Exercise>(dailyExercise);
  const favSet = new Set(favoriteIds);
  const [isDaily, setIsDaily] = useState(true);
  const [done, setDone] = useState(completedToday);
  const [localStreak, setLocalStreak] = useState(streak);
  const [saving, setSaving] = useState(false);

  // Free users shuffle only within their accessible pool
  const shufflePool = isPro ? allExercises : freePool;
  const lockedCount = totalExercises - freePool.length;

  const shuffle = useCallback(() => {
    const next = pickRandomExercise(shufflePool, current.id);
    if (next) {
      setCurrent(next);
      setIsDaily(next.id === dailyExercise.id);
    }
  }, [shufflePool, current.id, dailyExercise.id]);

  const backToDaily = () => {
    setCurrent(dailyExercise);
    setIsDaily(true);
  };

  const markComplete = async () => {
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
    const { error } = await supabase.from("practice_logs").insert({
      user_id: user.id,
      exercise_id: current.id,
    });
    if (!error) {
      setDone(true);
      if (!completedToday) setLocalStreak((s) => s + 1);
    }
    setSaving(false);
  };

  return (
    <div>
      {/* Cabecera con racha */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.25em] text-ember">
            {isDaily ? "Ejercicio del día" : "Lick al azar"}
          </p>
          <div className="mt-1 flex items-start gap-2">
            <h1 className="font-display text-4xl font-extrabold tracking-tight text-bone sm:text-5xl">
              {current.title}
            </h1>
            <FavoriteButton
              key={current.id}
              exerciseId={current.id}
              initialFavorited={favSet.has(current.id)}
            />
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-amber/30 bg-amber/5 px-4 py-2.5">
          <span className="text-2xl">🔥</span>
          <div>
            <div className="font-display text-2xl font-bold leading-none text-amber">
              {localStreak}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-stone-500">
              días de racha
            </div>
          </div>
        </div>
      </div>

      {/* Banner plan free */}
      {!isPro && lockedCount > 0 && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-ember/20 bg-ember/5 px-4 py-3">
          <p className="text-sm text-stone-300 leading-snug">
            <span className="font-medium text-ember">🎲 Lick al azar</span> rota entre{" "}
            <strong className="text-bone">{freePool.length} ejercicios</strong> —{" "}
            hay <strong className="text-bone">{lockedCount} más</strong> desbloqueables con Pro.
          </p>
          <Link href="/precios"
            className="shrink-0 rounded-lg bg-ember px-3 py-1.5 text-xs font-display font-bold uppercase tracking-wider text-ink hover:bg-amber transition">
            Ver Pro
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Columna izquierda: ejercicio */}
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <TechniqueBadge technique={current.technique} />
            <DifficultyBadge difficulty={current.difficulty} />
          </div>

          <p className="text-lg leading-relaxed text-stone-300">
            {current.description}
          </p>

          <div className="rounded-xl border border-smoke/60 bg-ash/40 p-4">
            <p className="text-xs uppercase tracking-wider text-stone-500">
              En qué fijarte
            </p>
            <p className="mt-1 text-stone-300">{current.focus}</p>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-wider text-stone-500">
              Tablatura
            </p>
            <TabDisplay tab={current.tab} />
          </div>

          {/* Acciones */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={shuffle}
              className="flex items-center gap-2 rounded-xl border border-smoke bg-ash/60 px-5 py-3 font-medium text-bone transition hover:border-ember hover:text-ember"
            >
              🎲 Otro lick al azar
            </button>
            {!isDaily && (
              <button
                onClick={backToDaily}
                className="rounded-xl border border-smoke bg-ash/60 px-5 py-3 font-medium text-stone-400 transition hover:text-bone"
              >
                ← Volver al del día
              </button>
            )}
            <button
              onClick={markComplete}
              disabled={done || saving}
              className={`flex items-center gap-2 rounded-xl px-5 py-3 font-display font-bold uppercase tracking-wider transition ${
                done
                  ? "cursor-default border border-sage/40 bg-sage/10 text-sage"
                  : "bg-ember text-ink hover:bg-amber disabled:opacity-50"
              }`}
            >
              {done ? "✓ Practicado hoy" : saving ? "Guardando…" : "Marcar practicado"}
            </button>
          </div>
        </div>

        {/* Columna derecha: metrónomo */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Metronome
            key={current.id}
            initialBpm={current.bpm_start}
            bpmStart={current.bpm_start}
            bpmTarget={current.bpm_target}
          />
        </div>
      </div>
    </div>
  );
}
