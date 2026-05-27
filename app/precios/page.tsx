import PreciosClient from "./PreciosClient";

export const dynamic = "force-dynamic";

interface MPPlanInfo {
  id: string;
  reason: string;
  auto_recurring: {
    frequency: number;
    frequency_type: string; // "months" | "weeks" | "days"
    transaction_amount: number;
    currency_id: string;
  };
}

async function fetchMPPlan(planId: string, token: string): Promise<MPPlanInfo | null> {
  try {
    const res = await fetch(`https://api.mercadopago.com/preapproval_plan/${planId}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function PreciosPage() {
  const token  = process.env.MP_ACCESS_TOKEN ?? "";
  const idA    = process.env.MP_PLAN_ID_MONTHLY ?? "";
  const idB    = process.env.MP_PLAN_ID_YEARLY ?? "";

  const [planA, planB] = await Promise.all([
    token && idA ? fetchMPPlan(idA, token) : null,
    token && idB ? fetchMPPlan(idB, token) : null,
  ]);

  return <PreciosClient planA={planA} planB={planB} />;
}
