import { createClient } from "@/lib/supabase-server";
import PlannerClient from "@/components/PlannerClient";
import type { PracticeTask, DailyTaskCompletion } from "@/lib/types";
import { todayStr as getTodayStr } from "@/lib/daily";

export const dynamic = "force-dynamic";

export interface CalendarDay {
  dateStr: string;
  dayNum: number;
  isToday: boolean;
  isFuture: boolean;
  isCurrentMonth: boolean;
  completedTaskIds: string[];
}

export default async function PlanificadorPage({
  searchParams,
}: {
  searchParams: { m?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const today = getTodayStr();

  // Parse requested month (YYYY-MM), default to current
  const rawM  = searchParams.m ?? today.slice(0, 7);
  const [yyyy, mm] = rawM.split("-").map(Number);
  const year  = isNaN(yyyy) ? new Date().getFullYear() : yyyy;
  const month = isNaN(mm)   ? new Date().getMonth() + 1 : mm;

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay    = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay     = `${year}-${String(month).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  const [{ data: tasksData }, { data: completionsData }] = await Promise.all([
    supabase
      .from("practice_tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("daily_task_completions")
      .select("*")
      .eq("user_id", user.id)
      .gte("completed_on", firstDay)
      .lte("completed_on", lastDay),
  ]);

  const tasks       = (tasksData ?? []) as PracticeTask[];
  const completions = (completionsData ?? []) as DailyTaskCompletion[];

  // Build calendar grid — Mon-first, 35 or 42 cells
  const firstOfMonth = new Date(year, month - 1, 1);
  const dow = firstOfMonth.getDay(); // 0=Sun
  const startPad = dow === 0 ? 6 : dow - 1;

  const calendarDays: CalendarDay[] = [];

  // Padding from prev month
  for (let i = startPad - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, -i);
    calendarDays.push({
      dateStr: d.toISOString().slice(0, 10),
      dayNum: d.getDate(),
      isToday: false, isFuture: false,
      isCurrentMonth: false, completedTaskIds: [],
    });
  }

  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    calendarDays.push({
      dateStr,
      dayNum: day,
      isToday: dateStr === today,
      isFuture: dateStr > today,
      isCurrentMonth: true,
      completedTaskIds: completions.filter(c => c.completed_on === dateStr).map(c => c.task_id),
    });
  }

  // Fill remaining cells (next month)
  const totalCells = calendarDays.length <= 35 ? 35 : 42;
  let nextDay = 1;
  while (calendarDays.length < totalCells) {
    const d = new Date(year, month, nextDay++);
    calendarDays.push({
      dateStr: d.toISOString().slice(0, 10),
      dayNum: d.getDate(),
      isToday: false, isFuture: true,
      isCurrentMonth: false, completedTaskIds: [],
    });
  }

  const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

  return (
    <PlannerClient
      tasks={tasks}
      calendarDays={calendarDays}
      todayStr={today}
      currentMonth={{ year, month, label: `${MONTH_NAMES[month - 1]} ${year}` }}
    />
  );
}
