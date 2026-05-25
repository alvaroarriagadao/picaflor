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

  // Tareas activas ordenadas
  const { data: tasksData } = await supabase
    .from("practice_tasks")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const tasks = (tasksData ?? []) as PracticeTask[];

  // Calcular Lunes de la semana actual
  const todayDate  = new Date(today + "T12:00:00");
  const dow        = todayDate.getDay(); // 0=Dom 1=Lun...
  const toMonday   = dow === 0 ? 6 : dow - 1;
  const monday     = new Date(todayDate);
  monday.setDate(todayDate.getDate() - toMonday);
  const mondayStr  = monday.toISOString().slice(0, 10);

  // Domingo de la semana
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const sundayStr = sunday.toISOString().slice(0, 10);

  // Completados de toda la semana (Lun–Dom)
  const { data: completionsData } = await supabase
    .from("daily_task_completions")
    .select("*")
    .eq("user_id", user.id)
    .gte("completed_on", mondayStr)
    .lte("completed_on", sundayStr);

  const completions = (completionsData ?? []) as DailyTaskCompletion[];

  // Construir array Mon→Sun
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr      = d.toISOString().slice(0, 10);
    const completedIds = completions
      .filter(c => c.completed_on === dateStr)
      .map(c => c.task_id);

    return {
      dateStr,
      label:   DAY_LABELS[d.getDay()],
      dayNum:  d.getDate(),
      isToday: dateStr === today,
      isFuture: dateStr > today,
      completedIds,
    };
  });

  return (
    <PlannerClient
      tasks={tasks}
      weekData={weekData}
      todayStr={today}
    />
  );
}
