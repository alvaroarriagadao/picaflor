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
  dateStr: string;
  dayNum: number;
  isToday: boolean;
  isFuture: boolean;
  isCurrentMonth: boolean;
  completedTaskIds: string[];
}

interface Props {
  tasks: PracticeTask[];
  calendarDays: CalendarDay[];
  todayStr: string;
  currentMonth: { year: number; month: number; label: string };
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

const colorDot: Record<string, string> = {
  ember: "bg-ember", amber: "bg-amber", sage: "bg-sage",
  sky: "bg-sky-400", stone: "bg-stone-400",
};

const DAY_HEADERS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const MONTH_NAMES = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

function catIcon(c: TaskCategory)  { return TASK_CATEGORY_META[c]?.icon  ?? "◆"; }
function catLabel(c: TaskCategory) { return TASK_CATEGORY_META[c]?.label ?? c;   }

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  const dayNames = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  return `${dayNames[d.getDay()]} ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]}`;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlannerClient({
  tasks: initialTasks,
  calendarDays,
  todayStr,
  currentMonth,
}: Props) {
  const router = useRouter();
  const [view, setView]   = useState<View>("calendar");
  const [tasks, setTasks] = useState(initialTasks);
  const [isPending, startTransition] = useTransition();

  // completions cache: dateStr → Set<taskId>
  const [doneMap, setDoneMap] = useState<Record<string, Set<string>>>(() => {
    const m: Record<string, Set<string>> = {};
    calendarDays.forEach(d => { m[d.dateStr] = new Set(d.completedTaskIds); });
    return m;
  });

  // Selected day defaults to today (if in this month) or first of month
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const hasTodayInMonth = calendarDays.some(d => d.dateStr === todayStr && d.isCurrentMonth);
    if (hasTodayInMonth) return todayStr;
    return calendarDays.find(d => d.isCurrentMonth)?.dateStr ?? todayStr;
  });

  // Month navigation
  const navigate = (delta: number) => {
    const d = new Date(currentMonth.year, currentMonth.month - 1 + delta, 1);
    const m = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    router.push(`/planificador?m=${m}`);
  };

  const handleToggle = (taskId: string, dateStr: string) => {
    const set = new Set(doneMap[dateStr] ?? []);
    const wasDone = set.has(taskId);
    wasDone ? set.delete(taskId) : set.add(taskId);
    setDoneMap(prev => ({ ...prev, [dateStr]: set }));
    startTransition(() => toggleCompletion(taskId, dateStr, wasDone));
  };

  // Stats for today
  const todayDone   = doneMap[todayStr] ?? new Set<string>();
  const totalMin    = tasks.reduce((s, t) => s + t.duration_minutes, 0);
  const doneMin     = tasks.filter(t => todayDone.has(t.id)).reduce((s, t) => s + t.duration_minutes, 0);
  const donePct     = totalMin > 0 ? Math.min(doneMin / totalMin, 1) : 0;
  const allDoneToday = tasks.length > 0 && todayDone.size >= tasks.length;

  // Monthly completion rate
  const currentDays  = calendarDays.filter(d => d.isCurrentMonth && !d.isFuture);
  const monthTotal   = currentDays.length * tasks.length;
  const monthDone    = currentDays.reduce((s, d) => s + (doneMap[d.dateStr]?.size ?? 0), 0);
  const monthPct     = monthTotal > 0 ? Math.round((monthDone / monthTotal) * 100) : 0;

  const isCurrentMonth = (() => {
    const now = new Date();
    return now.getFullYear() === currentMonth.year && now.getMonth() + 1 === currentMonth.month;
  })();

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-bone">Planificador</h1>
          {isCurrentMonth && tasks.length > 0 && (
            <p className="mt-0.5 text-sm text-stone-400">
              Hoy: {doneMin}/{totalMin} min
              {allDoneToday && " · ¡Completado! 🎸"}
            </p>
          )}
        </div>

        {/* View toggle */}
        <div className="flex gap-1 rounded-xl border border-smoke bg-ash/60 p-1">
          <button onClick={() => setView("calendar")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              view === "calendar" ? "bg-smoke text-bone shadow" : "text-stone-400 hover:text-bone"
            }`}>
            Calendario
          </button>
          <button onClick={() => setView("tasks")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              view === "tasks" ? "bg-smoke text-bone shadow" : "text-stone-400 hover:text-bone"
            }`}>
            Mis tareas
          </button>
        </div>
      </div>

      {/* ── Today progress bar (only in calendar view, current month) ───────── */}
      {view === "calendar" && isCurrentMonth && tasks.length > 0 && (
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

      {/* ── Calendar view ───────────────────────────────────────────────────── */}
      {view === "calendar" && (
        <div>
          {/* Month navigation */}
          <div className="mb-4 flex items-center justify-between">
            <button onClick={() => navigate(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-smoke text-stone-400 transition hover:border-ember/40 hover:text-ember">
              ‹
            </button>
            <div className="text-center">
              <p className="font-display text-lg font-bold text-bone">{currentMonth.label}</p>
              {monthTotal > 0 && (
                <p className="text-xs text-stone-500">{monthPct}% del mes completado</p>
              )}
            </div>
            <button onClick={() => navigate(1)}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-smoke text-stone-400 transition hover:border-ember/40 hover:text-ember">
              ›
            </button>
          </div>

          {/* Calendar grid */}
          <div className="mb-5 overflow-hidden rounded-2xl border border-smoke bg-ash/30">
            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 border-b border-smoke">
              {DAY_HEADERS.map(h => (
                <div key={h} className="py-2 text-center text-[11px] font-medium uppercase tracking-wider text-stone-500">
                  {h}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map((day, idx) => {
                const done  = doneMap[day.dateStr] ?? new Set<string>();
                const total = tasks.length;
                const cnt   = done.size;
                const allDone = total > 0 && cnt >= total;
                const hasSome = cnt > 0;
                const isSelected = day.dateStr === selectedDate;

                // Border between rows
                const isLastInRow = (idx + 1) % 7 === 0;
                const isLastRow   = idx >= calendarDays.length - 7;

                return (
                  <button
                    key={day.dateStr}
                    onClick={() => {
                      setSelectedDate(day.dateStr);
                    }}
                    className={`relative flex flex-col items-center gap-1 py-2.5 px-1 transition-colors min-h-[72px]
                      ${!isLastRow ? "border-b border-smoke/60" : ""}
                      ${!isLastInRow ? "border-r border-smoke/60" : ""}
                      ${isSelected
                        ? "bg-ember/12"
                        : day.isToday
                        ? "bg-ember/6"
                        : "hover:bg-ash/60"
                      }
                    `}
                  >
                    {/* Day number */}
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium transition-all
                      ${isSelected && day.isToday
                        ? "bg-ember text-ink font-bold"
                        : isSelected
                        ? "bg-smoke text-bone font-bold"
                        : day.isToday
                        ? "bg-ember/20 text-ember font-bold"
                        : day.isCurrentMonth
                        ? allDone
                          ? "text-sage"
                          : "text-bone"
                        : "text-stone-700"
                      }
                    `}>
                      {day.dayNum}
                    </span>

                    {/* Task dots */}
                    {total > 0 && !day.isFuture && (
                      <div className="flex flex-wrap justify-center gap-0.5 max-w-[36px]">
                        {tasks.map(task => (
                          <div key={task.id}
                            className={`h-1.5 w-1.5 rounded-full transition-colors ${
                              done.has(task.id)
                                ? (colorDot[task.color] ?? "bg-ember")
                                : day.isCurrentMonth
                                ? "bg-stone-700"
                                : "bg-stone-800"
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Today ring */}
                    {day.isToday && !isSelected && (
                      <span className="absolute inset-0 rounded-none pointer-events-none" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected day panel */}
          <SelectedDayPanel
            dateStr={selectedDate}
            tasks={tasks}
            doneIds={doneMap[selectedDate] ?? new Set()}
            isPending={isPending}
            onToggle={(id) => handleToggle(id, selectedDate)}
            onGoToTasks={() => setView("tasks")}
          />
        </div>
      )}

      {/* ── Tasks view ──────────────────────────────────────────────────────── */}
      {view === "tasks" && (
        <ManageView tasks={tasks} setTasks={setTasks} />
      )}
    </div>
  );
}

// ─── Selected day panel ───────────────────────────────────────────────────────

function SelectedDayPanel({
  dateStr,
  tasks,
  doneIds,
  isPending,
  onToggle,
  onGoToTasks,
}: {
  dateStr: string;
  tasks: PracticeTask[];
  doneIds: Set<string>;
  isPending: boolean;
  onToggle: (id: string) => void;
  onGoToTasks: () => void;
}) {
  const isFuture = dateStr > new Date().toISOString().slice(0, 10);
  const allDone  = tasks.length > 0 && doneIds.size >= tasks.length;
  const totalMin = tasks.reduce((s, t) => s + t.duration_minutes, 0);
  const doneMin  = tasks.filter(t => doneIds.has(t.id)).reduce((s, t) => s + t.duration_minutes, 0);

  return (
    <div className="rounded-2xl border border-smoke bg-ash/40 overflow-hidden">
      {/* Header */}
      <div className={`px-5 py-3 border-b border-smoke flex items-center justify-between ${
        allDone ? "bg-sage/8" : ""
      }`}>
        <div>
          <p className="text-xs uppercase tracking-wider text-stone-500">Práctica del día</p>
          <p className="font-display font-bold text-bone mt-0.5 capitalize">
            {formatDate(dateStr)}
          </p>
        </div>
        {tasks.length > 0 && !isFuture && (
          <div className="text-right">
            <p className={`font-display text-xl font-extrabold ${allDone ? "text-sage" : "text-bone"}`}>
              {doneMin}<span className="text-xs font-normal text-stone-500">/{totalMin} min</span>
            </p>
            {allDone && <p className="text-xs text-sage">¡Completado! 🎸</p>}
          </div>
        )}
      </div>

      {/* Task list */}
      {tasks.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-stone-500 text-sm mb-3">Aún no tienes tareas de práctica</p>
          <button onClick={onGoToTasks}
            className="rounded-xl bg-ember px-5 py-2 text-sm font-display font-bold uppercase tracking-wider text-ink transition hover:bg-amber">
            Crear mis tareas →
          </button>
        </div>
      ) : (
        <div className="divide-y divide-smoke/50">
          {tasks.map(task => {
            const done = doneIds.has(task.id);
            return (
              <button
                key={task.id}
                onClick={() => !isFuture && onToggle(task.id)}
                disabled={isFuture || isPending}
                className={`group w-full flex items-center gap-4 px-5 py-4 text-left transition-colors
                  ${isFuture ? "opacity-40 cursor-default" : "hover:bg-ash/60"}
                  ${done && !isFuture ? "bg-sage/5" : ""}
                `}
              >
                {/* Color accent */}
                <div className={`w-1 self-stretch rounded-full shrink-0 ${colorBar[task.color] ?? "bg-ember"} ${done ? "opacity-40" : ""}`} />

                {/* Checkbox */}
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                  done
                    ? "border-sage bg-sage text-ink"
                    : isFuture
                    ? "border-stone-700"
                    : "border-stone-600 group-hover:border-ember"
                }`}>
                  {done && (
                    <svg className="h-3 w-3" viewBox="0 0 12 10" fill="none">
                      <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={`font-medium transition-all ${done ? "line-through text-stone-500" : "text-bone"}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {catIcon(task.category)} {catLabel(task.category)}
                  </p>
                </div>

                {/* Duration */}
                <p className={`shrink-0 text-sm font-mono ${done ? "text-stone-600" : "text-stone-400"}`}>
                  {task.duration_minutes}<span className="text-xs"> min</span>
                </p>
              </button>
            );
          })}
        </div>
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
  const [showForm, setShowForm]   = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
      {/* Header */}
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
