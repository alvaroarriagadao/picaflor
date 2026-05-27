import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import type Stripe from "stripe";

export const dynamic = "force-dynamic";

function getStripe() {
  const Stripe = require("stripe");
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" });
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature");

  if (!sig)
    return NextResponse.json({ error: "Sin firma" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Stripe webhook signature error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    // Use `any` for event objects — structure is verified by Stripe signature
    const obj = event.data.object as any;

    switch (event.type) {
      case "checkout.session.completed": {
        if (obj.mode !== "subscription") break;
        const userId     = obj.metadata?.user_id;
        const customerId = obj.customer as string;
        const subId      = obj.subscription as string;
        if (!userId) break;

        const sub      = await stripe.subscriptions.retrieve(subId);
        const subAny   = sub as any;
        const interval = subAny.items?.data?.[0]?.price?.recurring?.interval ?? "month";

        await supabase.from("user_subscriptions").upsert(
          {
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subId,
            plan: "pro",
            billing_interval: interval,
            subscription_status: "active",
            payment_provider: "stripe",
            current_period_start: new Date((subAny.current_period_start ?? 0) * 1000).toISOString(),
            current_period_end:   new Date((subAny.current_period_end   ?? 0) * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
        break;
      }

      case "customer.subscription.updated": {
        const userId = obj.metadata?.user_id;
        if (!userId) break;

        const isActive = ["active", "trialing"].includes(obj.status);
        const interval = obj.items?.data?.[0]?.price?.recurring?.interval ?? "month";

        await supabase.from("user_subscriptions").upsert(
          {
            user_id: userId,
            stripe_subscription_id: obj.id,
            plan: isActive ? "pro" : "free",
            billing_interval: interval,
            subscription_status: obj.status,
            payment_provider: "stripe",
            current_period_start: new Date((obj.current_period_start ?? 0) * 1000).toISOString(),
            current_period_end:   new Date((obj.current_period_end   ?? 0) * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
        break;
      }

      case "customer.subscription.deleted": {
        const userId = obj.metadata?.user_id;
        if (!userId) break;

        await supabase.from("user_subscriptions").upsert(
          {
            user_id: userId,
            stripe_subscription_id: obj.id,
            plan: "free",
            subscription_status: "cancelled",
            payment_provider: "stripe",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
        break;
      }

      case "invoice.payment_failed": {
        const subId = obj.subscription as string;
        if (!subId) break;

        await supabase
          .from("user_subscriptions")
          .update({ subscription_status: "past_due", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subId);
        break;
      }
    }
  } catch (err) {
    console.error("Webhook handler error:", err);
  }

  return NextResponse.json({ received: true });
}
