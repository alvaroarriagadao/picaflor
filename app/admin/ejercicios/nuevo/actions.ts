"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export type FormState = {
  error: string | null;
  success: boolean;
};

const ALLOWED_GP_TYPES = [
  "application/octet-stream",
  "audio/x-guitar-pro",
  "",
];

const ALLOWED_GP_EXTS = [".gp", ".gp3", ".gp4", ".gp5", ".gpx", ".gp7"];

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
  const tabFile = formData.get("tab_file") as File | null;

  if (!slug || !title || !technique || !difficulty || !description || !focus || !tab) {
    return { error: "Todos los campos son obligatorios.", success: false };
  }
  if (isNaN(bpm_start) || isNaN(bpm_target)) {
    return { error: "Los BPM deben ser números válidos.", success: false };
  }

  // Subir archivo GP a Storage si se adjuntó uno
  let tab_file_url: string | null = null;

  if (tabFile && tabFile.size > 0) {
    const fileName = tabFile.name.toLowerCase();
    const ext = fileName.slice(fileName.lastIndexOf("."));

    if (!ALLOWED_GP_EXTS.includes(ext)) {
      return {
        error: `Formato no soportado: ${ext}. Usa .gp, .gp5, .gpx, .gp3, .gp4 o .gp7`,
        success: false,
      };
    }

    if (tabFile.size > 5 * 1024 * 1024) {
      return { error: "El archivo no puede superar 5 MB.", success: false };
    }

    const storagePath = `${slug}${ext}`;
    const arrayBuffer = await tabFile.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("exercise-tabs")
      .upload(storagePath, arrayBuffer, {
        contentType: "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      return { error: `Error subiendo archivo: ${uploadError.message}`, success: false };
    }

    const { data: urlData } = supabase.storage
      .from("exercise-tabs")
      .getPublicUrl(storagePath);

    tab_file_url = urlData.publicUrl;
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
    ...(tab_file_url ? { tab_file_url } : {}),
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
