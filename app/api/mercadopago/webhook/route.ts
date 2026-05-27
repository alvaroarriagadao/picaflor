import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  const { type, data } = body as { type: string; data: { id: string } };

  if (type !== "subscription_preapproval")
    return NextResponse.json({ received: true });

  const supabase = createAdminClient();

  try {
    const MercadoPagoConfig = require("mercadopago").MercadoPagoConfig;
    const PreApproval       = require("mercadopago").PreApproval;
    const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
    const preApproval = new PreApproval(mpClient);

    const result  = await preApproval.get({ id: data.id });
    const resultAny = result as any;
    const userId  = resultAny.external_reference;
    if (!userId) return NextResponse.json({ received: true });

    const isActive = resultAny.status === "authorized";
    const billingInterval: "week" | "month" | "year" =
      resultAny.preapproval_plan_id === process.env.MP_PLAN_ID_YEARLY
        ? "year"
        : resultAny.auto_recurring?.frequency_type === "weeks"
        ? "week"
        : "month";
    const currentPeriodEnd = resultAny.next_payment_date
      ? new Date(resultAny.next_payment_date).toISOString()
      : null;

    await supabase.from("user_subscriptions").upsert(
      {
        user_id: userId,
        mp_preapproval_id: data.id,
        plan: isActive ? "pro" : "free",
        billing_interval: billingInterval,
        subscription_status: isActive ? "active" : resultAny.status ?? "inactive",
        payment_provider: "mercadopago",
        current_period_end: currentPeriodEnd,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  } catch (err) {
    console.error("MP webhook error:", err);
  }

  return NextResponse.json({ received: true });
}
