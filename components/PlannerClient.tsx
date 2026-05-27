"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  toggleCompletion,
  createTask,
  updateTask,
  deleteTask,
} from "@/app/planificador/actions";
import { TASK_CATEGORY_META, TASK_CATEGORIES } from "@/lib/types";
import type { PracticeTask, TaskCategory } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CalendarDay {
  dateStr:          string;
  dayNum:           number;
  isToday:          boolean;
  isFuture:         boolean;
  isCurrentMonth:   boolean;
  completedTaskIds: string[];
}

interface Props {
  tasks:        PracticeTask[];
  calendarDays: CalendarDay[];   // exactly 7 items (Mon → Sun)
  todayStr:     string;
  weekStart:    string;           // YYYY-MM-DD of Monday
}

type View = "calendar" | "tasks";

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_OPTIONS = [
  { value: "ember",  label: "Naranja", cls: "bg-ember"     },
  { value: "amber",  label: "Dorado",  cls: "bg-amber"     },
  { value: "sage",   label: "Verde",   cls: "bg-sage"      },
  { value: "sky",    label: "Azul",    cls: "bg-sky-400"   },
  { value: "stone",  label: "Gris",    cls: "bg-stone-500" },
];

const colorBar: Record<string, string> = {
  ember: "bg-ember", amber: "bg-amber", sage: "bg-sage",
  sky: "bg-sky-400", stone: "bg-stone-500",
};

const colorFill: Record<string, string> = {
  ember: "bg-ember border-ember text-ink",
  amber: "bg-amber border-amber text-ink",
  sage:  "bg-sage  border-sage  text-ink",
  sky:   "bg-sky-400 border-sky-400 text-ink",
  stone: "bg-stone-500 border-stone-500 text-ink",
};

const DAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const MONTH_SHORT = [
  "ene","feb","mar","abr","may","jun",
  "jul","ago","sep","oct","nov","dic",
];

function catIcon(c: TaskCategory)  { return TASK_CATEGORY_META[c]?.icon  ?? "◆"; }
function catLabel(c: TaskCategory) { return TASK_CATEGORY_META[c]?.label ?? c;   }

