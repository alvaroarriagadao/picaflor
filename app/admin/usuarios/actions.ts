"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";

// ── Assign Pro plan to a user (admin-granted, no expiry) ─────────────────────
export async function grantPro(userId: string): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("user_subscriptions")
      .upsert(
        {
          user_id: userId,
          plan: "pro",
          subscription_status: "active",
          payment_provider: "admin",
          billing_interval: null,
          current_period_end: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    if (error) return { error: error.message };
    revalidatePath("/admin/usuarios");
    revalidatePath("/admin");
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ── Revoke Pro — set back to free ────────────────────────────────────────────
export async function revokePro(userId: string): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("user_subscriptions")
      .upsert(
        {
          user_id: userId,
          plan: "free",
          subscription_status: "inactive",
          payment_provider: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    if (error) return { error: error.message };
    revalidatePath("/admin/usuarios");
    revalidatePath("/admin");
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ── Send password reset email ─────────────────────────────────────────────────
export async function sendPasswordReset(email: string): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://picaflor-kappa.vercel.app"}/auth/callback?next=/perfil`,
    });
    if (error) return { error: error.message };
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}

// ── Delete user account entirely ─────────────────────────────────────────────
export async function deleteUser(userId: string): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) return { error: error.message };
    revalidatePath("/admin/usuarios");
    revalidatePath("/admin");
    return { error: null };
  } catch (e: any) {
    return { error: e.message };
  }
}
