"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export type FormState = {
  error: string | null;
  success: boolean;
};

export async function createExercise(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient();

  const slug = (formData.get("slug") as string)?.trim().toLowerCase().replace(/\s+/g, "-");
  const title = (formData.get("title") as string)?.trim();
  const technique = formData.get("technique") as string;
  const difficulty = formData.get("difficulty") as string;
  const bpm_start = parseInt(formData.get("bpm_start") as string, 10);
  const bpm_target = parseInt(formData.get("bpm_target") as string, 10);
  const description = (formData.get("description") as string)?.trim();
  const focus = (formData.get("focus") as string)?.trim();
  const tab = (formData.get("tab") as string)?.trim();

  if (!slug || !title || !technique || !difficulty || !description || !focus || !tab) {
    return { error: "Todos los campos son obligatorios.", success: false };
  }
  if (isNaN(bpm_start) || isNaN(bpm_target)) {
    return { error: "Los BPM deben ser números válidos.", success: false };
  }

  const { error } = await supabase.from("exercises").insert({
    slug,
    title,
    technique,
    difficulty,
    bpm_start,
    bpm_target,
    description,
    focus,
    tab,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: `El slug "${slug}" ya existe. Usa uno diferente.`, success: false };
    }
    return { error: error.message, success: false };
  }

  revalidatePath("/biblioteca");
  revalidatePath("/practica");
  return { error: null, success: true };
}
