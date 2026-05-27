import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://picaflor-kappa.vercel.app";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { interval } = (await req.json()) as { interval: "month" | "year" };

  const planId = interval === "year"
    ? process.env.MP_PLAN_ID_YEARLY!
    : process.env.MP_PLAN_ID_MONTHLY!;

  const MercadoPagoConfig = require("mercadopago").MercadoPagoConfig;
  const PreApproval       = require("mercadopago").PreApproval;
  const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
  const preApproval = new PreApproval(mpClient);

  const result = await preApproval.create({
    body: {
      preapproval_plan_id: planId,
      payer_email: user.email,
      back_url: `${APP_URL}/precios/exito?provider=mp`,
      external_reference: user.id,
      status: "pending",
    },
  });

  return NextResponse.json({ url: result.init_point });
}
