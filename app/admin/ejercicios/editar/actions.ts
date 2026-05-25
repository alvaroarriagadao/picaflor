"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type FormState = { error: string | null; success: boolean };

export async function updateExercise(
  id: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient();

  const slug        = (formData.get("slug") as string)?.trim().toLowerCase().replace(/\s+/g, "-");
  const title       = (formData.get("title") as string)?.trim();
  const technique   = formData.get("technique") as string;
  const difficulty  = formData.get("difficulty") as string;
  const bpm_start   = parseInt(formData.get("bpm_start") as string, 10);
  const bpm_target  = parseInt(formData.get("bpm_target") as string, 10);
  const description = (formData.get("description") as string)?.trim();
  const focus       = (formData.get("focus") as string)?.trim();
  const tab         = (formData.get("tab") as string)?.trim();

  if (!slug || !title || !technique || !difficulty || !description || !focus || !tab)
    return { error: "Todos los campos son obligatorios.", success: false };
  if (isNaN(bpm_start) || isNaN(bpm_target))
    return { error: "Los BPM deben ser números válidos.", success: false };

  const { error } = await supabase
    .from("exercises")
    .update({ slug, title, technique, difficulty, bpm_start, bpm_target, description, focus, tab })
    .eq("id", id);

  if (error) return { error: error.message, success: false };

  revalidatePath("/biblioteca");
  revalidatePath("/practica");
  revalidatePath("/admin/ejercicios");
  return { error: null, success: true };
}

export async function deleteExercise(id: string) {
  const supabase = await createClient();
  await supabase.from("exercises").delete().eq("id", id);
  revalidatePath("/admin/ejercicios");
  revalidatePath("/biblioteca");
  redirect("/admin/ejercicios");
}
