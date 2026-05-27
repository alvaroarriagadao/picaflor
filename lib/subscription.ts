import { createClient } from "@/lib/supabase-server";
import { FREE_EXERCISE_LIMIT } from "@/lib/plan-config";

export type Plan = "free" | "pro";
export { FREE_EXERCISE_LIMIT } from "@/lib/plan-config";

// Admin always gets Pro — same list used across layouts
const ADMIN_EMAILS = ["alvaro.arriagada101@gmail.com"];

// 15 approved contributions = 1 free month of Pro
export const CONTRIBUTIONS_PER_MONTH = 15;
// Max bonus free exercises before reaching the monthly threshold
export const MAX_CONTRIBUTION_BONUS  = 8;

export interface SubscriptionInfo {
  plan: Plan;
  billingInterval: "week" | "month" | "year" | null;
  currentPeriodEnd: Date | null;
  provider: "stripe" | "mercadopago" | "admin" | "contribution" | null;
  status: string | null;
  contributionCount: number;
  effectiveLimit: number;         // Infinity when pro
  isAdmin: boolean;
}

export async function getUserSubscription(): Promise<SubscriptionInfo> {
  const empty: SubscriptionInfo = {
    plan: "free",
    billingInterval: null,
    currentPeriodEnd: null,
    provider: null,
    status: null,
    contributionCount: 0,
    effectiveLimit: FREE_EXERCISE_LIMIT,
    isAdmin: false,
  };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return empty;

    // ── Admin override — always Pro, full access ────────────────────────────
    if (ADMIN_EMAILS.includes(user.email ?? "")) {
      return {
        plan: "pro",
        billingInterval: null,
        currentPeriodEnd: null,
        provider: "admin",
        status: "admin",
        contributionCount: 0,
        effectiveLimit: Infinity,
        isAdmin: true,
      };
    }

    // ── Run paid sub + contribution count in parallel ───────────────────────
    const [subResult, contribResult] = await Promise.all([
      supabase
        .from("user_subscriptions")
        .select("plan, billing_interval, current_period_end, payment_provider, subscription_status, contribution_pro_until")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("exercise_submissions")
        .select("id", { count: "exact", head: true })
        .eq("submitter_email", user.email ?? "")
        .eq("status", "approved"),
    ]);

    const contributionCount  = contribResult.count ?? 0;
    const bonusExercises     = Math.min(contributionCount % CONTRIBUTIONS_PER_MONTH, MAX_CONTRIBUTION_BONUS);
    const effectiveLimitFree = FREE_EXERCISE_LIMIT + bonusExercises;

    // ── Check contribution-based Pro months ─────────────────────────────────
    const contribProUntil = subResult.data?.contribution_pro_until
      ? new Date(subResult.data.contribution_pro_until)
      : null;
    const isContribProActive = contribProUntil ? contribProUntil > new Date() : false;

    if (isContribProActive) {
      return {
        plan: "pro",
        billingInterval: "month",
        currentPeriodEnd: contribProUntil,
        provider: "contribution",
        status: "active",
        contributionCount,
        effectiveLimit: Infinity,
        isAdmin: false,
      };
    }

    // ── Paid subscription ───────────────────────────────────────────────────
    const data = subResult.data;
    if (!data || data.plan !== "pro") {
      return { ...empty, contributionCount, effectiveLimit: effectiveLimitFree };
    }

    if (data.current_period_end) {
      const isActive = new Date(data.current_period_end) > new Date();
      return {
        plan: isActive ? "pro" : "free",
        billingInterval: data.billing_interval as "week" | "month" | "year" | null,
        currentPeriodEnd: new Date(data.current_period_end),
        provider: data.payment_provider as "stripe" | "mercadopago" | null,
        status: data.subscription_status,
        contributionCount,
        effectiveLimit: isActive ? Infinity : effectiveLimitFree,
        isAdmin: false,
      };
    }

    const isActive = data.subscription_status === "active";
    return {
      plan: isActive ? "pro" : "free",
      billingInterval: data.billing_interval as "week" | "month" | "year" | null,
      currentPeriodEnd: null,
      provider: data.payment_provider as "stripe" | "mercadopago" | null,
      status: data.subscription_status,
      contributionCount,
      effectiveLimit: isActive ? Infinity : effectiveLimitFree,
      isAdmin: false,
    };
  } catch {
    return empty;
  }
}

export async function getUserPlan(): Promise<Plan> {
  const { plan } = await getUserSubscription();
  return plan;
}
