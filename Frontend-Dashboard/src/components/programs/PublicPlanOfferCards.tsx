"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { getAuthorizationHeader, hasSimpleAuthSessionClient, resolveClientApiUrl } from "@/lib/portal-api";
import { OFFER_PLAN_THUMB_MONEY_MASTERY, OFFER_PLAN_THUMB_THE_KING } from "@/components/programs/offerPlanThumbnails";

type PlanKey = "bundle" | "king";

const AMBER_THEME = {
  glow: "shadow-[0_14px_38px_rgba(0,0,0,0.58),0_0_0_1px_rgba(251,191,36,0.42),0_0_58px_rgba(245,158,11,0.52),0_0_110px_rgba(245,158,11,0.26)]",
  ring: "from-amber-300/95 via-yellow-400/95 to-orange-300/95",
  aura: "bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.45)_0%,rgba(234,88,12,0.28)_35%,rgba(0,0,0,0)_75%)]",
  spark: "from-amber-100/0 via-amber-100/90 to-white/0",
  title: "text-white",
  infoPanel: "border-amber-300/35 bg-amber-950/28",
  dominantBorder: "border-amber-300/75",
} as const;

const VIOLET_THEME = {
  glow: "shadow-[0_14px_38px_rgba(0,0,0,0.58),0_0_0_1px_rgba(196,181,253,0.42),0_0_58px_rgba(139,92,246,0.5),0_0_110px_rgba(217,70,239,0.26)]",
  ring: "from-violet-300/95 via-purple-400/95 to-fuchsia-300/95",
  aura: "bg-[radial-gradient(circle_at_center,rgba(217,70,239,0.42)_0%,rgba(139,92,246,0.28)_35%,rgba(0,0,0,0)_75%)]",
  spark: "from-fuchsia-200/0 via-fuchsia-200/85 to-white/0",
  title: "text-white",
  infoPanel: "border-fuchsia-300/35 bg-fuchsia-950/28",
  dominantBorder: "border-fuchsia-300/75",
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:gap-6">
        {OFFERS.map((offer) => {
          const theme = offer.theme;
          return (
            <article
              key={offer.plan}
              className={cn(
                "group/card relative flex min-h-[26rem] w-full flex-col overflow-hidden text-left sm:min-h-[30rem] lg:min-h-[32rem]",
                "rounded-3xl border-2",
                theme.dominantBorder,
                theme.glow
              )}
            >
              <span className={cn("pointer-events-none absolute inset-[-22%] z-0 rounded-[2.2rem] blur-[38px]", theme.aura)} aria-hidden />
              <span
                className={cn(
                  "pointer-events-none absolute left-[-40%] top-[8%] z-[1] h-[24%] w-[180%] -rotate-[28deg] bg-gradient-to-r opacity-85 mix-blend-screen blur-[10px]",
                  theme.spark
                )}
                aria-hidden
              />
              <span
                className={cn(
                  "pointer-events-none absolute right-[-28%] top-[58%] z-[1] h-[17%] w-[130%] -rotate-[24deg] bg-gradient-to-r opacity-70 mix-blend-screen blur-[12px]",
                  theme.spark
                )}
                aria-hidden
              />
              <span className="pointer-events-none absolute right-3 top-3 z-[2] h-10 w-10 rounded-full bg-white/45 blur-[14px] mix-blend-screen" aria-hidden />
              <span
                className={cn(
                  "pointer-events-none absolute left-1/2 top-1/2 z-[1] aspect-square w-[185%] max-w-none -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r",
                  theme.ring
                )}
                aria-hidden
              />
              <span className="relative z-[2] m-[1px] flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.45rem] bg-[#04060d] ring-1 ring-black/70">
                <div className="relative z-[3] flex h-full min-h-0 flex-col gap-2 p-3 sm:gap-3 sm:p-3.5">
                  <div className="relative min-h-[15rem] flex-1 overflow-hidden rounded-2xl border-2 border-white/20 sm:min-h-[18rem] lg:min-h-[22rem]">
                    <img
                      src={offer.imageSrc}
                      alt=""
                      loading={offer.plan === "bundle" ? "eager" : "lazy"}
                      fetchPriority={offer.plan === "bundle" ? "high" : undefined}
                      decoding="async"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                      className="absolute inset-0 h-full w-full object-cover object-center [image-rendering:high-quality] [backface-visibility:hidden]"
                    />
                    <div
                      className={cn(
                        "pointer-events-none absolute inset-0 bg-gradient-to-t opacity-75",
                        offer.plan === "bundle"
                          ? "from-amber-600/70 via-orange-950/40 to-transparent"
                          : "from-violet-900/65 via-fuchsia-950/40 to-transparent"
                      )}
                      aria-hidden
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/65" />
                    <div
                      className={cn(
                        "absolute inset-x-0 bottom-0 z-[2] p-4 sm:p-5",
                        "text-[clamp(1.1rem,3.5vw,1.65rem)] font-extrabold uppercase leading-tight tracking-[0.06em] drop-shadow-[0_2px_12px_rgba(0,0,0,0.9)] sm:tracking-[0.1em]",
                        theme.title
                      )}
                    >
                      {offer.title}
                    </div>
                  </div>
                  <div className="absolute right-3 top-3 z-[4] sm:right-4 sm:top-4">
                    <span
                      className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-emerald-300/50 bg-[#03140d]/95 px-2 py-0.5 tabular-nums text-[12px] font-black tracking-normal text-emerald-100 shadow-[0_0_16px_rgba(52,211,153,0.28)] sm:px-3 sm:py-1 sm:text-[15px]"
                      style={{ fontFamily: "Inter, Arial, Helvetica, sans-serif", fontFeatureSettings: '"tnum" 1, "lnum" 1' }}
                    >
                      {offer.displayPrice}
                    </span>
                  </div>
                  <div
                    className={cn(
                      "flex flex-col overflow-hidden rounded-2xl border-2 px-2.5 py-2.5 sm:px-3 sm:py-3",
                      theme.infoPanel,
                      "bg-black/60 shadow-[0_10px_30px_rgba(0,0,0,0.62),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md"
                    )}
                  >
                    <div className="text-left text-[clamp(11px,2.4vw,14px)] font-semibold uppercase leading-snug tracking-[0.04em] text-white/80 sm:tracking-[0.06em]">
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
                        "mt-3 w-full rounded-xl px-3 py-3 text-[clamp(11px,2.6vw,13px)] font-black uppercase tracking-[0.12em] transition sm:py-3.5 sm:tracking-[0.16em]",
                        "disabled:cursor-wait disabled:opacity-70",
                        offer.plan === "bundle"
                          ? "border border-[#caa724]/90 bg-[linear-gradient(135deg,rgba(202,167,36,0.28),rgba(98,73,11,0.98))] text-[#ffe9a3] shadow-[0_0_22px_rgba(202,167,36,0.65),inset_0_0_0_1px_rgba(202,167,36,0.35)] hover:scale-[1.01] hover:shadow-[0_0_32px_rgba(202,167,36,0.85),0_0_48px_rgba(202,167,36,0.45)]"
                          : "border border-fuchsia-300/80 bg-[linear-gradient(135deg,rgba(88,28,135,0.45),rgba(30,27,75,0.95))] text-fuchsia-50 shadow-[0_0_22px_rgba(192,132,252,0.45),inset_0_0_0_1px_rgba(192,132,252,0.25)] hover:scale-[1.01] hover:shadow-[0_0_32px_rgba(217,70,239,0.55)]"
                      )}
                    >
                      {busyPlan === offer.plan ? "Loading…" : "JOIN NOW"}
                    </button>
                  </div>
                </div>
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
