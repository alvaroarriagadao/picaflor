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
  const technique   = (formData.get("technique") as string) || null;
  const difficulty  = (formData.get("difficulty") as string) || null;
  const bpm_start   = formData.get("bpm_start") ? parseInt(formData.get("bpm_start") as string, 10) : null;
  const bpm_target  = formData.get("bpm_target") ? parseInt(formData.get("bpm_target") as string, 10) : null;
  const description = (formData.get("description") as string)?.trim() || null;
  const focus       = (formData.get("focus") as string)?.trim() || null;
  const tab         = (formData.get("tab") as string)?.trim() || null;
  const submitter_notes = (formData.get("submitter_notes") as string)?.trim() || null;
  const imageFile   = formData.get("exercise_image") as File | null;

  if (!title) return { error: "El título es obligatorio.", success: false };

  // Validar que haya al menos imagen o tab
  const hasImage = imageFile && imageFile.size > 0;
  const hasTab   = !!tab;
  if (!hasImage && !hasTab) {
    return { error: "Sube una imagen o escribe la tablatura (o ambos).", success: false };
  }

  // Subir imagen si existe
  let image_url: string | null = null;
  if (hasImage) {
    if (imageFile.size > 8 * 1024 * 1024)
      return { error: "La imagen no puede superar 8 MB.", success: false };

    const ext  = imageFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${user.id}/${Date.now()}.${ext}`;
    const buf  = await imageFile.arrayBuffer();

    const { error: uploadErr } = await supabase.storage
      .from("exercise-images")
      .upload(path, buf, { contentType: imageFile.type, upsert: false });

    if (uploadErr) return { error: `Error subiendo imagen: ${uploadErr.message}`, success: false };

    const { data: urlData } = supabase.storage.from("exercise-images").getPublicUrl(path);
    image_url = urlData.publicUrl;
  }

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

  const { error } = await supabase.from("exercise_submissions").insert({
    user_id: user.id,
    submitter_email: user.email,
    slug,
    title,
    technique:   technique   || "",
    difficulty:  difficulty  || "",
    bpm_start:   bpm_start   ?? 0,
    bpm_target:  bpm_target  ?? 0,
    description: description ?? "",
    focus:       focus       ?? "",
    tab:         tab         ?? "",
    image_url,
    submitter_notes,
  });

  if (error) return { error: error.message, success: false };
  return { error: null, success: true };
}
