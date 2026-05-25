import { createClient } from "@/lib/supabase-server";
import { pickDailyExercise, todayStr } from "@/lib/daily";
import PracticeClient from "@/components/PracticeClient";
import type { Exercise } from "@/lib/types";

export const dynamic = "force-dynamic";

function computeStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const set = new Set(dates);
  let streak = 0;
  const cursor = new Date();
  // Si no practicó hoy, la racha puede seguir viva desde ayer
  const todayKey = todayStr();
  if (!set.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, "0");
    const d = String(cursor.getDate()).padStart(2, "0");
    const key = `${y}-${m}-${d}`;
    if (set.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export default async function PracticePage() {
  const supabase = await createClient();

  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .order("created_at", { ascending: true });

  const all = (exercises ?? []) as Exercise[];
  const daily = pickDailyExercise(all);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let completedToday = false;
  let streak = 0;

  if (user) {
    const { data: logs } = await supabase
      .from("practice_logs")
      .select("practiced_on")
      .eq("user_id", user.id)
      .order("practiced_on", { ascending: false });

    const dates = (logs ?? []).map((l) => l.practiced_on as string);
    completedToday = dates.includes(todayStr());
    streak = computeStreak(dates);
  }

  if (!daily) {
    return (
      <div className="rounded-2xl border border-smoke bg-ash/60 p-10 text-center">
        <p className="text-stone-400">
          No hay ejercicios cargados todavía. Ejecuta el seed de la base de
          datos.
        </p>
      </div>
    );
  }

  return (
    <PracticeClient
      dailyExercise={daily}
      allExercises={all}
      completedToday={completedToday}
      streak={streak}
    />
  );
}
