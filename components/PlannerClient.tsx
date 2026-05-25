"use client";

import { useState, useTransition, useRef } from "react";
import { toggleCompletion, createTask, updateTask, deleteTask } from "@/app/planificador/actions";
import { TASK_CATEGORY_META, TASK_CATEGORIES } from "@/lib/types";
import type { PracticeTask, TaskCategory } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeekDay {
  dateStr: string;
  label: string;
  dayNum: number;
  isToday: boolean;
  isFuture: boolean;
  completedIds: string[];
}

interface Props {
  tasks: PracticeTask[];
  weekData: WeekDay[];
  todayStr: string;
}

type Tab = "hoy" | "semana" | "gestionar";

const COLOR_OPTIONS = [
  { value: "ember",  label: "Naranja",  cls: "bg-ember"       },
  { value: "amber",  label: "Dorado",   cls: "bg-amber"       },
  { value: "sage",   label: "Verde",    cls: "bg-sage"        },
  { value: "sky",    label: "Azul",     cls: "bg-sky-400"     },
  { value: "stone",  label: "Gris",     cls: "bg-stone-500"   },
];

const colorBar: Record<string, string> = {
  ember: "bg-ember", amber: "bg-amber", sage: "bg-sage",
  sky: "bg-sky-400", stone: "bg-stone-500",
};

function catIcon(c: TaskCategory) { return TASK_CATEGORY_META[c]?.icon  ?? "◆"; }
function catLabel(c: TaskCategory){ return TASK_CATEGORY_META[c]?.label ?? c;   }

// ─── Component ────────────────────────────────────────────────────────────────

export default function PlannerClient({ tasks: initialTasks, weekData: initialWeek, todayStr }: Props) {
  const [tab, setTab]   = useState<Tab>("hoy");
  const [tasks, setTasks] = useState(initialTasks);
  const [isPending, startTransition] = useTransition();

  // Completados por día: { dateStr → Set<taskId> }
  const [weekMap, setWeekMap] = useState<Record<string, Set<string>>>(() => {
    const m: Record<string, Set<string>> = {};
    initialWeek.forEach(d => { m[d.dateStr] = new Set(d.completedIds); });
    return m;
  });

  const todayDone  = weekMap[todayStr] ?? new Set<string>();
  const totalMin   = tasks.reduce((s, t) => s + t.duration_minutes, 0);
  const doneMin    = tasks.filter(t => todayDone.has(t.id)).reduce((s, t) => s + t.duration_minutes, 0);
  const donePct    = totalMin > 0 ? Math.min(doneMin / totalMin, 1) : 0;
  const allDone    = tasks.length > 0 && todayDone.size === tasks.length;

  const handleToggle = (taskId: string, dateStr: string) => {
    const set    = new Set(weekMap[dateStr] ?? []);
    const wasDone = set.has(taskId);
    wasDone ? set.delete(taskId) : set.add(taskId);
    setWeekMap(prev => ({ ...prev, [dateStr]: set }));
    startTransition(() => toggleCompletion(taskId, dateStr, wasDone));
  };

  // Date label
  const d = new Date(todayStr + "T12:00:00");
  const dayNames   = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
  const monthNames = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const todayLabel = `${dayNames[d.getDay()]}, ${d.getDate()} de ${monthNames[d.getMonth()]}`;

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-bone">Planificador</h1>
            <p className="mt-0.5 text-stone-400 capitalize">{todayLabel}</p>
          </div>
          {tasks.length > 0 && (
            <div className="text-right">
              <p className={`text-2xl font-display font-extrabold ${allDone ? "text-sage" : "text-bone"}`}>
                {Math.round(donePct * 100)}<span className="text-sm font-normal text-stone-500">%</span>
              </p>
              <p className="text-xs text-stone-500">{doneMin} / {totalMin} min</p>
            </div>
          )}
        </div>

        {/* Barra de progreso */}
        {tasks.length > 0 && (
          <div className="h-2 w-full overflow-hidden rounded-full bg-smoke">
            <div
              className={`h-full rounded-full transition-all duration-500 ${allDone ? "bg-sage" : "bg-ember"}`}
              style={{ width: `${donePct * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="mb-6 flex gap-1 rounded-xl border border-smoke bg-ash/60 p-1">
        {(["hoy","semana","gestionar"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
              tab === t ? "bg-smoke text-bone shadow" : "text-stone-400 hover:text-bone"
            }`}>
            {t === "hoy" ? "Hoy" : t === "semana" ? "Esta semana" : "Mis tareas"}
          </button>
        ))}
      </div>

      {/* ── HOY ─────────────────────────────────────────────────────────────── */}
      {tab === "hoy" && (
        <TodayView
          tasks={tasks}
          doneIds={todayDone}
          todayStr={todayStr}
          isPending={isPending}
          onToggle={(id) => handleToggle(id, todayStr)}
          onGoSetup={() => setTab("gestionar")}
        />
      )}

      {/* ── SEMANA ──────────────────────────────────────────────────────────── */}
      {tab === "semana" && (
        <WeekView
          tasks={tasks}
          weekData={initialWeek.map(d => ({
            ...d,
            completedIds: Array.from(weekMap[d.dateStr] ?? []),
          }))}
          todayStr={todayStr}
          isPending={isPending}
          onToggle={handleToggle}
        />
      )}

      {/* ── GESTIONAR ───────────────────────────────────────────────────────── */}
      {tab === "gestionar" && (
        <ManageView tasks={tasks} setTasks={setTasks} />
      )}
    </div>
  );
}

