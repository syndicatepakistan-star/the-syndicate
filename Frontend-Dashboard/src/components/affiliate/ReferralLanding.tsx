"use client";

import { startTransition, useLayoutEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { trackClickFireAndForget } from "@/lib/affiliateApi";
import {
  resolveAffiliateDestination,
  saveAffiliateAttribution,
} from "@/lib/affiliateAttribution";

const VISITOR_MAP_KEY = "affiliate_visitor_ids_v1";

function makeVisitorId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `v-${crypto.randomUUID()}`;
  }
  return `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getVisitorIdForAffiliate(affiliateId: string): string {
  if (typeof window === "undefined") return makeVisitorId();
  try {
    const raw = window.localStorage.getItem(VISITOR_MAP_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    const existing = parsed[affiliateId];
    if (existing) return existing;
    const created = makeVisitorId();
    parsed[affiliateId] = created;
    window.localStorage.setItem(VISITOR_MAP_KEY, JSON.stringify(parsed));
    return created;
  } catch {
    return makeVisitorId();
  }
}

export function ReferralLanding() {
  const params = useParams<{ affiliateId: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const affiliateId = decodeURIComponent(params?.affiliateId ?? "");
  const offer = search.get("offer") ?? "affiliate-offer";
  const tier = search.get("tier") ?? undefined;
  const program = search.get("program") ?? undefined;

  useLayoutEffect(() => {
    if (!affiliateId) return;
    const vid = getVisitorIdForAffiliate(affiliateId);
    saveAffiliateAttribution({
      affiliateId,
      visitorId: vid,
      offer,
      tier,
      program,
    });
    const destination = resolveAffiliateDestination(offer);

    // Start tracking without waiting for response (keepalive survives navigation).
    trackClickFireAndForget(affiliateId, vid);

    // Navigate in the same frame / transition so UI does not wait on the track API.
    startTransition(() => {
      router.replace(destination);
    });
  }, [affiliateId, offer, program, router, tier]);

  return null;
}
