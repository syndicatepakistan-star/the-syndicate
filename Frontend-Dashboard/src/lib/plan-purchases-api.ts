import { getAuthorizationHeader, portalFetch } from "@/lib/portal-api";

export async function fetchPurchasedPlanSlugs(): Promise<string[]> {
  const auth = getAuthorizationHeader();
  if (!auth) return [];

  const { ok, data } = await portalFetch<{ plan_slugs?: string[] }>("/api/auth/plan-purchases/slugs/");
  if (!ok || !data || !Array.isArray(data.plan_slugs)) return [];
  return data.plan_slugs.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
}
