import { createClient } from "@/lib/supabase-server";
import PlannerClient from "@/components/PlannerClient";
import type { PracticeTask, DailyTaskCompletion } from "@/lib/types";
import { todayStr as getTodayStr } from "@/lib/daily";

export const dynamic = "force-dynamic";

const DAY_LABELS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default async function PlanificadorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const today = getTodayStr();

  // Obtener tareas activas
  const { data: tasksData } = await supabase
    .from("practice_tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const tasks = (tasksData ?? []) as PracticeTask[];

  // Obtener completados de los últimos 7 días
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().slice(0, 10);

  const { data: completionsData } = await supabase
    .from("daily_task_completions")
    .select("*")
    .eq("user_id", user.id)
    .gte("completed_on", sevenDaysAgoStr);

  const completions = (completionsData ?? []) as DailyTaskCompletion[];

  // Construir datos de la semana (últimos 7 días incl. hoy)
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const completedIds = completions
      .filter(c => c.completed_on === dateStr)
      .map(c => c.task_id);

    return {
      dateStr,
      label: DAY_LABELS[d.getDay()],
      dayNum: d.getDate(),
      isToday: dateStr === today,
      completedIds,
    };
  });

  const todayCompletedIds = completions
    .filter(c => c.completed_on === today)
    .map(c => c.task_id);

  return (
    <PlannerClient
      tasks={tasks}
      weekData={weekData}
      todayStr={today}
      todayCompletedIds={todayCompletedIds}
    />
  );
}