/** "26 may – 1 jun" or "26 – 31 mayo" */
function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + "T12:00:00");
  const end   = new Date(weekStart + "T12:00:00");
  end.setDate(end.getDate() + 6);
  const sm = MONTH_SHORT[start.getMonth()];
  const em = MONTH_SHORT[end.getMonth()];
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} – ${end.getDate()} de ${sm}`;
  }
  return `${start.getDate()} ${sm} – ${end.getDate()} ${em}`;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlannerClient({
  tasks: initialTasks,
  calendarDays,
  todayStr,
  weekStart,
}: Props) {
  const router = useRouter();
  const [view,  setView]  = useState<View>("calendar");
  const [tasks, setTasks] = useState(initialTasks);
  const [isPending, startTransition] = useTransition();

  // completions cache: dateStr → Set<taskId>
  const [doneMap, setDoneMap] = useState<Record<string, Set<string>>>(() => {
    const m: Record<string, Set<string>> = {};
    calendarDays.forEach(d => { m[d.dateStr] = new Set(d.completedTaskIds); });
    return m;
  });

  // Week navigation — push new ?w= param
  const navigate = (delta: number) => {
    const d = new Date(weekStart + "T12:00:00");
    d.setDate(d.getDate() + delta * 7);
    router.push(`/planificador?w=${d.toISOString().slice(0, 10)}`);
  };

  const handleToggle = (taskId: string, dateStr: string) => {
    const set    = new Set(doneMap[dateStr] ?? []);
    const wasDone = set.has(taskId);
    wasDone ? set.delete(taskId) : set.add(taskId);
    setDoneMap(prev => ({ ...prev, [dateStr]: set }));
    startTransition(() => toggleCompletion(taskId, dateStr, wasDone));
  };

  // Today stats
  const todayDone    = doneMap[todayStr] ?? new Set<string>();
  const totalMin     = tasks.reduce((s, t) => s + t.duration_minutes, 0);
  const doneMin      = tasks.filter(t => todayDone.has(t.id)).reduce((s, t) => s + t.duration_minutes, 0);
  const donePct      = totalMin > 0 ? Math.min(doneMin / totalMin, 1) : 0;
  const allDoneToday = tasks.length > 0 && todayDone.size >= tasks.length;

  // Is current week (contains today)?
  const isCurrentWeek = calendarDays.some(d => d.dateStr === todayStr);

  // Weekly completion %
  const pastDays  = calendarDays.filter(d => !d.isFuture);
  const weekTotal = pastDays.length * tasks.length;
  const weekDone  = pastDays.reduce((s, d) => s + (doneMap[d.dateStr]?.size ?? 0), 0);
  const weekPct   = weekTotal > 0 ? Math.round((weekDone / weekTotal) * 100) : 0;

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-bone">Planificador</h1>
          {isCurrentWeek && tasks.length > 0 && (
            <p className="mt-0.5 text-sm text-stone-400">
              Hoy: {doneMin}/{totalMin} min
              {allDoneToday && " · ¡Sesión completa! 🎸"}
            </p>
          )}
        </div>

        {/* View toggle */}
        <div className="flex gap-1 rounded-xl border border-smoke bg-ash/60 p-1">
          <button onClick={() => setView("calendar")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              view === "calendar" ? "bg-smoke text-bone shadow" : "text-stone-400 hover:text-bone"
            }`}>
            Semana
          </button>
          <button onClick={() => setView("tasks")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              view === "tasks" ? "bg-smoke text-bone shadow" : "text-stone-400 hover:text-bone"
            }`}>
            Mis tareas
          </button>
        </div>
      </div>

      {/* ── Today progress bar ──────────────────────────────────────────────── */}
      {view === "calendar" && isCurrentWeek && tasks.length > 0 && (
        <div className="mb-5 overflow-hidden rounded-xl border border-smoke bg-ash/40 px-5 py-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider text-stone-500">Progreso de hoy</p>
            <p className={`text-sm font-display font-bold ${allDoneToday ? "text-sage" : "text-bone"}`}>
              {Math.round(donePct * 100)}%
            </p>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-smoke">
            <div
              className={`h-full rounded-full transition-all duration-500 ${allDoneToday ? "bg-sage" : "bg-ember"}`}
              style={{ width: `${donePct * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Weekly calendar view ─────────────────────────────────────────────── */}
      {view === "calendar" && (
        <div>
          {/* Week navigation */}
          <div className="mb-4 flex items-center justify-between gap-3">
            <button onClick={() => navigate(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-smoke text-stone-400 transition hover:border-ember/40 hover:text-ember text-lg">
              ‹
            </button>
            <div className="text-center">
              <p className="font-display text-base font-bold text-bone capitalize">
                {formatWeekRange(weekStart)}
              </p>
              {weekTotal > 0 && (
                <p className="text-[11px] text-stone-500">{weekPct}% de la semana completado</p>
              )}
            </div>
            <button onClick={() => navigate(1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-smoke text-stone-400 transition hover:border-ember/40 hover:text-ember text-lg">
              ›
            </button>
          </div>

          {/* ── Weekly grid ───────────────────────────────────────────────── */}
          {tasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-smoke py-14 text-center">
              <p className="text-stone-500 text-sm mb-4">Aún no tienes tareas de práctica</p>
              <button onClick={() => setView("tasks")}
                className="rounded-xl bg-ember px-5 py-2 text-sm font-display font-bold uppercase tracking-wider text-ink transition hover:bg-amber">
                Crear mis tareas →
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-smoke bg-ash/30"
              style={{ scrollbarWidth: "thin" }}>
              <table className="w-full min-w-[520px] border-collapse">
                {/* ── Day header row ─────────────────────────────────────── */}
                <thead>
                  <tr>
                    {/* Task label column header */}
                    <th className="w-40 border-b border-r border-smoke px-4 py-3 text-left">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-stone-600">
                        Tarea
                      </span>
                    </th>

                    {calendarDays.map(day => {
                      const dayName = DAY_SHORT[new Date(day.dateStr + "T12:00:00").getDay()];
                      return (
                        <th key={day.dateStr}
                          className={`border-b border-smoke px-2 py-3 text-center last:border-r-0 ${
                            day.isToday ? "bg-ember/10" : ""
                          }`}>
                          <div className={`text-[10px] font-medium uppercase tracking-wider ${
                            day.isToday ? "text-ember" : "text-stone-500"
                          }`}>
                            {dayName}
                          </div>
                          <div className={`mt-1 flex h-8 w-8 mx-auto items-center justify-center rounded-full font-display font-extrabold text-base ${
                            day.isToday
                              ? "bg-ember text-ink"
                              : day.isFuture
                              ? "text-stone-600"
                              : "text-bone"
                          }`}>
                            {day.dayNum}
                          </div>
                          {day.isToday && (
                            <div className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-ember">
                              hoy
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                {/* ── Task rows ──────────────────────────────────────────── */}
                <tbody>
                  {tasks.map((task, ti) => (
                    <tr key={task.id}
                      className={ti % 2 === 0 ? "bg-ash/10" : "bg-ash/30"}>
                      {/* Task info */}
                      <td className="border-r border-smoke/50 px-4 py-3.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-1 h-9 rounded-full shrink-0 ${colorBar[task.color] ?? "bg-ember"}`} />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-bone leading-snug truncate max-w-[110px]">
                              {task.title}
                            </p>
                            <p className="text-[10px] text-stone-500 mt-0.5 whitespace-nowrap">
                              {catIcon(task.category)} {task.duration_minutes} min
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Day cells */}
                      {calendarDays.map(day => {
                        const done = doneMap[day.dateStr]?.has(task.id) ?? false;
                        return (
                          <td key={day.dateStr}
                            className={`px-2 py-3 text-center ${day.isToday ? "bg-ember/5" : ""}`}>
                            {!day.isFuture ? (
                              <button
                                onClick={() => handleToggle(task.id, day.dateStr)}
                                disabled={isPending}
                                title={done ? "Marcar como pendiente" : "Marcar como completado"}
                                className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                                  done
                                    ? (colorFill[task.color] ?? "bg-ember border-ember text-ink")
                                    : "border-stone-700 bg-transparent hover:border-stone-400 hover:bg-ash/60"
                                } disabled:opacity-60`}
                              >
                                {done && (
                                  <svg className="h-3.5 w-3.5" viewBox="0 0 12 10" fill="none">
                                    <path d="M1 5l3.5 3.5L11 1" stroke="currentColor"
                                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </button>
                            ) : (
                              <div className="mx-auto h-8 w-8 rounded-full border-2 border-stone-800 opacity-20" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>

                {/* ── Footer: daily totals ───────────────────────────────── */}
                <tfoot>
                  <tr>
                    <td className="border-r border-t border-smoke/50 px-4 py-2.5">
                      <span className="text-[10px] uppercase tracking-wider text-stone-600">
                        Total
                      </span>
                    </td>
                    {calendarDays.map(day => {
                      const cnt      = doneMap[day.dateStr]?.size ?? 0;
                      const total    = tasks.length;
                      const allDone  = total > 0 && cnt >= total;
                      const doneMinD = tasks
                        .filter(t => doneMap[day.dateStr]?.has(t.id))
                        .reduce((s, t) => s + t.duration_minutes, 0);

                      return (
                        <td key={day.dateStr}
                          className={`border-t border-smoke/50 px-2 py-2.5 text-center ${
                            day.isToday ? "bg-ember/5" : ""
                          }`}>
                          {!day.isFuture && total > 0 ? (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className={`text-xs font-bold font-mono ${
                                allDone  ? "text-sage"
                                : cnt > 0 ? "text-amber"
                                : "text-stone-600"
                              }`}>
                                {cnt}/{total}
                              </span>
                              {doneMinD > 0 && (
                                <span className="text-[9px] text-stone-600">
                                  {doneMinD} min
                                </span>
                              )}
                              {allDone && <span className="text-[10px]">🎸</span>}
                            </div>
                          ) : (
                            <span className="text-stone-800 text-xs">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Scroll hint on small screens */}
          <p className="mt-2 text-[10px] text-stone-700 sm:hidden text-center">
            ← Desliza para ver todos los días →
          </p>
        </div>
      )}

      {/* ── Tasks view ──────────────────────────────────────────────────────── */}
      {view === "tasks" && (
        <ManageView tasks={tasks} setTasks={setTasks} />
      )}
    </div>
  );
}

// ─── Manage view ──────────────────────────────────────────────────────────────

function ManageView({
  tasks,
  setTasks,
}: {
  tasks: PracticeTask[];
  setTasks: (t: PracticeTask[]) => void;
}) {
  const [showForm, setShowForm]     = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const totalMin = tasks.reduce((s, t) => s + t.duration_minutes, 0);

  const handleCreate = (fd: FormData) => {
    startTransition(async () => {
      await createTask(fd);
      formRef.current?.reset();
      setShowForm(false);
    });
  };

  const handleUpdate = (id: string, fd: FormData) => {
    startTransition(async () => {
      await updateTask(id, fd);
      setEditingId(null);
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => { await deleteTask(id); });
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-stone-300">Tareas de práctica diaria</p>
          {tasks.length > 0 && (
            <p className="text-xs text-stone-500 mt-0.5">
              {tasks.length} tarea{tasks.length > 1 ? "s" : ""} · {totalMin} min/día
            </p>
          )}
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="rounded-xl bg-ember px-4 py-2 text-sm font-display font-bold uppercase tracking-wider text-ink transition hover:bg-amber">
            + Nueva
          </button>
        )}
      </div>

      {showForm && (
        <TaskForm
          formRef={formRef}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          isPending={isPending}
        />
      )}

      <div className="space-y-2 mt-2">
        {tasks.map(task => (
          <div key={task.id}>
            {editingId === task.id ? (
              <TaskForm
                defaultValues={task}
                onSubmit={(fd) => handleUpdate(task.id, fd)}
                onCancel={() => setEditingId(null)}
                isPending={isPending}
                isEdit
              />
            ) : (
              <div className="flex items-center gap-3 rounded-2xl border border-smoke bg-ash/40 px-4 py-3.5 transition hover:border-stone-700">
                <div className={`w-1 self-stretch rounded-full shrink-0 ${colorBar[task.color] ?? "bg-ember"}`} />
                <span className="text-lg">{catIcon(task.category)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-bone truncate">{task.title}</p>
                  <p className="text-xs text-stone-500">{catLabel(task.category)} · {task.duration_minutes} min</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => setEditingId(task.id)}
                    className="rounded-lg border border-smoke px-2.5 py-1 text-xs text-stone-400 transition hover:border-ember/40 hover:text-ember">
                    Editar
                  </button>
                  <button onClick={() => handleDelete(task.id)} disabled={isPending}
                    className="rounded-lg border border-smoke px-2.5 py-1 text-xs text-stone-400 transition hover:border-rust/40 hover:text-rust disabled:opacity-40">
                    ×
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {tasks.length === 0 && !showForm && (
        <div className="mt-4 rounded-2xl border border-dashed border-smoke py-12 text-center">
          <p className="text-3xl mb-3">◆</p>
          <p className="text-stone-400 mb-1">Aún no hay tareas</p>
          <p className="text-xs text-stone-600">
            Ej: Técnica 20 min · Improvisación 15 min · Canción 25 min
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Task form ────────────────────────────────────────────────────────────────

function TaskForm({
  defaultValues,
  onSubmit,
  onCancel,
  isPending,
  isEdit = false,
  formRef,
}: {
  defaultValues?: PracticeTask;
  onSubmit: (fd: FormData) => void;
  onCancel: () => void;
  isPending: boolean;
  isEdit?: boolean;
  formRef?: React.RefObject<HTMLFormElement>;
}) {
  const [color, setColor] = useState(defaultValues?.color ?? "ember");

  return (
    <div className="rounded-2xl border border-ember/30 bg-ember/5 p-5 mb-2">
      <p className="text-sm font-display font-bold text-bone mb-4">
        {isEdit ? "Editar tarea" : "Nueva tarea de práctica"}
      </p>
      <form ref={formRef} action={onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-stone-500">Nombre</label>
            <input type="text" name="title" defaultValue={defaultValues?.title} required
              placeholder="Ej: Técnica con metrónomo"
              className="w-full rounded-lg border border-smoke bg-ink/60 px-3 py-2.5 text-sm text-bone outline-none focus:border-ember placeholder:text-stone-600" />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-stone-500">Categoría</label>
            <select name="category" defaultValue={defaultValues?.category ?? "tecnica"}
              className="w-full rounded-lg border border-smoke bg-ink/60 px-3 py-2.5 text-sm text-bone outline-none focus:border-ember">
              {TASK_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {TASK_CATEGORY_META[cat].icon} {TASK_CATEGORY_META[cat].label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-stone-500">Duración (min)</label>
            <input type="number" name="duration_minutes"
              defaultValue={defaultValues?.duration_minutes ?? 15} min={1} max={180} required
              className="w-full rounded-lg border border-smoke bg-ink/60 px-3 py-2.5 text-sm text-bone outline-none focus:border-ember" />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-stone-500">Color</label>
            <input type="hidden" name="color" value={color} />
            <div className="flex gap-2 mt-1.5">
              {COLOR_OPTIONS.map(c => (
                <button key={c.value} type="button" onClick={() => setColor(c.value)} title={c.label}
                  className={`h-7 w-7 rounded-full transition-all ${c.cls} ${
                    color === c.value
                      ? "ring-2 ring-bone ring-offset-2 ring-offset-ink scale-110"
                      : "opacity-50 hover:opacity-80"
                  }`} />
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <button type="submit" disabled={isPending}
            className="rounded-xl bg-ember px-5 py-2 text-sm font-display font-bold uppercase tracking-wider text-ink transition hover:bg-amber disabled:opacity-50">
            {isPending ? "Guardando…" : isEdit ? "Guardar" : "Crear tarea"}
          </button>
          <button type="button" onClick={onCancel}
            className="rounded-xl border border-smoke px-5 py-2 text-sm text-stone-400 transition hover:text-bone">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
