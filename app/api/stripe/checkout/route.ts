import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

// Lazy init so build-time static analysis doesn't fail on missing env vars
function getStripe() {
  const Stripe = require("stripe");
  return new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2025-02-24.acacia" });
}

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://picaflor-kappa.vercel.app";

export async function POST(req: Request) {
  const stripe = getStripe();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { priceId } = (await req.json()) as { priceId: string };
  if (!priceId)
    return NextResponse.json({ error: "priceId requerido" }, { status: 400 });

  // Reuse existing Stripe customer if possible
  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    ...(sub?.stripe_customer_id
      ? { customer: sub.stripe_customer_id }
      : { customer_email: user.email! }),
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/precios/exito?session_id={CHECKOUT_SESSION_ID}&provider=stripe`,
    cancel_url: `${APP_URL}/precios`,
    allow_promotion_codes: true,
    metadata: { user_id: user.id },
    subscription_data: { metadata: { user_id: user.id } },
  });

  return NextResponse.json({ url: session.url });
}
