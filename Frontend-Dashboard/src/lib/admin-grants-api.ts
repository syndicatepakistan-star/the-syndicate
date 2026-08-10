/** Staff grant-by-email API (Django /api/auth/admin/grants/). */

import { portalFetch } from "@/lib/portal-api";

export type AdminGrantPlanItem = {
  slug: string;
  title: string;
  group: string;
};

export type AdminGrantPlaylistItem = {
  id: number;
  title: string;
  category: string;
  vault_plan_slug: string;
};

export type AdminGrantCatalog = {
  plans: AdminGrantPlanItem[];
  playlists: AdminGrantPlaylistItem[];
};

export type AdminGrantLookup = {
  email: string;
  exists: boolean;
  user_id?: number;
  username?: string;
  entitlement?: {
    money_mastery_lifetime?: boolean;
    knight_subscription_expires_at?: string | null;
    access_tier?: string | null;
  };
  plan_slugs?: string[];
  playlist_ids?: number[];
};

export type AdminGrantDurationType = "lifetime" | "month" | "days" | "custom";

export type AdminGrantRequest = {
  email: string;
  plan_slugs: string[];
  playlist_ids: number[];
  duration_type: AdminGrantDurationType;
  days?: number | null;
  expires_at?: string | null;
  create_user_if_missing?: boolean;
};

export type AdminGrantResult = {
  email: string;
  user_id: number;
  username: string;
  user_created: boolean;
  duration_type: string;
  knight_expires_at?: string | null;
  plans: Array<{ slug: string; ok: boolean; error?: string; knight_expires_at?: string }>;
  playlists: Array<{ playlist_id: number; title?: string; ok: boolean; error?: string }>;
  entitlement?: {
    money_mastery_lifetime?: boolean;
    knight_subscription_expires_at?: string | null;
    access_tier?: string | null;
  };
  summary?: { plans_granted: number; playlists_granted: number };
  detail?: string;
};

export async function fetchAdminGrantCatalog(): Promise<AdminGrantCatalog | null> {
  const { ok, data } = await portalFetch<AdminGrantCatalog>("/api/auth/admin/grants/catalog/");
  if (!ok || !data || !Array.isArray(data.plans)) return null;
  return {
    plans: data.plans,
    playlists: Array.isArray(data.playlists) ? data.playlists : [],
  };
}

export async function lookupAdminGrantEmail(email: string): Promise<AdminGrantLookup | null> {
  const q = encodeURIComponent(email.trim());
  const { ok, data } = await portalFetch<AdminGrantLookup>(`/api/auth/admin/grants/lookup/?email=${q}`);
  if (!ok || !data) return null;
  return data;
}

export async function postAdminGrantAccess(
  body: AdminGrantRequest,
): Promise<{ ok: boolean; status: number; data: AdminGrantResult }> {
  const { ok, status, data } = await portalFetch<AdminGrantResult>("/api/auth/admin/grants/", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return { ok, status, data };
}
