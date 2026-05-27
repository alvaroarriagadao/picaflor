import { createClient } from "@/lib/supabase-server";
import PlannerClient from "@/components/PlannerClient";
import type { PracticeTask, DailyTaskCompletion } from "@/lib/types";
import { todayStr as getTodayStr } from "@/lib/daily";

export const dynamic = "force-dynamic";

export interface CalendarDay {
  dateStr:          string;
  dayNum:           number;
  isToday:          boolean;
  isFuture:         boolean;
  isCurrentMonth:   boolean;   // kept for interface compat
  completedTaskIds: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the ISO date string (YYYY-MM-DD) of the Monday of the given week */
function getMondayOfWeek(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const dow = d.getDay(); // 0=Sun
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default async function PlanificadorPage({
  searchParams,
}: {
  searchParams: { w?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const today = getTodayStr();

  // Parse week start (Monday), default to current week
  const rawW = searchParams.w;
  const weekStart =
    rawW && /^\d{4}-\d{2}-\d{2}$/.test(rawW)
      ? rawW
      : getMondayOfWeek(today);

  // Build 7 CalendarDay stubs (fill completedTaskIds after fetch)
  const weekDays: Omit<CalendarDay, "completedTaskIds">[] = Array.from(
    { length: 7 },
    (_, i) => {
      const d = new Date(weekStart + "T12:00:00");
      d.setDate(d.getDate() + i);
      const ds = d.toISOString().slice(0, 10);
      return {
        dateStr:        ds,
        dayNum:         d.getDate(),
        isToday:        ds === today,
        isFuture:       ds > today,
        isCurrentMonth: true,
      };
    }
  );

  const firstDay = weekDays[0].dateStr;
  const lastDay  = weekDays[6].dateStr;

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

  const tasks       = (tasksData       ?? []) as PracticeTask[];
  const completions = (completionsData ?? []) as DailyTaskCompletion[];

  const calendarDays: CalendarDay[] = weekDays.map(d => ({
    ...d,
    completedTaskIds: completions
      .filter(c => c.completed_on === d.dateStr)
      .map(c => c.task_id),
  }));

  return (
    <PlannerClient
      tasks={tasks}
      calendarDays={calendarDays}
      todayStr={today}
      weekStart={weekStart}
    />
  );
}
