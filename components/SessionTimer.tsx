"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import { logPracticeTime } from "@/app/planificador/actions";
import type { PracticeTask } from "@/lib/types";

// ─── Color helpers ────────────────────────────────────────────────────────────

const colorBar: Record<string, string> = {
  ember: "bg-ember", amber: "bg-amber", sage: "bg-sage",
  sky: "bg-sky-400", stone: "bg-stone-500",
};
const colorText: Record<string, string> = {
  ember: "text-ember", amber: "text-amber", sage: "text-sage",
  sky: "text-sky-400", stone: "text-stone-400",
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimeLogEntry {
  task_id: string;
  minutes: number;
}

interface Props {
  tasks:     PracticeTask[];
  todayLogs: TimeLogEntry[];   // pre-fetched logs for today
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SessionTimer({ tasks, todayLogs: initial }: Props) {
  const [running,   setRunning]   = useState(false);
  const [elapsed,   setElapsed]   = useState(0);       // seconds
  const [taskId,    setTaskId]    = useState<string>(tasks[0]?.id ?? "");
  const [saved,     setSaved]     = useState(false);
  const [todayLogs, setTodayLogs] = useState<TimeLogEntry[]>(initial);
  const [isPending, startTransition] = useTransition();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start / stop the interval
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const toggle = () => {
    setSaved(false);
    setRunning(r => !r);
  };

  const reset = () => {
    setRunning(false);
    setElapsed(0);
    setSaved(false);
  };

  const save = () => {
    if (elapsed < 1 || !taskId) return;
    const mins = Math.max(1, Math.round(elapsed / 60));
    startTransition(async () => {
      const { error } = await logPracticeTime(taskId, mins);
      if (!error) {
        setTodayLogs(prev => {
          const existing = prev.find(l => l.task_id === taskId);
          if (existing) {
            return prev.map(l => l.task_id === taskId
              ? { ...l, minutes: l.minutes + mins }
              : l);
          }
          return [...prev, { task_id: taskId, minutes: mins }];
        });
        setSaved(true);
        reset();
      }
    });
  };

  // Aggregate minutes per task from today's logs
  const minutesByTask: Record<string, number> = {};
  todayLogs.forEach(l => {
    minutesByTask[l.task_id] = (minutesByTask[l.task_id] ?? 0) + l.minutes;
  });

  const selectedTask = tasks.find(t => t.id === taskId);
  const elapsedMins  = Math.round(elapsed / 60);

  if (tasks.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-smoke/60 bg-ash/20 px-5 py-5 text-center">
        <p className="text-sm text-stone-500 mb-2">Sin tareas configuradas</p>
        <a href="/planificador" className="text-xs text-ember underline hover:text-amber transition">
          Crea tus tareas en el Planificador →
        </a>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-smoke bg-ash/40 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3 border-b border-smoke/60 flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-stone-500">
          ⏱ Cronómetro de sesión
        </p>
        {saved && (
          <span className="text-xs text-sage font-medium animate-pulse">
            ✓ ¡Sesión guardada!
          </span>
        )}
      </div>

      {/* Timer display */}
      <div className="px-5 py-4">
        <div className="flex items-center justify-center mb-4">
          <span className={`font-mono text-5xl font-bold tabular-nums tracking-tight ${
            running ? "text-ember" : elapsed > 0 ? "text-amber" : "text-stone-600"
          }`}>
            {fmt(elapsed)}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 mb-4">
          <button
            onClick={toggle}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 font-display font-bold text-sm uppercase tracking-wider transition ${
              running
                ? "bg-stone-700 text-stone-200 hover:bg-stone-600"
                : elapsed > 0
                ? "bg-amber/20 border border-amber/50 text-amber hover:bg-amber/30"
                : "bg-ember text-ink hover:bg-amber"
            }`}
          >
            {running ? "⏸ Pausar" : elapsed > 0 ? "▶ Continuar" : "▶ Iniciar"}
          </button>
          {elapsed > 0 && !running && (
            <button onClick={reset}
              className="rounded-xl border border-smoke px-4 py-2.5 text-sm text-stone-500 hover:text-stone-300 transition">
              ↺ Reset
            </button>
          )}
        </div>

        {/* Task selector + Save — shown when stopped with elapsed > 0 */}
        {elapsed > 0 && !running && (
          <div className="rounded-xl border border-amber/30 bg-amber/5 p-4 space-y-3">
            <p className="text-xs text-stone-400">
              Guardar <strong className="text-amber">{elapsedMins} min</strong> en:
            </p>
            <select
              value={taskId}
              onChange={e => setTaskId(e.target.value)}
              className="w-full rounded-lg border border-smoke bg-ink/60 px-3 py-2.5 text-sm text-bone outline-none focus:border-ember"
            >
              {tasks.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.duration_minutes} min/día)
                </option>
              ))}
            </select>
            <button
              onClick={save}
              disabled={isPending}
              className="w-full rounded-xl bg-ember px-4 py-2.5 font-display font-bold text-sm uppercase tracking-wider text-ink transition hover:bg-amber disabled:opacity-50"
            >
              {isPending ? "Guardando…" : "✓ Guardar sesión"}
            </button>
          </div>
        )}
      </div>

      {/* ── Today's progress per task ──────────────────────────────────────── */}
      {tasks.some(t => (minutesByTask[t.id] ?? 0) > 0) && (
        <div className="border-t border-smoke/60 px-5 py-4 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
            Progreso de hoy
          </p>
          {tasks.map(task => {
            const logged = minutesByTask[task.id] ?? 0;
            const target = task.duration_minutes;
            const pct    = Math.min(logged / target, 1);
            const done   = logged >= target;
            if (logged === 0) return null;
            return (
              <div key={task.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${colorBar[task.color] ?? "bg-ember"}`} />
                    <span className={`text-xs font-medium ${done ? "text-sage" : "text-stone-300"}`}>
                      {task.title}
                    </span>
                    {done && <span className="text-xs">🎸</span>}
                  </div>
                  <span className={`text-xs font-mono font-bold ${
                    done ? "text-sage" : (colorText[task.color] ?? "text-ember")
                  }`}>
                    {logged}/{target} min
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-smoke">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      done ? "bg-sage" : (colorBar[task.color] ?? "bg-ember")
                    }`}
                    style={{ width: `${pct * 100}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
