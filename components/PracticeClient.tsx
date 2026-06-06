"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Metronome from "@/components/Metronome";
import TabDisplay from "@/components/TabDisplay";
import { DifficultyBadge, TechniqueBadge } from "@/components/Badges";
import FavoriteButton from "@/components/FavoriteButton";
import SessionTimer from "@/components/SessionTimer";
import { pickRandomExercise } from "@/lib/daily";
import { createClient } from "@/lib/supabase-client";
import type { Exercise, PracticeTask } from "@/lib/types";

interface Props {
  dailyExercise:  Exercise;
  allExercises:   Exercise[];
  freePool:       Exercise[];
  completedToday: boolean;
  streak:         number;
  favoriteIds:    string[];
  isPro:          boolean;
  totalExercises: number;
  practiceTasks:  PracticeTask[];
  todayTimeLogs:  { task_id: string; minutes: number }[];
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
  practiceTasks,
  todayTimeLogs,
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
      <div className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-display text-xs uppercase tracking-[0.25em] text-ember sm:text-sm">
            {isDaily ? "Ejercicio del día" : "Lick al azar"}
          </p>
          <div className="mt-1 flex items-start gap-2">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-bone sm:text-5xl min-w-0 break-words">
              {current.title}
            </h1>
            <FavoriteButton
              key={current.id}
              exerciseId={current.id}
              initialFavorited={favSet.has(current.id)}
            />
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2 rounded-xl border border-amber/30 bg-amber/5 px-3 py-2 sm:px-4 sm:py-2.5">
          <span className="text-xl sm:text-2xl">🔥</span>
          <div>
            <div className="font-display text-xl font-bold leading-none text-amber sm:text-2xl">
              {localStreak}
            </div>
            <div className="text-[9px] uppercase tracking-wider text-stone-500 sm:text-[10px]">
              días racha
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
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
            <button
              onClick={shuffle}
              className="col-span-1 flex items-center justify-center gap-2 rounded-xl border border-smoke bg-ash/60 px-4 py-3 text-sm font-medium text-bone transition hover:border-ember hover:text-ember active:bg-ash sm:px-5"
            >
              🎲 Al azar
            </button>
            {!isDaily && (
              <button
                onClick={backToDaily}
                className="col-span-1 rounded-xl border border-smoke bg-ash/60 px-4 py-3 text-sm font-medium text-stone-400 transition hover:text-bone active:bg-ash sm:px-5"
              >
                ← Del día
              </button>
            )}
            <button
              onClick={markComplete}
              disabled={done || saving}
              className={`col-span-2 flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-display text-sm font-bold uppercase tracking-wider transition sm:col-span-1 sm:px-5 ${
                done
                  ? "cursor-default border border-sage/40 bg-sage/10 text-sage"
                  : "bg-ember text-ink hover:bg-amber active:bg-amber disabled:opacity-50"
              }`}
            >
              {done ? "✓ Practicado hoy" : saving ? "Guardando…" : "Marcar practicado"}
            </button>
          </div>
        </div>

        {/* Columna derecha: cronómetro (arriba) + metrónomo */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <SessionTimer
            tasks={practiceTasks}
            todayLogs={todayTimeLogs}
          />
          <div className="mt-3">
            <Metronome
              key={current.id}
              initialBpm={current.bpm_start}
              bpmStart={current.bpm_start}
              bpmTarget={current.bpm_target}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
