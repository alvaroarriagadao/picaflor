import { createClient } from "@/lib/supabase-server";
import { todayStr } from "@/lib/daily";
import { DifficultyBadge, TechniqueBadge } from "@/components/Badges";
import type { Exercise } from "@/lib/types";

export const dynamic = "force-dynamic";

function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const set = new Set(dates);
  let streak = 0;
  const cursor = new Date();
  if (!set.has(todayStr())) cursor.setDate(cursor.getDate() - 1);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    if (set.has(`${y}-${m}-${d}`)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  return streak;
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: logs } = await supabase
    .from("practice_logs")
    .select("practiced_on, exercise_id, created_at")
    .order("created_at", { ascending: false });

  const allLogs = logs ?? [];
  const dates = allLogs.map((l) => l.practiced_on as string);
  const uniqueDays = new Set(dates).size;
  const streak = computeStreak(dates);
  const totalSessions = allLogs.length;

  // Cargar ejercicios para mostrar el historial reciente
  const exerciseIds = Array.from(
    new Set(allLogs.map((l) => l.exercise_id as string))
  );
  let exerciseMap: Record<string, Exercise> = {};
  if (exerciseIds.length > 0) {
    const { data: exs } = await supabase
      .from("exercises")
      .select("*")
      .in("id", exerciseIds);
    (exs ?? []).forEach((e) => {
      exerciseMap[(e as Exercise).id] = e as Exercise;
    });
  }

  const recent = allLogs.slice(0, 10);

  return (
    <div>
      <h1 className="font-display text-4xl font-extrabold tracking-tight text-bone">
        Tu progreso
      </h1>
      <p className="mt-1 text-stone-400">{user?.email}</p>

      {/* Estadísticas */}
      <div className="mt-8 grid grid-cols-3 gap-4">
        <StatCard label="Racha actual" value={streak} suffix="días" accent="amber" />
        <StatCard label="Días practicados" value={uniqueDays} suffix="días" accent="ember" />
        <StatCard label="Sesiones totales" value={totalSessions} suffix="" accent="sage" />
      </div>

      {/* Historial reciente */}
      <h2 className="mb-4 mt-12 font-display text-2xl font-bold text-bone">
        Historial reciente
      </h2>

      {recent.length === 0 ? (
        <div className="rounded-2xl border border-smoke bg-ash/40 p-10 text-center text-stone-500">
          Aún no has registrado prácticas. ¡Empieza con el ejercicio del día!
        </div>
      ) : (
        <div className="space-y-3">
          {recent.map((log, i) => {
            const ex = exerciseMap[log.exercise_id as string];
            if (!ex) return null;
            return (
              <div
                key={i}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-smoke/60 bg-ash/40 px-5 py-4"
              >
                <div>
                  <p className="font-display font-bold text-bone">{ex.title}</p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    <TechniqueBadge technique={ex.technique} />
                    <DifficultyBadge difficulty={ex.difficulty} />
                  </div>
                </div>
                <span className="font-mono text-sm text-stone-500">
                  {log.practiced_on as string}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  accent,
}: {
  label: string;
  value: number;
  suffix: string;
  accent: "amber" | "ember" | "sage";
}) {
  const colors = {
    amber: "text-amber border-amber/30 bg-amber/5",
    ember: "text-ember border-ember/30 bg-ember/5",
    sage: "text-sage border-sage/30 bg-sage/5",
  };
  return (
    <div className={`rounded-2xl border p-5 ${colors[accent]}`}>
      <div className="font-display text-4xl font-extrabold tabular-nums sm:text-5xl">
        {value}
      </div>
      <div className="mt-1 text-[11px] uppercase tracking-wider text-stone-500">
        {label} {suffix && `· ${suffix}`}
      </div>
    </div>
  );
}
