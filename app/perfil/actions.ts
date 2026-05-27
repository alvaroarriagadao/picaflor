"use server";

import { createClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function saveProfile(fd: FormData): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado." };

  const display_name = (fd.get("display_name") as string | null)?.trim() || null;
  const phone        = (fd.get("phone")        as string | null)?.trim() || null;
  const instagram    = (fd.get("instagram")     as string | null)?.trim().replace(/^@/, "") || null;

  const { error } = await supabase
    .from("profiles")
    .upsert(
      { id: user.id, display_name, phone, instagram, updated_at: new Date().toISOString() },
      { onConflict: "id" }
    );

  if (error) return { error: error.message };

  revalidatePath("/perfil");
  return { error: null };
}
