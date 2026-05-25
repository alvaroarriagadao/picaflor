"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function approveSubmission(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const { data: sub, error: fetchErr } = await supabase
    .from("exercise_submissions")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchErr || !sub) return { error: "Submission no encontrada." };

  // Insertar en exercises
  const { error: insertErr } = await supabase.from("exercises").insert({
    title:       sub.title,
    slug:        sub.slug ?? sub.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60),
    technique:   sub.technique,
    difficulty:  sub.difficulty,
    bpm_start:   sub.bpm_start,
    bpm_target:  sub.bpm_target,
    description: sub.description,
    focus:       sub.focus,
    tab:         sub.tab,
    tab_file_url: sub.tab_file_url,
  });

  if (insertErr) {
    if (insertErr.code === "23505")
      return { error: "Slug duplicado — edita el slug antes de aprobar." };
    return { error: insertErr.message };
  }

  const { data: { user } } = await supabase.auth.getUser();
  await supabase
    .from("exercise_submissions")
    .update({ status: "approved", reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/revisiones");
  revalidatePath("/biblioteca");
  revalidatePath("/practica");
  return { error: null };
}

export async function rejectSubmission(id: string, reason: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  await supabase
    .from("exercise_submissions")
    .update({
      status: "rejected",
      reviewed_by: user?.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason || "No cumple los estándares de calidad.",
    })
    .eq("id", id);

  revalidatePath("/admin/revisiones");
  return { error: null };
}
