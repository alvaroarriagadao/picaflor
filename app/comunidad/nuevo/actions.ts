"use server";

import { createClient } from "@/lib/supabase-server";

export type FormState = { error: string | null; success: boolean };

export async function submitExercise(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Debes iniciar sesión.", success: false };

  const title       = (formData.get("title") as string)?.trim();
  const technique   = formData.get("technique") as string;
  const difficulty  = formData.get("difficulty") as string;
  const bpm_start   = parseInt(formData.get("bpm_start") as string, 10);
  const bpm_target  = parseInt(formData.get("bpm_target") as string, 10);
  const description = (formData.get("description") as string)?.trim();
  const focus       = (formData.get("focus") as string)?.trim();
  const tab         = (formData.get("tab") as string)?.trim();
  const submitter_notes = (formData.get("submitter_notes") as string)?.trim() || null;

  if (!title || !technique || !difficulty || !description || !focus || !tab)
    return { error: "Todos los campos son obligatorios.", success: false };
  if (isNaN(bpm_start) || isNaN(bpm_target))
    return { error: "Los BPM deben ser números válidos.", success: false };

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

  const { error } = await supabase.from("exercise_submissions").insert({
    user_id: user.id,
    slug,
    title, technique, difficulty, bpm_start, bpm_target, description, focus, tab, submitter_notes,
  });

  if (error) return { error: error.message, success: false };
  return { error: null, success: true };
}
