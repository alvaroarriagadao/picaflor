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

interface TimeLogEntry { task_id: string; minutes: number; }
interface Props        { tasks: PracticeTask[]; todayLogs: TimeLogEntry[]; }

function fmt(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SessionTimer({ tasks, todayLogs: initial }: Props) {
  const [running,    setRunning]   = useState(false);
  const [elapsed,    setElapsed]   = useState(0);
  const [taskId,     setTaskId]    = useState<string>(tasks[0]?.id ?? "");
  const [saved,      setSaved]     = useState(false);
  const [todayLogs,  setTodayLogs] = useState<TimeLogEntry[]>(initial);
  const [showDetail, setShowDetail] = useState(false);   // expand progress panel
  const [isPending,  startTransition] = useTransition();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const toggle = () => { setSaved(false); setRunning(r => !r); };

  const reset = () => { setRunning(false); setElapsed(0); setSaved(false); };

  const save = () => {
    if (elapsed < 1 || !taskId) return;
    const mins = Math.max(1, Math.round(elapsed / 60));
    startTransition(async () => {
      const { error } = await logPracticeTime(taskId, mins);
      if (!error) {
        setTodayLogs(prev => {
          const ex = prev.find(l => l.task_id === taskId);
          return ex
            ? prev.map(l => l.task_id === taskId ? { ...l, minutes: l.minutes + mins } : l)
            : [...prev, { task_id: taskId, minutes: mins }];
        });
        setSaved(true);
        setShowDetail(true);
        reset();
      }
    });
  };

  // Aggregate minutes per task
  const minutesByTask: Record<string, number> = {};
  todayLogs.forEach(l => { minutesByTask[l.task_id] = (minutesByTask[l.task_id] ?? 0) + l.minutes; });
  const hasProgress = tasks.some(t => (minutesByTask[t.id] ?? 0) > 0);
  const elapsedMins = Math.round(elapsed / 60);
  const isStopped   = !running && elapsed > 0;

  if (tasks.length === 0) {
    return (
      <div className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-smoke/60 bg-ash/20 px-4 py-2.5">
        <span className="text-xs text-stone-600">Sin tareas · </span>
        <a href="/planificador" className="text-xs text-ember hover:text-amber transition">
          Crear en Planificador →
        </a>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-2xl border border-smoke bg-ash/40 overflow-hidden">

      {/* ── Compact strip (always visible) ──────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-3">

        {/* Timer display */}
        <span className={`font-mono text-xl font-bold tabular-nums w-14 shrink-0 ${
          running ? "text-ember" : elapsed > 0 ? "text-amber" : "text-stone-600"
        }`}>
          {fmt(elapsed)}
        </span>

        {/* Start / Pause */}
        <button onClick={toggle}
          className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-display font-bold uppercase tracking-wider transition ${
            running
              ? "bg-stone-700 text-stone-200 hover:bg-stone-600"
              : elapsed > 0
              ? "bg-amber/20 border border-amber/40 text-amber hover:bg-amber/30"
              : "bg-ember text-ink hover:bg-amber"
          }`}>
          {running ? "⏸" : elapsed > 0 ? "▶" : "▶"}&nbsp;{running ? "Pausar" : elapsed > 0 ? "Cont." : "Iniciar"}
        </button>

        {/* Reset (only when stopped with time) */}
        {isStopped && (
          <button onClick={reset}
            className="shrink-0 text-stone-600 hover:text-stone-400 transition text-sm"
            title="Reiniciar">
            ↺
          </button>
        )}

        {/* Spacer */}
        <div className="flex-1 min-w-0" />

        {/* Saved flash */}
        {saved && (
          <span className="shrink-0 text-[10px] font-bold text-sage whitespace-nowrap">
            ✓ Guardado
          </span>
        )}

        {/* Progress toggle (only if there's data) */}
        {hasProgress && !isStopped && (
          <button onClick={() => setShowDetail(v => !v)}
            title="Ver progreso de hoy"
            className="shrink-0 text-stone-600 hover:text-stone-400 transition text-sm">
            {showDetail ? "▲" : "▼"}
          </button>
        )}
      </div>

      {/* ── Save panel (visible when stopped with elapsed > 0) ───────────────── */}
      {isStopped && (
        <div className="border-t border-smoke/50 bg-amber/5 px-4 py-3 space-y-2.5">
          <p className="text-xs text-stone-400">
            Guardar <strong className="text-amber">{elapsedMins < 1 ? "<1" : elapsedMins} min</strong> en:
          </p>
          <div className="flex gap-2">
            <select value={taskId} onChange={e => setTaskId(e.target.value)}
              className="flex-1 min-w-0 rounded-lg border border-smoke bg-ink/60 px-3 py-2 text-sm text-bone outline-none focus:border-ember truncate">
              {tasks.map(t => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.duration_minutes} min/día)
                </option>
              ))}
            </select>
            <button onClick={save} disabled={isPending}
              className="shrink-0 rounded-lg bg-ember px-4 py-2 font-display font-bold text-xs uppercase tracking-wider text-ink transition hover:bg-amber disabled:opacity-50">
              {isPending ? "…" : "✓ Guardar"}
            </button>
          </div>
        </div>
      )}

      {/* ── Today progress (collapsible) ─────────────────────────────────────── */}
      {showDetail && hasProgress && !isStopped && (
        <div className="border-t border-smoke/50 px-4 py-3 space-y-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
            Progreso de hoy
          </p>
          {tasks.map(task => {
            const logged = minutesByTask[task.id] ?? 0;
            if (logged === 0) return null;
            const target = task.duration_minutes;
            const pct    = Math.min(logged / target, 1);
            const done   = logged >= target;
            return (
              <div key={task.id}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${colorBar[task.color] ?? "bg-ember"}`} />
                    <span className={`text-xs font-medium truncate max-w-[120px] ${done ? "text-sage" : "text-stone-300"}`}>
                      {task.title}
                    </span>
                    {done && <span className="text-[11px]">🎸</span>}
                  </div>
                  <span className={`text-xs font-mono font-bold shrink-0 ml-2 ${
                    done ? "text-sage" : (colorText[task.color] ?? "text-ember")
                  }`}>
                    {logged}/{target} min
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-smoke">
                  <div className={`h-full rounded-full transition-all duration-500 ${
                    done ? "bg-sage" : (colorBar[task.color] ?? "bg-ember")
                  }`} style={{ width: `${pct * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
