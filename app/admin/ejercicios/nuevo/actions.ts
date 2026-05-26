"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export type FormState = {
  error: string | null;
  success: boolean;
};

const ALLOWED_GP_EXTS = [".gp", ".gp3", ".gp4", ".gp5", ".gpx", ".gp7"];

export async function createExercise(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const supabase = await createClient();

  const slug        = (formData.get("slug") as string)?.trim().toLowerCase().replace(/\s+/g, "-");
  const title       = (formData.get("title") as string)?.trim();
  const technique   = (formData.get("technique") as string)?.trim() || null;
  const difficulty  = (formData.get("difficulty") as string)?.trim() || null;
  const bpm_start   = formData.get("bpm_start") ? parseInt(formData.get("bpm_start") as string, 10) : null;
  const bpm_target  = formData.get("bpm_target") ? parseInt(formData.get("bpm_target") as string, 10) : null;
  const description = (formData.get("description") as string)?.trim() || null;
  const focus       = (formData.get("focus") as string)?.trim() || null;
  const tab         = (formData.get("tab") as string)?.trim() || null;
  const tabFile     = formData.get("tab_file") as File | null;
  const imageFile   = formData.get("exercise_image") as File | null;

  if (!slug || !title) {
    return { error: "El título y el slug son obligatorios.", success: false };
  }

  // Upload Guitar Pro file
  let tab_file_url: string | null = null;
  if (tabFile && tabFile.size > 0) {
    const fileName = tabFile.name.toLowerCase();
    const ext = fileName.slice(fileName.lastIndexOf("."));
    if (!ALLOWED_GP_EXTS.includes(ext))
      return { error: `Formato no soportado: ${ext}. Usa .gp, .gp5, .gpx, .gp3, .gp4 o .gp7`, success: false };
    if (tabFile.size > 5 * 1024 * 1024)
      return { error: "El archivo no puede superar 5 MB.", success: false };

    const storagePath = `${slug}${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("exercise-tabs")
      .upload(storagePath, await tabFile.arrayBuffer(), {
        contentType: "application/octet-stream",
        upsert: true,
      });
    if (uploadError)
      return { error: `Error subiendo archivo GP: ${uploadError.message}`, success: false };

    const { data: urlData } = supabase.storage.from("exercise-tabs").getPublicUrl(storagePath);
    tab_file_url = urlData.publicUrl;
  }

  // Upload image
  let image_url: string | null = null;
  if (imageFile && imageFile.size > 0) {
    if (imageFile.size > 8 * 1024 * 1024)
      return { error: "La imagen no puede superar 8 MB.", success: false };

    const ext  = imageFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `admin/${slug}-${Date.now()}.${ext}`;
    const { error: imgErr } = await supabase.storage
      .from("exercise-images")
      .upload(path, await imageFile.arrayBuffer(), { contentType: imageFile.type, upsert: true });
    if (imgErr)
      return { error: `Error subiendo imagen: ${imgErr.message}`, success: false };

    const { data: urlData } = supabase.storage.from("exercise-images").getPublicUrl(path);
    image_url = urlData.publicUrl;
  }

  const { error } = await supabase.from("exercises").insert({
    slug,
    title,
    technique:   technique   ?? "",
    difficulty:  difficulty  ?? "principiante",
    bpm_start:   bpm_start   ?? 60,
    bpm_target:  bpm_target  ?? 120,
    description: description ?? "",
    focus:       focus       ?? "",
    tab:         tab         ?? "",
    ...(tab_file_url ? { tab_file_url } : {}),
    ...(image_url    ? { image_url }    : {}),
  });

  if (error) {
    if (error.code === "23505")
      return { error: `El slug "${slug}" ya existe. Usa uno diferente.`, success: false };
    return { error: error.message, success: false };
  }

  revalidatePath("/biblioteca");
  revalidatePath("/practica");
  return { error: null, success: true };
}
