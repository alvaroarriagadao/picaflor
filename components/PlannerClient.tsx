"use client";

import { useState, useTransition, useOptimistic, useRef } from "react";
import { toggleCompletion, createTask, updateTask, deleteTask } from "@/app/planificador/actions";
import { TASK_CATEGORY_META, TASK_CATEGORIES } from "@/lib/types";
import type { PracticeTask, TaskCategory } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WeekDay {
  dateStr: string;   // YYYY-MM-DD
  label: string;     // "L", "M"…
  dayNum: number;    // 19
  isToday: boolean;
  completedIds: string[];
}

interface Props {
  tasks: PracticeTask[];
  weekData: WeekDay[];
  todayStr: string;
  todayCompletedIds: string[];
}

type Tab = "hoy" | "semana" | "gestionar";

const COLOR_OPTIONS = [
  { value: "ember",  label: "Naranja", tw: "bg-ember"  },
  { value: "amber",  label: "Dorado",  tw: "bg-amber"  },
  { value: "sage",   label: "Verde",   tw: "bg-sage"   },
  { value: "sky",    label: "Azul",    tw: "bg-sky-400" },
  { value: "stone",  label: "Gris",    tw: "bg-stone-500" },
];

function colorDot(color: string, size = "h-2.5 w-2.5") {
  const map: Record<string, string> = {
    ember: "bg-ember", amber: "bg-amber", sage: "bg-sage",
    sky: "bg-sky-400", stone: "bg-stone-500",
  };
  return <span className={`inline-block shrink-0 rounded-full ${size} ${map[color] ?? "bg-ember"}`} />;
}

function categoryLabel(cat: TaskCategory) {
  return TASK_CATEGORY_META[cat]?.label ?? cat;
}
function categoryIcon(cat: TaskCategory) {
  return TASK_CATEGORY_META[cat]?.icon ?? "◆";
}

// ─── Progress ring ────────────────────────────────────────────────────────────

