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
    technique:   sub.technique   || "alternate_picking",
    difficulty:  sub.difficulty  || "principiante",
    bpm_start:   sub.bpm_start   || 60,
    bpm_target:  sub.bpm_target  || 120,
    description: sub.description || sub.title,
    focus:       sub.focus       || "Trabaja la técnica con precisión.",
    tab:         sub.tab         || "",
    tab_file_url:    sub.tab_file_url,
    image_url:       sub.image_url,
    submitted_by_email: sub.submitter_email,
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
