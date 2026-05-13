"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { getAuthorizationHeader, hasSimpleAuthSessionClient, resolveClientApiUrl } from "@/lib/portal-api";
import { OFFER_PLAN_THUMB_MONEY_MASTERY, OFFER_PLAN_THUMB_THE_KING } from "@/components/programs/offerPlanThumbnails";

type PlanKey = "bundle" | "king";

const AMBER_THEME = {
  title: "text-white",
  dominantBorder: "border-amber-300/70",
} as const;

const VIOLET_THEME = {
  title: "text-white",
  dominantBorder: "border-fuchsia-300/70",
} as const;

const OFFERS: readonly {
  plan: PlanKey;
  title: string;
  imageSrc: string;
  displayPrice: string;
  checkoutAmount: string;
  billing: "monthly";
  theme: typeof AMBER_THEME | typeof VIOLET_THEME;
}[] = [
  {
    plan: "bundle",
    title: "Money Mastery",
    imageSrc: OFFER_PLAN_THUMB_MONEY_MASTERY,
    displayPrice: "£333",
    checkoutAmount: "333",
    billing: "monthly",
    theme: AMBER_THEME,
  },
  {
    plan: "king",
    title: "The King",
    imageSrc: OFFER_PLAN_THUMB_THE_KING,
    displayPrice: "£19.99",
    checkoutAmount: "19.99",
    billing: "monthly",
    theme: VIOLET_THEME,
  },
];

type OfferDef = (typeof OFFERS)[number];

export function PublicPlanOfferCards() {
  const router = useRouter();
  const [busyPlan, setBusyPlan] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);

  const joinOffer = useCallback(
    async (offer: OfferDef) => {
      setError(null);

      if (!hasSimpleAuthSessionClient()) {
        const params = new URLSearchParams({
          plan: offer.plan,
          billing: offer.billing,
          amount: offer.checkoutAmount,
        });
        router.push(`/signup?${params.toString()}`);
        return;
      }

      setBusyPlan(offer.plan);
      try {
        const authHeader = getAuthorizationHeader();
        const response = await fetch(resolveClientApiUrl("/api/auth/checkout/create-session/"), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
          body: JSON.stringify({
            return_base_url: typeof window !== "undefined" ? window.location.origin : undefined,
            selected_plan: offer.plan,
            selected_billing: offer.billing,
            selected_amount: offer.checkoutAmount,
          }),
        });

        const payload = (await response.json().catch(() => ({}))) as {
          checkout_url?: string;
          is_unlocked?: boolean;
          already_purchased?: boolean;
          message?: string;
          error?: string;
        };

        const checkoutUrl = typeof payload.checkout_url === "string" ? payload.checkout_url.trim() : "";
        if (response.ok && checkoutUrl) {
          window.location.assign(checkoutUrl);
          return;
        }
        if (response.ok && (payload.is_unlocked || payload.already_purchased)) {
          router.push("/dashboard?section=programs");
          return;
        }
        const msg =
          typeof payload.message === "string"
            ? payload.message
            : typeof payload.error === "string"
              ? payload.error
              : "Could not start checkout.";
        throw new Error(msg);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not start checkout.");
      } finally {
        setBusyPlan(null);
      }
    },
    [router]
  );

  return (
    <section className="relative mx-auto w-full max-w-[1400px] px-[clamp(1rem,3.2vw,1.5rem)] pb-6 sm:px-6 sm:pb-8">
      {error ? (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-950/25 px-4 py-3 text-[13px] text-amber-100/90">{error}</div>
      ) : null}
      <div className="flex flex-row flex-wrap justify-center gap-3 sm:justify-center sm:gap-4">
        {OFFERS.map((offer) => {
          const theme = offer.theme;
          return (
            <article
              key={offer.plan}
              className={cn(
                "flex w-[min(46vw,220px)] shrink-0 flex-col overflow-hidden rounded-2xl border-2 bg-[#070a12] sm:w-[232px]",
                theme.dominantBorder
              )}
            >
              <div className="relative aspect-[3/4] w-full shrink-0 overflow-hidden">
                <img
                  src={offer.imageSrc}
                  alt=""
                  loading={offer.plan === "bundle" ? "eager" : "lazy"}
                  fetchPriority={offer.plan === "bundle" ? "high" : undefined}
                  decoding="async"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                  className="h-full w-full object-cover object-center [image-rendering:high-quality] [backface-visibility:hidden]"
                />
                <div
                  className={cn(
                    "pointer-events-none absolute inset-0 bg-gradient-to-t opacity-70",
                    offer.plan === "bundle"
                      ? "from-amber-900/55 via-orange-950/25 to-transparent"
                      : "from-violet-900/55 via-fuchsia-950/25 to-transparent"
                  )}
                  aria-hidden
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/55" />
                <div
                  className={cn(
                    "absolute inset-x-0 bottom-0 z-[2] p-3 text-[clamp(0.7rem,2.8vw,1rem)] font-extrabold uppercase leading-tight tracking-[0.06em]",
                    theme.title
                  )}
                >
                  {offer.title}
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2 border-t border-white/10 p-3">
                <div className="text-left text-[10px] font-semibold uppercase tracking-[0.12em] text-white/65">
                  Syndicate plan
                </div>
                <button
                  type="button"
                  disabled={busyPlan === offer.plan}
                  onClick={() => {
                    if (offer.plan === "king") {
                      router.push("/membership");
                      return;
                    }
                    void joinOffer(offer);
                  }}
                  className={cn(
                    "mt-auto w-full rounded-lg border px-2 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] transition sm:text-[11px]",
                    "disabled:cursor-wait disabled:opacity-70",
                    offer.plan === "bundle"
                      ? "border-amber-300/75 bg-[linear-gradient(135deg,rgba(90,70,12,0.5),rgba(28,22,6,0.95))] text-amber-50 hover:brightness-110"
                      : "border-fuchsia-300/75 bg-[linear-gradient(135deg,rgba(60,20,80,0.55),rgba(18,12,28,0.95))] text-fuchsia-50 hover:brightness-110"
                  )}
                >
                  {busyPlan === offer.plan ? "Loading…" : "JOIN NOW"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
