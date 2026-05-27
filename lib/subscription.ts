import { createClient } from "@/lib/supabase-server";

export type Plan = "free" | "pro";
export { FREE_EXERCISE_LIMIT } from "@/lib/plan-config";

export interface SubscriptionInfo {
  plan: Plan;
  billingInterval: "month" | "year" | null;
  currentPeriodEnd: Date | null;
  provider: "stripe" | "mercadopago" | null;
  status: string | null;
}

export async function getUserSubscription(): Promise<SubscriptionInfo> {
  const empty: SubscriptionInfo = {
    plan: "free",
    billingInterval: null,
    currentPeriodEnd: null,
    provider: null,
    status: null,
  };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return empty;

    const { data } = await supabase
      .from("user_subscriptions")
      .select(
        "plan, billing_interval, current_period_end, payment_provider, subscription_status"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (!data || data.plan !== "pro") return empty;

    // Validate expiry when period_end is stored
    if (data.current_period_end) {
      const isActive = new Date(data.current_period_end) > new Date();
      return {
        plan: isActive ? "pro" : "free",
        billingInterval: data.billing_interval as "month" | "year" | null,
        currentPeriodEnd: new Date(data.current_period_end),
        provider: data.payment_provider as "stripe" | "mercadopago" | null,
        status: data.subscription_status,
      };
    }

    return {
      plan: data.subscription_status === "active" ? "pro" : "free",
      billingInterval: data.billing_interval as "month" | "year" | null,
      currentPeriodEnd: null,
      provider: data.payment_provider as "stripe" | "mercadopago" | null,
      status: data.subscription_status,
    };
  } catch {
    return empty;
  }
}

export async function getUserPlan(): Promise<Plan> {
  const { plan } = await getUserSubscription();
  return plan;
}
