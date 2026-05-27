"use server";

import { createClient } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

const CONTRIBUTIONS_PER_MONTH = 15;

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

  // Mark as approved
  const { data: { user } } = await supabase.auth.getUser();
  await supabase
    .from("exercise_submissions")
    .update({ status: "approved", reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
    .eq("id", id);

  // ── Grant Pro month if submitter reached a new multiple of 15 ─────────────
  if (sub.submitter_email) {
    try {
      const admin = createAdminClient();

      // Count ALL approved submissions for this email (including this one)
      const { count: newCount } = await admin
        .from("exercise_submissions")
        .select("id", { count: "exact", head: true })
        .eq("submitter_email", sub.submitter_email)
        .eq("status", "approved");

      const total = newCount ?? 0;

      // Every multiple of 15 grants 1 additional Pro month
      if (total > 0 && total % CONTRIBUTIONS_PER_MONTH === 0) {
        // Find the submitter's user account
        const { data: userData } = await admin.auth.admin.listUsers();
        const submitterUser = userData?.users?.find(u => u.email === sub.submitter_email);

        if (submitterUser) {
          // Get current contribution_pro_until (or now if none)
          const { data: subData } = await admin
            .from("user_subscriptions")
            .select("contribution_pro_until")
            .eq("user_id", submitterUser.id)
            .maybeSingle();

          const base = subData?.contribution_pro_until && new Date(subData.contribution_pro_until) > new Date()
            ? new Date(subData.contribution_pro_until)
            : new Date();

          // Add 1 month
          const newUntil = new Date(base);
          newUntil.setMonth(newUntil.getMonth() + 1);

          await admin
            .from("user_subscriptions")
            .upsert(
              {
                user_id: submitterUser.id,
                contribution_pro_until: newUntil.toISOString(),
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" }
            );
        }
      }
    } catch (e) {
      // Non-critical — log but don't fail the approval
      console.error("Error granting contribution Pro month:", e);
    }
  }

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