function ProgressRing({ pct, size = 80 }: { pct: number; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 1));
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={6}
        className="stroke-smoke" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        className={`transition-all duration-500 ${pct >= 1 ? "stroke-sage" : "stroke-ember"}`} />
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PlannerClient({ tasks: initialTasks, weekData, todayStr, todayCompletedIds: initialDoneIds }: Props) {
  const [tab, setTab] = useState<Tab>("hoy");
  const [tasks, setTasks] = useState(initialTasks);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set(initialDoneIds));
  const [isPending, startTransition] = useTransition();

  const totalMin = tasks.reduce((s, t) => s + t.duration_minutes, 0);
  const doneMin  = tasks.filter(t => doneIds.has(t.id)).reduce((s, t) => s + t.duration_minutes, 0);
  const pct      = totalMin > 0 ? doneMin / totalMin : 0;

  const handleToggle = (taskId: string) => {
    const wasDone = doneIds.has(taskId);
    setDoneIds(prev => {
      const next = new Set(prev);
      wasDone ? next.delete(taskId) : next.add(taskId);
      return next;
    });
    startTransition(async () => {
      await toggleCompletion(taskId, todayStr, wasDone);
    });
  };

  const today = new Date(todayStr + "T12:00:00");
  const dayNames = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  const monthNames = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
  const todayLabel = `${dayNames[today.getDay()]}, ${today.getDate()} de ${monthNames[today.getMonth()]}`;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-bone">Planificador</h1>
          <p className="mt-1 text-stone-400 capitalize">{todayLabel}</p>
        </div>
        {tasks.length > 0 && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <ProgressRing pct={pct} />
              <span className="absolute inset-0 flex items-center justify-center rotate-90 text-xs font-bold text-bone">
                {Math.round(pct * 100)}%
              </span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-bone">{doneMin} <span className="text-stone-500 text-sm font-normal">min</span></p>
              <p className="text-xs text-stone-500">de {totalMin} min</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl border border-smoke bg-ash/60 p-1">
        {(["hoy","semana","gestionar"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition capitalize ${
              tab === t ? "bg-smoke text-bone shadow" : "text-stone-400 hover:text-bone"
            }`}>
            {t === "hoy" ? "Hoy" : t === "semana" ? "Esta semana" : "Mis tareas"}
          </button>
        ))}
      </div>

      {/* ── HOY ──────────────────────────────────────────────────────────────── */}
      {tab === "hoy" && (
        <div>
          {tasks.length === 0 ? (
            <EmptyTasksPrompt onSetup={() => setTab("gestionar")} />
          ) : (
            <div className="space-y-3">
              {tasks.map(task => {
                const done = doneIds.has(task.id);
                const meta = TASK_CATEGORY_META[task.category];
                return (
                  <button key={task.id} onClick={() => handleToggle(task.id)}
                    disabled={isPending}
                    className={`w-full text-left rounded-2xl border p-5 transition-all duration-200 ${
                      done
                        ? "border-sage/40 bg-sage/10 opacity-90"
                        : "border-smoke bg-ash/40 hover:border-smoke/80 hover:bg-ash/70"
                    }`}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ${
                          done ? "bg-sage/20" : "bg-smoke"
                        }`}>
                          {categoryIcon(task.category)}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-display font-bold ${done ? "line-through text-stone-500" : "text-bone"}`}>
                            {task.title}
                          </p>
                          <p className="text-xs text-stone-500">{categoryLabel(task.category)}</p>
                        </div>
                      </div>
                      <div className="shrink-0 flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          {colorDot(task.color)}
                          <span className="text-sm font-mono text-stone-400">{task.duration_minutes} min</span>
                        </div>
                        <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center transition ${
                          done ? "border-sage bg-sage/20 text-sage" : "border-smoke"
                        }`}>
                          {done && <span className="text-xs">✓</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Resumen del día */}
              {doneIds.size > 0 && doneIds.size === tasks.length && (
                <div className="mt-4 rounded-2xl border border-sage/40 bg-sage/10 px-5 py-4 text-center">
                  <p className="text-2xl mb-1">🎸</p>
                  <p className="font-display font-bold text-sage">¡Práctica completada!</p>
                  <p className="text-sm text-stone-400 mt-1">{totalMin} minutos · {tasks.length} tareas</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── SEMANA ───────────────────────────────────────────────────────────── */}
      {tab === "semana" && (
        <WeekView weekData={weekData} tasks={tasks} todayStr={todayStr} />
      )}

      {/* ── GESTIONAR ────────────────────────────────────────────────────────── */}
      {tab === "gestionar" && (
        <ManageView tasks={tasks} setTasks={setTasks} />
      )}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyTasksPrompt({ onSetup }: { onSetup: () => void }) {
  return (
    <div className="py-16 text-center">
      <p className="text-5xl mb-4">🎸</p>
      <h3 className="font-display text-xl font-bold text-bone mb-2">
        Diseña tu práctica diaria
      </h3>
      <p className="text-stone-400 mb-6 max-w-sm mx-auto">
        Crea tus tareas de práctica (técnica, improvisación, canciones…) y márcalas cada día.
      </p>
      <button onClick={onSetup}
        className="rounded-xl bg-ember px-6 py-3 font-display font-bold uppercase tracking-wider text-ink text-sm transition hover:bg-amber">
        Crear mis tareas →
      </button>
    </div>
  );
}

// ─── Week view ────────────────────────────────────────────────────────────────

function WeekView({ weekData, tasks, todayStr }: { weekData: WeekDay[]; tasks: PracticeTask[]; todayStr: string }) {
  const totalTasks = tasks.length;

  if (totalTasks === 0) {
    return (
      <p className="py-10 text-center text-stone-500">
        Crea tareas en &quot;Mis tareas&quot; para ver tu progreso semanal.
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-7 gap-2 mb-6">
        {weekData.map((day) => {
          const donePct = totalTasks > 0 ? day.completedIds.length / totalTasks : 0;
          const isToday = day.dateStr === todayStr;

          return (
            <div key={day.dateStr}
              className={`flex flex-col items-center rounded-2xl border p-3 transition ${
                isToday
                  ? "border-ember/50 bg-ember/10"
                  : "border-smoke bg-ash/30"
              }`}>
              <span className={`text-xs font-medium mb-1 ${isToday ? "text-ember" : "text-stone-500"}`}>
                {day.label}
              </span>
              <span className={`text-lg font-bold mb-2 ${isToday ? "text-bone" : "text-stone-400"}`}>
                {day.dayNum}
              </span>

              {/* Ring */}
              <div className="relative mb-1">
                <ProgressRing pct={donePct} size={44} />
                <span className="absolute inset-0 flex items-center justify-center rotate-90 text-[9px] font-bold text-bone">
                  {Math.round(donePct * 100)}%
                </span>
              </div>

              <span className="text-[10px] text-stone-600">
                {day.completedIds.length}/{totalTasks}
              </span>
            </div>
          );
        })}
      </div>

      {/* Detalle por día */}
      <div className="space-y-3">
        {weekData.filter(d => d.completedIds.length > 0).reverse().map(day => (
          <div key={day.dateStr} className="rounded-xl border border-smoke bg-ash/30 px-4 py-3">
            <p className="text-xs text-stone-500 mb-2">
              {day.label} {day.dayNum} {day.dateStr === todayStr ? "· Hoy" : ""}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {day.completedIds.map(id => {
                const task = tasks.find(t => t.id === id);
                if (!task) return null;
                return (
                  <span key={id} className="inline-flex items-center gap-1 rounded-full bg-smoke px-2.5 py-0.5 text-xs text-stone-300">
                    {categoryIcon(task.category)} {task.title}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
        {weekData.every(d => d.completedIds.length === 0) && (
          <p className="text-center text-stone-600 py-6">
            Aún no hay actividad esta semana. ¡Empieza hoy!
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Manage view ──────────────────────────────────────────────────────────────

function ManageView({ tasks, setTasks }: { tasks: PracticeTask[]; setTasks: (t: PracticeTask[]) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleCreate = (formData: FormData) => {
    startTransition(async () => {
      await createTask(formData);
      formRef.current?.reset();
      setShowForm(false);
    });
  };

  const handleUpdate = (id: string, formData: FormData) => {
    startTransition(async () => {
      await updateTask(id, formData);
      setEditingId(null);
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteTask(id);
    });
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-stone-400">
          {tasks.length === 0
            ? "Crea tus tareas de práctica diaria"
            : `${tasks.length} tarea${tasks.length > 1 ? "s" : ""} · ${tasks.reduce((s, t) => s + t.duration_minutes, 0)} min/día`}
        </p>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="rounded-xl bg-ember px-4 py-2 text-sm font-display font-bold uppercase tracking-wider text-ink transition hover:bg-amber">
            + Nueva tarea
          </button>
        )}
      </div>

      {/* Form de nueva tarea */}
      {showForm && (
        <TaskForm
          formRef={formRef}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          isPending={isPending}
        />
      )}

      {/* Lista de tareas */}
      <div className="space-y-2 mt-4">
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
              <div className="flex items-center gap-3 rounded-xl border border-smoke bg-ash/40 px-4 py-3">
                <span className="text-lg">{categoryIcon(task.category)}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-bone truncate">{task.title}</p>
                  <p className="text-xs text-stone-500">
                    {categoryLabel(task.category)} · {task.duration_minutes} min
                  </p>
                </div>
                {colorDot(task.color)}
                <div className="flex items-center gap-1.5">
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
        <div className="mt-6 rounded-xl border border-dashed border-smoke py-10 text-center text-stone-600">
          <p className="text-2xl mb-2">◆</p>
          <p>Aún no hay tareas. ¡Crea la primera!</p>
          <p className="text-xs text-stone-700 mt-1">Ej: Técnica 20min · Improvisación 15min · Canción 25min</p>
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
  const [selectedColor, setSelectedColor] = useState(defaultValues?.color ?? "ember");

  return (
    <div className="rounded-2xl border border-ember/30 bg-ember/5 p-5 mb-2">
      <p className="text-sm font-display font-bold text-bone mb-4">
        {isEdit ? "Editar tarea" : "Nueva tarea"}
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
            <label className="mb-1 block text-xs uppercase tracking-wider text-stone-500">Duración (minutos)</label>
            <input type="number" name="duration_minutes" defaultValue={defaultValues?.duration_minutes ?? 15}
              min={1} max={180} required
              className="w-full rounded-lg border border-smoke bg-ink/60 px-3 py-2.5 text-sm text-bone outline-none focus:border-ember" />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-wider text-stone-500">Color</label>
            <input type="hidden" name="color" value={selectedColor} />
            <div className="flex gap-2 mt-1">
              {COLOR_OPTIONS.map(c => (
                <button key={c.value} type="button" onClick={() => setSelectedColor(c.value)}
                  title={c.label}
                  className={`h-7 w-7 rounded-full transition ${c.tw} ${
                    selectedColor === c.value ? "ring-2 ring-bone ring-offset-2 ring-offset-ink" : "opacity-60 hover:opacity-100"
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
