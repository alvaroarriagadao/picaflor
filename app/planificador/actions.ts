"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

// ─── Tasks CRUD ───────────────────────────────────────────────────────────────

export async function createTask(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Sin sesión" };

  const title            = (formData.get("title") as string)?.trim();
  const category         = (formData.get("category") as string) || "general";
  const duration_minutes = parseInt(formData.get("duration_minutes") as string, 10) || 15;
  const color            = (formData.get("color") as string) || "ember";

  if (!title) return { error: "El título es obligatorio." };

  // sort_order = max + 1
  const { data: last } = await supabase
    .from("practice_tasks")
    .select("sort_order")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .single();

  const sort_order = ((last?.sort_order) ?? -1) + 1;

  const { error } = await supabase.from("practice_tasks").insert({
    user_id: user.id, title, category, duration_minutes, color, sort_order,
  });

  revalidatePath("/planificador");
  return { error: error?.message ?? null };
}

export async function updateTask(id: string, formData: FormData) {
  const supabase = await createClient();
  const title            = (formData.get("title") as string)?.trim();
  const category         = (formData.get("category") as string) || "general";
  const duration_minutes = parseInt(formData.get("duration_minutes") as string, 10) || 15;
  const color            = (formData.get("color") as string) || "ember";

  if (!title) return { error: "El título es obligatorio." };

  const { error } = await supabase
    .from("practice_tasks")
    .update({ title, category, duration_minutes, color })
    .eq("id", id);

  revalidatePath("/planificador");
  return { error: error?.message ?? null };
}

export async function deleteTask(id: string) {
  const supabase = await createClient();
  await supabase.from("practice_tasks").delete().eq("id", id);
  revalidatePath("/planificador");
}

// ─── Practice time log ───────────────────────────────────────────────────────

export async function logPracticeTime(
  taskId: string,
  minutes: number,
  localDate?: string,            // YYYY-MM-DD from the browser (local timezone)
): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Sin sesión" };

    // Prefer client-supplied date; fallback to Santiago timezone
    const today = localDate && /^\d{4}-\d{2}-\d{2}$/.test(localDate)
      ? localDate
      : new Intl.DateTimeFormat("es-CL", {
          timeZone: "America/Santiago",
          year: "numeric", month: "2-digit", day: "2-digit",
        }).format(new Date()).split("-").reverse().join("-");

    const { error: insertErr } = await supabase
      .from("practice_time_logs")
      .insert({ user_id: user.id, task_id: taskId, logged_on: today, minutes });
    if (insertErr) return { error: insertErr.message };

    // Auto-complete task if total logged >= target today
    const { data: taskRow } = await supabase
      .from("practice_tasks")
      .select("duration_minutes")
      .eq("id", taskId)
      .single();

    if (taskRow) {
      const { data: logsToday } = await supabase
        .from("practice_time_logs")
        .select("minutes")
        .eq("user_id", user.id)
        .eq("task_id", taskId)
        .eq("logged_on", today);

      const total = (logsToday ?? []).reduce((s, r) => s + r.minutes, 0);
      if (total >= taskRow.duration_minutes) {
        await supabase
          .from("daily_task_completions")
          .upsert(
            { user_id: user.id, task_id: taskId, completed_on: today },
            { onConflict: "user_id,task_id,completed_on" },
          );
      }
    }

    revalidatePath("/planificador");
    revalidatePath("/practica");
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ─── Completions ──────────────────────────────────────────────────────────────

export async function toggleCompletion(taskId: string, dateStr: string, currentlyDone: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  if (currentlyDone) {
    await supabase
      .from("daily_task_completions")
      .delete()
      .eq("user_id", user.id)
      .eq("task_id", taskId)
      .eq("completed_on", dateStr);
  } else {
    await supabase
      .from("daily_task_completions")
      .upsert({ user_id: user.id, task_id: taskId, completed_on: dateStr });
  }

  revalidatePath("/planificador");
}
