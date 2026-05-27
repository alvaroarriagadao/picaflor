import { createClient } from "@/lib/supabase-server";
import { FREE_EXERCISE_LIMIT } from "@/lib/plan-config";

export type Plan = "free" | "pro";
export { FREE_EXERCISE_LIMIT } from "@/lib/plan-config";

// 1 approved contribution → +1 bonus exercise (up to this max)
export const MAX_CONTRIBUTION_BONUS = 8;
// Reach this many approved contributions → Pro access for free
export const CONTRIBUTIONS_FOR_PRO  = 15;

export interface SubscriptionInfo {
  plan: Plan;
  billingInterval: "week" | "month" | "year" | null;
  currentPeriodEnd: Date | null;
  provider: "stripe" | "mercadopago" | null;
  status: string | null;
  contributionCount: number;    // # approved community exercises
  isContributionPro: boolean;   // Pro earned by contributing
  effectiveLimit: number;       // accessible library exercises (Infinity = pro)
}

export async function getUserSubscription(): Promise<SubscriptionInfo> {
  const empty: SubscriptionInfo = {
    plan: "free",
    billingInterval: null,
    currentPeriodEnd: null,
    provider: null,
    status: null,
    contributionCount: 0,
    isContributionPro: false,
    effectiveLimit: FREE_EXERCISE_LIMIT,
  };

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return empty;

    // Run paid sub + contribution count in parallel
    const [subResult, contribResult] = await Promise.all([
      supabase
        .from("user_subscriptions")
        .select("plan, billing_interval, current_period_end, payment_provider, subscription_status")
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("exercise_submissions")
        .select("id", { count: "exact", head: true })
        .eq("submitter_email", user.email ?? "")
        .eq("status", "approved"),
    ]);

    const contributionCount = contribResult.count ?? 0;
    const isContributionPro  = contributionCount >= CONTRIBUTIONS_FOR_PRO;
    const effectiveLimitFree = FREE_EXERCISE_LIMIT + Math.min(contributionCount, MAX_CONTRIBUTION_BONUS);

    // Contribution-based Pro
    if (isContributionPro) {
      return {
        plan: "pro",
        billingInterval: null,
        currentPeriodEnd: null,
        provider: null,
        status: "contribution_pro",
        contributionCount,
        isContributionPro: true,
        effectiveLimit: Infinity,
      };
    }

    const data = subResult.data;
    if (!data || data.plan !== "pro") {
      return { ...empty, contributionCount, effectiveLimit: effectiveLimitFree };
    }

    // Check expiry for paid plans
    if (data.current_period_end) {
      const isActive = new Date(data.current_period_end) > new Date();
      return {
        plan: isActive ? "pro" : "free",
        billingInterval: data.billing_interval as "week" | "month" | "year" | null,
        currentPeriodEnd: new Date(data.current_period_end),
        provider: data.payment_provider as "stripe" | "mercadopago" | null,
        status: data.subscription_status,
        contributionCount,
        isContributionPro: false,
        effectiveLimit: isActive ? Infinity : effectiveLimitFree,
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
      isContributionPro: false,
      effectiveLimit: isActive ? Infinity : effectiveLimitFree,
    };
  } catch {
    return empty;
  }
}

export async function getUserPlan(): Promise<Plan> {
  const { plan } = await getUserSubscription();
  return plan;
}