// ─── Today view ───────────────────────────────────────────────────────────────

function TodayView({
  tasks, doneIds, todayStr, isPending, onToggle, onGoSetup,
}: {
  tasks: PracticeTask[];
  doneIds: Set<string>;
  todayStr: string;
  isPending: boolean;
  onToggle: (id: string) => void;
  onGoSetup: () => void;
}) {
  const allDone = tasks.length > 0 && doneIds.size === tasks.length;

  if (tasks.length === 0) {
    return (
      <div className="py-20 text-center">
        <p className="mb-3 text-5xl">🎸</p>
        <h3 className="font-display text-xl font-bold text-bone mb-2">Diseña tu práctica diaria</h3>
        <p className="text-stone-400 mb-6 max-w-sm mx-auto">
          Crea tus tareas (técnica, improvisación, canciones…) y márcalas cada día.
        </p>
        <button onClick={onGoSetup}
          className="rounded-xl bg-ember px-6 py-3 font-display font-bold uppercase tracking-wider text-ink text-sm transition hover:bg-amber">
          Crear mis tareas →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map(task => {
        const done = doneIds.has(task.id);
        return (
          <TaskCheckCard
            key={task.id}
            task={task}
            done={done}
            disabled={isPending}
            onToggle={() => onToggle(task.id)}
          />
        );
      })}

      {allDone && (
        <div className="mt-4 rounded-2xl border border-sage/40 bg-sage/10 px-6 py-5 text-center">
          <p className="text-3xl mb-2">🎸</p>
          <p className="font-display text-lg font-bold text-sage">¡Práctica completada!</p>
          <p className="text-sm text-stone-400 mt-1">
            {tasks.reduce((s, t) => s + t.duration_minutes, 0)} min · {tasks.length} tarea{tasks.length > 1 ? "s" : ""}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Task check card ──────────────────────────────────────────────────────────

function TaskCheckCard({ task, done, disabled, onToggle }: {
  task: PracticeTask; done: boolean; disabled: boolean; onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`group w-full text-left flex items-center gap-4 rounded-2xl border px-4 py-4 transition-all duration-300 ${
        done
          ? "border-sage/30 bg-sage/8 opacity-80"
          : "border-smoke bg-ash/40 hover:border-stone-600 hover:bg-ash/60"
      }`}
    >
      {/* Left color accent */}
      <div className={`w-1 self-stretch rounded-full shrink-0 ${colorBar[task.color] ?? "bg-ember"} ${done ? "opacity-40" : ""}`} />

      {/* Big circle checkbox */}
      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
        done
          ? "border-sage bg-sage text-ink"
          : "border-stone-600 group-hover:border-ember"
      }`}>
        {done && (
          <svg className="h-3.5 w-3.5" viewBox="0 0 12 10" fill="none">
            <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate transition-all ${done ? "line-through text-stone-500" : "text-bone"}`}>
          {task.title}
        </p>
        <p className="text-xs text-stone-500 mt-0.5">
          {catIcon(task.category)} {catLabel(task.category)}
        </p>
      </div>

      {/* Duration */}
      <div className="shrink-0 text-right">
        <p className={`text-sm font-mono ${done ? "text-stone-600" : "text-stone-400"}`}>
          {task.duration_minutes}<span className="text-xs"> min</span>
        </p>
      </div>
    </button>
  );
}

// ─── Week view ────────────────────────────────────────────────────────────────

function WeekView({
  tasks, weekData, todayStr, isPending, onToggle,
}: {
  tasks: PracticeTask[];
  weekData: (WeekDay & { completedIds: string[] })[];
  todayStr: string;
  isPending: boolean;
  onToggle: (taskId: string, dateStr: string) => void;
}) {
  // Abiertos por defecto: hoy + días pasados con actividad
  const defaultOpen = new Set(
    weekData
      .filter(d => d.isToday || (!d.isFuture && d.completedIds.length > 0))
      .map(d => d.dateStr)
  );
  const [openDays, setOpenDays] = useState<Set<string>>(defaultOpen);

  const toggleDay = (dateStr: string) => {
    setOpenDays(prev => {
      const next = new Set(prev);
      next.has(dateStr) ? next.delete(dateStr) : next.add(dateStr);
      return next;
    });
  };

  if (tasks.length === 0) {
    return (
      <p className="py-10 text-center text-stone-500">
        Crea tareas en «Mis tareas» para ver tu progreso semanal.
      </p>
    );
  }

  // Resumen semanal
  const totalPossible = tasks.length * weekData.filter(d => !d.isFuture).length;
  const totalDone     = weekData.reduce((s, d) => s + d.completedIds.length, 0);
  const weekPct       = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;

  return (
    <div>
      {/* Resumen */}
      <div className="mb-5 flex items-center justify-between rounded-2xl border border-smoke bg-ash/40 px-5 py-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-stone-500 mb-1">Semana</p>
          <p className="font-display text-xl font-bold text-bone">
            {totalDone} <span className="text-stone-500 font-normal text-sm">/ {totalPossible} tareas</span>
          </p>
        </div>
        <div className="text-right">
          <p className={`text-2xl font-display font-extrabold ${weekPct >= 80 ? "text-sage" : weekPct >= 40 ? "text-amber" : "text-stone-400"}`}>
            {weekPct}%
          </p>
          <p className="text-xs text-stone-600">completado</p>
        </div>
      </div>

      {/* Días Lun→Dom */}
      <div className="space-y-2">
        {weekData.map(day => {
          const isOpen     = openDays.has(day.dateStr);
          const doneCnt    = day.completedIds.length;
          const total      = tasks.length;
          const pct        = total > 0 ? doneCnt / total : 0;
          const allDone    = doneCnt === total && total > 0;
          const hasAny     = doneCnt > 0;

          return (
            <div key={day.dateStr}
              className={`overflow-hidden rounded-2xl border transition-all ${
                day.isToday
                  ? "border-ember/40 bg-ember/5"
                  : allDone
                  ? "border-sage/30 bg-sage/5"
                  : "border-smoke bg-ash/30"
              }`}>

              {/* Day header — clickable */}
              <button
                onClick={() => toggleDay(day.dateStr)}
                className="w-full flex items-center gap-4 px-4 py-3.5 text-left"
              >
                {/* Day label */}
                <div className="w-10 text-center shrink-0">
                  <p className={`text-[11px] font-medium uppercase ${day.isToday ? "text-ember" : "text-stone-500"}`}>
                    {day.label}
                  </p>
                  <p className={`text-xl font-display font-bold leading-none mt-0.5 ${
                    day.isToday ? "text-ember" : day.isFuture ? "text-stone-600" : "text-bone"
                  }`}>
                    {day.dayNum}
                  </p>
                </div>

                {/* Progress dots */}
                <div className="flex gap-1.5 flex-wrap flex-1">
                  {tasks.map(task => {
                    const done = day.completedIds.includes(task.id);
                    return (
                      <div key={task.id}
                        className={`h-2.5 w-2.5 rounded-full transition-all ${
                          done
                            ? (colorBar[task.color] ?? "bg-ember")
                            : day.isFuture
                            ? "bg-smoke/40"
                            : "bg-smoke"
                        }`}
                        title={task.title}
                      />
                    );
                  })}
                </div>

                {/* Count + chevron */}
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-sm font-medium ${
                    allDone ? "text-sage" : hasAny ? "text-amber" : "text-stone-600"
                  }`}>
                    {doneCnt}/{total}
                  </span>
                  {day.isToday && (
                    <span className="rounded-full bg-ember/20 px-2 py-0.5 text-[10px] font-bold uppercase text-ember">
                      hoy
                    </span>
                  )}
                  <svg className={`h-4 w-4 text-stone-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    viewBox="0 0 16 16" fill="none">
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </button>

              {/* Task list expandable */}
              {isOpen && (
                <div className="border-t border-smoke/50 divide-y divide-smoke/30">
                  {tasks.map(task => {
                    const done    = day.completedIds.includes(task.id);
                    const canEdit = !day.isFuture;

                    return (
                      <div key={task.id}
                        className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                          canEdit ? "" : "opacity-40"
                        }`}>

                        {/* Checkbox */}
                        <button
                          onClick={() => canEdit && onToggle(task.id, day.dateStr)}
                          disabled={!canEdit || isPending}
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                            done
                              ? "border-sage bg-sage text-ink"
                              : canEdit
                              ? "border-stone-600 hover:border-ember cursor-pointer"
                              : "border-stone-700 cursor-default"
                          }`}
                        >
                          {done && (
                            <svg className="h-3 w-3" viewBox="0 0 12 10" fill="none">
                              <path d="M1 5l3.5 3.5L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>

                        {/* Left color dot */}
                        <div className={`h-2 w-2 rounded-full shrink-0 ${colorBar[task.color] ?? "bg-ember"} ${done ? "opacity-40" : ""}`} />

                        {/* Title */}
                        <p className={`flex-1 text-sm ${done ? "line-through text-stone-600" : "text-stone-200"}`}>
                          {task.title}
                        </p>

                        {/* Category + duration */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-stone-600">{catIcon(task.category)}</span>
                          <span className={`text-xs font-mono ${done ? "text-stone-700" : "text-stone-500"}`}>
                            {task.duration_minutes}m
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Manage view ──────────────────────────────────────────────────────────────

function ManageView({ tasks, setTasks }: { tasks: PracticeTask[]; setTasks: (t: PracticeTask[]) => void }) {
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
              {tasks.length} tarea{tasks.length > 1 ? "s" : ""} · {totalMin} min / día
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

      {/* Formulario nueva tarea */}
      {showForm && (
        <TaskForm formRef={formRef} onSubmit={handleCreate} onCancel={() => setShowForm(false)} isPending={isPending} />
      )}

      {/* Lista */}
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
                {/* Color bar */}
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

      {/* Empty */}
      {tasks.length === 0 && !showForm && (
        <div className="mt-4 rounded-2xl border border-dashed border-smoke py-12 text-center">
          <p className="text-3xl mb-3">◆</p>
          <p className="text-stone-400 mb-1">Aún no hay tareas</p>
          <p className="text-xs text-stone-600">Ej: Técnica 20 min · Improvisación 15 min · Canción 25 min</p>
        </div>
      )}
    </div>
  );
}

// ─── Task form ────────────────────────────────────────────────────────────────

function TaskForm({ defaultValues, onSubmit, onCancel, isPending, isEdit = false, formRef }: {
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
                <option key={cat} value={cat}>{TASK_CATEGORY_META[cat].icon} {TASK_CATEGORY_META[cat].label}</option>
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
