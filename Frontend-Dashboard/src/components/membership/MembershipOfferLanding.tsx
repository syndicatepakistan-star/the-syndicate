"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { getAuthorizationHeader, hasSimpleAuthSessionClient, resolveClientApiUrl } from "@/lib/portal-api";
import { OFFER_PLAN_THUMB_THE_KING } from "@/components/programs/offerPlanThumbnails";

const BILLING = "monthly" as const;
const CHECKOUT_AMOUNT = "19.99";
const DISPLAY_PRICE = "£19.99";

const UNLOCK_FEATURES: readonly string[] = [
  "Select 4–5 courses yourself from the catalog",
  "Weekly content and member drops",
  "Full dashboard access",
  "Membership articles and secure video hub",
  "Exclusive membership section",
  "Goals and milestones (full deck)",
  "Syndicate Mode challenges",
];

/** One dystopian neon channel per perk row (length must match `UNLOCK_FEATURES`). */
const FEATURE_CHANNEL = [
  {
    ring: "linear-gradient(135deg, #00ffc8 0%, #0d9488 42%, #022c22 100%)",
    bar: "linear-gradient(180deg, #5eead4 0%, #0f766e 42%, #042f2e 100%)",
    outerGlow:
      "0 0 0 1px rgba(0,255,200,0.92), 0 0 0 3px rgba(15,118,110,0.35), 0 0 6px rgba(0,255,200,0.95), 0 0 42px rgba(45,212,191,0.5), 0 0 88px rgba(13,148,136,0.22)",
    panel: "linear-gradient(165deg, rgba(2,14,12,0.98) 0%, rgba(0,6,8,0.99) 100%)",
    inset: "inset 0 0 0 2px rgba(45,212,191,0.5), 0 0 0 1px rgba(0,255,200,0.25), 0 0 32px rgba(16,185,129,0.2)",
    check: "text-teal-300 drop-shadow-[0_0_14px_rgba(94,234,212,0.95)] h-5 w-5 sm:h-6 sm:w-6",
    text: "text-teal-50/93",
  },
  {
    ring: "linear-gradient(135deg, #ff1744 0%, #be123c 48%, #450a0a 100%)",
    bar: "linear-gradient(180deg, #fda4af 0%, #e11d48 45%, #7f1d1d 100%)",
    outerGlow:
      "0 0 0 1px rgba(255,99,132,0.95), 0 0 0 3px rgba(190,18,60,0.4), 0 0 6px rgba(255,23,68,0.95), 0 0 44px rgba(244,63,94,0.55), 0 0 96px rgba(127,29,29,0.25)",
    panel: "linear-gradient(165deg, rgba(18,4,8,0.98) 0%, rgba(8,2,4,0.99) 100%)",
    inset: "inset 0 0 0 2px rgba(251,113,133,0.45), 0 0 0 1px rgba(225,29,72,0.35), 0 0 32px rgba(244,63,94,0.18)",
    check: "text-rose-400 drop-shadow-[0_0_14px_rgba(251,113,133,0.9)] h-5 w-5 sm:h-6 sm:w-6",
    text: "text-rose-50/92",
  },
  {
    ring: "linear-gradient(135deg, #facc15 0%, #ea580c 40%, #4d7c0f 100%)",
    bar: "linear-gradient(180deg, #fef08a 0%, #ca8a04 38%, #365314 100%)",
    outerGlow:
      "0 0 0 1px rgba(250,204,21,0.95), 0 0 0 3px rgba(234,88,12,0.35), 0 0 6px rgba(250,204,21,0.9), 0 0 40px rgba(251,146,60,0.48), 0 0 90px rgba(101,163,13,0.2)",
    panel: "linear-gradient(165deg, rgba(12,10,2,0.98) 0%, rgba(8,12,4,0.99) 100%)",
    inset: "inset 0 0 0 2px rgba(250,204,21,0.35), 0 0 0 1px rgba(234,88,12,0.28), 0 0 28px rgba(202,138,4,0.18)",
    check: "text-amber-300 drop-shadow-[0_0_14px_rgba(250,204,21,0.85)] h-5 w-5 sm:h-6 sm:w-6",
    text: "text-amber-50/93",
  },
  {
    ring: "linear-gradient(135deg, #c084fc 0%, #db2777 45%, #ea580c 100%)",
    bar: "linear-gradient(180deg, #e9d5ff 0%, #a855f7 40%, #c2410c 100%)",
    outerGlow:
      "0 0 0 1px rgba(233,213,255,0.9), 0 0 0 3px rgba(192,38,211,0.32), 0 0 6px rgba(168,85,247,1), 0 0 44px rgba(236,72,153,0.45), 0 0 96px rgba(234,88,12,0.18)",
    panel: "linear-gradient(165deg, rgba(14,4,18,0.98) 0%, rgba(12,6,8,0.99) 100%)",
    inset: "inset 0 0 0 2px rgba(192,132,252,0.45), 0 0 0 1px rgba(219,39,119,0.3), 0 0 32px rgba(168,85,247,0.16)",
    check: "text-fuchsia-400 drop-shadow-[0_0_14px_rgba(232,121,249,0.85)] h-5 w-5 sm:h-6 sm:w-6",
    text: "text-fuchsia-50/92",
  },
  {
    ring: "linear-gradient(135deg, #39ff14 0%, #15803d 45%, #052e16 100%)",
    bar: "linear-gradient(180deg, #bbf7d0 0%, #22c55e 40%, #14532d 100%)",
    outerGlow:
      "0 0 0 1px rgba(57,255,20,0.95), 0 0 0 3px rgba(21,128,61,0.35), 0 0 6px rgba(57,255,20,0.95), 0 0 40px rgba(74,222,128,0.5), 0 0 90px rgba(22,163,74,0.22)",
    panel: "linear-gradient(165deg, rgba(4,18,8,0.98) 0%, rgba(2,10,4,0.99) 100%)",
    inset: "inset 0 0 0 2px rgba(74,222,128,0.45), 0 0 0 1px rgba(57,255,20,0.22), 0 0 28px rgba(34,197,94,0.18)",
    check: "text-lime-400 drop-shadow-[0_0_14px_rgba(57,255,20,0.9)] h-5 w-5 sm:h-6 sm:w-6",
    text: "text-lime-50/93",
  },
  {
    ring: "linear-gradient(135deg, #38bdf8 0%, #2563eb 48%, #0c1929 100%)",
    bar: "linear-gradient(180deg, #bae6fd 0%, #3b82f6 42%, #1e3a8a 100%)",
    outerGlow:
      "0 0 0 1px rgba(125,211,252,0.95), 0 0 0 3px rgba(37,99,235,0.35), 0 0 6px rgba(56,189,248,0.95), 0 0 42px rgba(59,130,246,0.5), 0 0 88px rgba(30,64,175,0.22)",
    panel: "linear-gradient(165deg, rgba(4,10,22,0.98) 0%, rgba(2,6,14,0.99) 100%)",
    inset: "inset 0 0 0 2px rgba(96,165,250,0.45), 0 0 0 1px rgba(56,189,248,0.25), 0 0 30px rgba(59,130,246,0.16)",
    check: "text-sky-400 drop-shadow-[0_0_14px_rgba(56,189,248,0.9)] h-5 w-5 sm:h-6 sm:w-6",
    text: "text-sky-50/93",
  },
  {
    ring: "linear-gradient(135deg, #fb923c 0%, #ea580c 42%, #7c2d12 100%)",
    bar: "linear-gradient(180deg, #ffedd5 0%, #f97316 40%, #9a3412 100%)",
    outerGlow:
      "0 0 0 1px rgba(254,215,170,0.95), 0 0 0 3px rgba(234,88,12,0.35), 0 0 6px rgba(251,146,60,0.95), 0 0 40px rgba(249,115,22,0.48), 0 0 88px rgba(124,45,18,0.2)",
    panel: "linear-gradient(165deg, rgba(18,8,4,0.98) 0%, rgba(12,6,4,0.99) 100%)",
    inset: "inset 0 0 0 2px rgba(253,186,116,0.4), 0 0 0 1px rgba(234,88,12,0.28), 0 0 28px rgba(251,146,60,0.14)",
    check: "text-orange-300 drop-shadow-[0_0_14px_rgba(251,146,60,0.88)] h-5 w-5 sm:h-6 sm:w-6",
    text: "text-orange-50/93",
  },
] as const;

if (UNLOCK_FEATURES.length !== FEATURE_CHANNEL.length) {
  throw new Error("UNLOCK_FEATURES and FEATURE_CHANNEL length must match");
}

export function MembershipOfferLanding() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unlockMembership = useCallback(async () => {
    setError(null);
    if (!hasSimpleAuthSessionClient()) {
      const params = new URLSearchParams({
        plan: "king",
        billing: BILLING,
        amount: CHECKOUT_AMOUNT,
      });
      router.push(`/signup?${params.toString()}`);
      return;
    }

    setBusy(true);
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
          selected_plan: "king",
          selected_billing: BILLING,
          selected_amount: CHECKOUT_AMOUNT,
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
        router.push("/dashboard?section=resources");
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
      setBusy(false);
    }
  }, [router]);

  return (
    <main className="relative z-10 min-h-[calc(100dvh-4rem)] w-full min-w-0 overflow-x-clip px-[clamp(1rem,3.2vw,1.5rem)] pb-20 pt-24 sm:px-6 sm:pb-24 sm:pt-28">
      {/* Light HUD readout over page video (video lives on layout) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.1]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,255,200,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,60,0.14) 1px, transparent 1px)",
            backgroundSize: "52px 52px, 52px 52px",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,0,0,0.45) 3px, rgba(0,0,0,0.45) 4px)",
          }}
        />
        <div
          className="absolute inset-0 opacity-35"
          style={{
            background:
              "radial-gradient(ellipse 85% 55% at 50% 0%, rgba(0,255,200,0.08), transparent 52%), radial-gradient(ellipse 70% 50% at 100% 100%, rgba(255,0,60,0.07), transparent 55%)",
          }}
        />
      </div>

      <div className="relative mx-auto w-full max-w-[min(1280px,96vw)] space-y-12 sm:space-y-14">
        <header className="relative mx-auto w-full max-w-[min(1240px,98vw)]">
          <div
            className="relative p-[3px] [clip-path:polygon(22px_0,calc(100%-22px)_0,100%_22px,100%_calc(100%-22px),calc(100%-22px)_100%,22px_100%,0_calc(100%-22px),0_22px)]"
            style={{
              background: "linear-gradient(125deg, #00ffc8, #ff003c, #ff9f1c, #39ff14, #00ffc8)",
              backgroundSize: "200% 200%",
              boxShadow:
                "0 0 0 1px rgba(255,255,255,0.45), 0 0 0 4px rgba(255,0,60,0.2), 0 0 14px rgba(0,255,200,0.75), 0 0 56px rgba(255,0,60,0.35), 0 0 100px rgba(255,159,28,0.2)",
            }}
          >
            <div
              className="relative overflow-hidden bg-[linear-gradient(180deg,rgba(6,4,8,0.94)_0%,rgba(2,2,6,0.98)_100%)] px-5 py-8 backdrop-blur-md sm:px-12 sm:py-11 [clip-path:polygon(20px_0,calc(100%-20px)_0,100%_20px,100%_calc(100%-20px),calc(100%-20px)_100%,20px_100%,0_calc(100%-20px),0_20px)]"
              style={{ boxShadow: "inset 0 0 0 1px rgba(255,159,28,0.22), inset 0 0 60px rgba(0,0,0,0.55)" }}
            >
              <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(57,255,20,0.22)_3px,rgba(57,255,20,0.22)_4px)]" />
              <div className="pointer-events-none absolute left-2 top-2 h-10 w-10 border-l-2 border-t-2 border-amber-400/80 sm:left-4 sm:top-4" />
              <div className="pointer-events-none absolute bottom-2 right-2 h-10 w-10 border-b-2 border-r-2 border-rose-500/75 sm:bottom-4 sm:right-4" />

              <div className="relative flex flex-col items-center text-center">
                {/* Metallic title: never combine `filter` with `background-clip: text` on the same node — it can paint blank in WebKit. */}
                <h1
                  className="mt-2 max-w-[min(100%,22ch)] text-balance font-black uppercase leading-[0.92] tracking-[0.04em] [font-size:clamp(2.6rem,6.5vw+0.2rem,4.6rem)]"
                  style={{
                    background: "linear-gradient(180deg, #fafafa 0%, #d4d4d8 32%, #71717a 68%, #27272a 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    color: "transparent",
                    textShadow:
                      "0 2px 0 rgba(0,0,0,0.75), 0 0 28px rgba(0,255,200,0.35), 0 0 52px rgba(255,0,60,0.22)",
                  }}
                >
                  Syndicate membership
                </h1>
                <p
                  className="mx-auto mt-6 max-w-[56ch] font-mono text-lg leading-relaxed text-teal-200/90 sm:text-xl sm:leading-relaxed lg:text-2xl lg:leading-relaxed"
                  style={{ textShadow: "0 0 18px rgba(45,212,191,0.35), 0 0 32px rgba(0,255,200,0.12)" }}
                >
                  Your curriculum, your rhythm: choose programs, unlock the full membership library, Syndicate Mode, and the
                  complete goals stack. Review what is included, then join to open Stripe checkout when you are signed in—or
                  create an account first if you are new.
                </p>
                <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.35em] text-[#39ff14] sm:text-[11px]" style={{ textShadow: "0 0 14px rgba(57,255,20,0.65)" }}>
                  // uplink_ready · neon_auth
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Hero: two asymmetric HUD cards */}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.28fr)] lg:gap-8">
          {/* Visual channel — three-tier King billboard */}
          <div
            className="relative p-[4px] [clip-path:polygon(22px_0,calc(100%-22px)_0,100%_22px,100%_calc(100%-22px),calc(100%-22px)_100%,22px_100%,0_calc(100%-22px),0_22px)]"
            style={{
              background: "linear-gradient(135deg, #00ffc8, #ff003c, #ff9f1c, #a855f7)",
              boxShadow:
                "0 0 0 1px rgba(0,255,200,0.85), 0 0 0 3px rgba(255,0,60,0.25), 0 0 8px rgba(0,255,200,0.9), 0 0 56px rgba(255,0,60,0.38), 0 0 96px rgba(255,159,28,0.22), 0 0 120px rgba(168,85,247,0.15)",
            }}
          >
            <div
              className="pointer-events-none absolute inset-[10px] border-[2px] border-teal-400/75 [clip-path:polygon(18px_0,calc(100%-18px)_0,100%_18px,100%_calc(100%-18px),calc(100%-18px)_100%,18px_100%,0_calc(100%-18px),0_18px)]"
              style={{
                boxShadow:
                  "inset 0 0 0 1px rgba(45,212,191,0.4), inset 0 0 40px rgba(0,255,200,0.12), 0 0 24px rgba(0,255,200,0.18)",
              }}
            />
            <div
              className="pointer-events-none absolute left-4 top-4 h-8 w-8 border-l-[3px] border-t-[3px] border-[#00ffc8]/90"
              style={{ boxShadow: "-2px -2px 12px rgba(0,255,200,0.45)" }}
            />
            <div
              className="pointer-events-none absolute bottom-4 right-4 h-8 w-8 border-b-[3px] border-r-[3px] border-rose-400/90"
              style={{ boxShadow: "2px 2px 12px rgba(255,23,68,0.45)" }}
            />
            <div className="relative flex flex-col overflow-hidden bg-[#040208] [clip-path:polygon(18px_0,calc(100%-18px)_0,100%_18px,100%_calc(100%-18px),calc(100%-18px)_100%,18px_100%,0_calc(100%-18px),0_18px)]">
              {/* Tier 1 — hero art (no title overlay) */}
              <div className="relative min-h-[200px] sm:min-h-[240px] lg:min-h-[260px]">
                <img
                  src={OFFER_PLAN_THUMB_THE_KING}
                  alt=""
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-black/65 to-black/90" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_20%_30%,rgba(59,130,246,0.25),transparent_50%),radial-gradient(ellipse_70%_50%_at_85%_20%,rgba(249,115,22,0.18),transparent_45%)]" />
                <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(105deg,transparent_35%,rgba(0,255,200,0.12)_50%,transparent_65%)]" />
              </div>

              {/* Toxic scan hairline */}
              <div
                className="relative z-10 h-[2px] w-full shrink-0"
                style={{
                  background: "linear-gradient(90deg, transparent, rgba(0,255,200,0.95), transparent)",
                  boxShadow: "0 0 16px rgba(0,255,200,0.75), 0 0 32px rgba(255,0,60,0.25)",
                }}
              />

              {/* Tier 2 — uplink bar (angled bottom) */}
              <div
                className="relative z-10 min-w-0 bg-black px-5 py-3.5 sm:px-8 sm:py-4 [clip-path:polygon(0_0,100%_0,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px))]"
                style={{ boxShadow: "inset 0 1px 0 rgba(0,255,200,0.22)" }}
              >
                <p className="text-left font-mono text-xs font-bold leading-relaxed text-white/95 sm:text-sm">
                  <span className="text-rose-400 uppercase tracking-[0.08em] drop-shadow-[0_0_12px_rgba(255,23,68,0.75)]">
                    [VISUAL_UPLINK]
                  </span>{" "}
                  <span className="font-semibold tracking-wide text-teal-100/90 normal-case">
                    The King tier — full Syndicate OS, not a single course.
                  </span>
                </p>
              </div>

              {/* Tier 3 — hazard deck + target bracket */}
              <div className="relative z-10 min-h-[92px] flex-1 bg-gradient-to-b from-orange-600/90 via-rose-900/95 to-[#1a0508] sm:min-h-[108px]">
                <div
                  className="pointer-events-none absolute bottom-4 right-4 h-11 w-11 border-b-2 border-r-2 border-white/80"
                  style={{ boxShadow: "4px 4px 0 rgba(0,0,0,0.35)" }}
                  aria-hidden
                />
                <div className="flex min-w-0 flex-col justify-center px-6 py-4 sm:px-9 sm:py-5">
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.28em] text-amber-200/90">// protocol_surface</p>
                  <p className="mt-1 max-w-none break-words font-mono text-xs leading-relaxed text-white/70 sm:text-sm">
                    Neon frame locked. Full OS access routes through this tier after checkout clears.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Data shard — pricing + CTA */}
          <div
            className="relative flex flex-col justify-center gap-5 p-[4px] [clip-path:polygon(0_0,100%_0,100%_calc(100%-18px),calc(100%-18px)_100%,0_100%)]"
            style={{
              background: "linear-gradient(165deg, rgba(251,191,36,0.98), rgba(234,88,12,0.82), rgba(185,28,28,0.62))",
              boxShadow:
                "0 0 0 1px rgba(253,224,71,0.95), 0 0 0 3px rgba(220,38,38,0.35), 0 0 6px rgba(251,191,36,1), 0 0 48px rgba(245,158,11,0.42), 0 0 88px rgba(220,38,38,0.24), 0 0 120px rgba(251,191,36,0.12)",
            }}
          >
            <div
              className="relative flex h-full flex-col justify-center gap-5 bg-[linear-gradient(168deg,rgba(10,4,2,0.97),rgba(6,4,12,0.99))] px-6 py-7 sm:gap-6 sm:px-7 sm:py-9 [clip-path:polygon(0_0,100%_0,100%_calc(100%-17px),calc(100%-17px)_100%,0_100%)]"
              style={{
                boxShadow:
                  "inset 0 0 0 1px rgba(251,191,36,0.35), inset 0 0 0 2px rgba(127,29,29,0.22), inset 0 0 48px rgba(251,191,36,0.08)",
              }}
            >
              <div
                className="pointer-events-none absolute right-3 top-3 h-8 w-8 border-r-[3px] border-t-[3px] border-amber-200/95"
                style={{ boxShadow: "2px -2px 14px rgba(251,191,36,0.45)" }}
              />
              <div
                className="pointer-events-none absolute bottom-3 left-3 h-8 w-8 border-b-[3px] border-l-[3px] border-red-400/85"
                style={{ boxShadow: "-2px 2px 14px rgba(248,113,113,0.35)" }}
              />

              <div>
                <h2
                  className="font-mono text-sm font-black uppercase tracking-[0.2em] text-amber-200 sm:text-base"
                  style={{ textShadow: "0 0 18px rgba(251,191,36,0.55), 0 0 32px rgba(245,158,11,0.2)" }}
                >
                  // access_manifest
                </h2>
                <h3 className="mt-2 text-2xl font-black uppercase tracking-[0.1em] text-amber-50 sm:text-3xl">Details</h3>
                <p className="mt-3 font-mono text-[15px] leading-relaxed text-amber-100/78 sm:text-base lg:text-lg">
                  One membership unlocks the hub inside the dashboard: protected articles, secure video drops, Syndicate missions,
                  and the full goals experience alongside your selected programs.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="inline-flex items-center border-[3px] border-[#39ff14]/90 bg-black/75 px-5 py-2.5 font-mono text-2xl font-black tabular-nums text-[#b6ffc4] [clip-path:polygon(8px_0,calc(100%-8px)_0,100%_8px,100%_calc(100%-8px),calc(100%-8px)_100%,8px_100%,0_calc(100%-8px),0_8px)] sm:text-3xl"
                  style={{
                    fontFeatureSettings: '"tnum" 1, "lnum" 1',
                    boxShadow:
                      "0 0 0 1px rgba(57,255,20,0.9), 0 0 0 3px rgba(0,255,200,0.2), 0 0 6px rgba(57,255,20,0.95), 0 0 36px rgba(0,255,200,0.35), inset 0 0 18px rgba(57,255,20,0.12)",
                    textShadow: "0 0 16px rgba(182,255,196,0.55), 0 0 28px rgba(57,255,20,0.3)",
                  }}
                >
                  {DISPLAY_PRICE}
                  <span className="ml-2.5 text-xs font-bold uppercase tracking-[0.14em] text-[#86efac]/90 sm:text-sm">/ mo</span>
                </span>
              </div>

              {error ? (
                <div
                  className="border-[3px] border-rose-500/75 bg-rose-950/45 px-4 py-2.5 font-mono text-sm text-rose-100 [clip-path:polygon(8px_0,calc(100%-8px)_0,100%_8px,100%_calc(100%-8px),calc(100%-8px)_100%,8px_100%,0_calc(100%-8px),0_8px)]"
                  style={{
                    boxShadow:
                      "0 0 0 1px rgba(254,205,211,0.85), 0 0 0 3px rgba(190,18,60,0.25), 0 0 6px rgba(244,63,94,0.85), 0 0 32px rgba(244,63,94,0.4)",
                  }}
                >
                  {error}
                </div>
              ) : null}

              <button
                type="button"
                disabled={busy}
                onClick={() => void unlockMembership()}
                className={cn(
                  "relative w-full overflow-hidden border-[3px] border-[#00ffc8]/80 bg-[linear-gradient(135deg,rgba(88,7,28,0.82),rgba(4,12,10,0.98))] px-5 py-4 font-mono text-sm font-black uppercase tracking-[0.18em] text-teal-50 transition [clip-path:polygon(12px_0,calc(100%-12px)_0,100%_12px,100%_calc(100%-12px),calc(100%-12px)_100%,12px_100%,0_calc(100%-12px),0_12px)] sm:py-5 sm:text-base",
                  "hover:brightness-110 motion-safe:hover:shadow-[0_0_48px_rgba(0,255,200,0.45)] disabled:cursor-wait disabled:opacity-65",
                )}
                style={{
                  boxShadow:
                    "0 0 0 1px rgba(213,255,245,0.75), 0 0 0 3px rgba(255,0,60,0.22), 0 0 6px rgba(0,255,200,0.95), 0 0 44px rgba(255,0,60,0.35), 0 0 88px rgba(168,85,247,0.2), inset 0 0 28px rgba(0,255,200,0.08)",
                  textShadow: "0 0 18px rgba(204,251,241,0.4), 0 0 32px rgba(255,0,60,0.15)",
                }}
              >
                <span className="pointer-events-none absolute inset-0 opacity-35 motion-safe:animate-pulse bg-[linear-gradient(90deg,transparent,rgba(0,255,200,0.18),transparent)]" />
                {busy ? "Opening checkout…" : "Unlock membership"}
              </button>
              <p className="font-mono text-xs leading-snug text-amber-200/55 sm:text-sm">
                Signed out? Signup opens with this plan prefilled. Members may route straight to the dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Perk command deck — chamfered frame + sector rails */}
        <section
          className="relative p-[4px] [clip-path:polygon(28px_0,100%_0,100%_calc(100%-28px),calc(100%-28px)_100%,0_100%,0_28px)]"
          style={{
            background: "linear-gradient(125deg, #00ffc8, #ff003c, #facc15, #a855f7, #00ffc8)",
            backgroundSize: "220% 220%",
            boxShadow:
              "0 0 0 1px rgba(57,255,20,0.55), 0 0 0 4px rgba(255,0,60,0.15), 0 0 10px rgba(0,255,200,0.85), 0 0 60px rgba(255,0,60,0.35), 0 0 110px rgba(250,204,21,0.18)",
          }}
        >
          <div
            className="relative m-[3px] bg-[linear-gradient(185deg,rgba(3,4,12,0.97),rgba(2,3,8,0.99))] px-5 py-10 sm:px-9 sm:py-12 [clip-path:polygon(25px_0,100%_0,100%_calc(100%-25px),calc(100%-25px)_100%,0_100%,0_25px)]"
            style={{
              boxShadow:
                "inset 0 0 0 1px rgba(255,159,28,0.3), inset 0 0 0 2px rgba(255,0,60,0.12), inset 0 0 80px rgba(0,255,200,0.05)",
            }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(57,255,20,0.25)_2px,rgba(57,255,20,0.25)_3px)]" />
            <div className="pointer-events-none absolute left-0 top-0 h-24 w-24 border-l-2 border-t-2 border-[#00ffc8]/55" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-24 w-24 border-b-2 border-r-2 border-[#ff003c]/50" />

            <div className="relative text-center">
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.35em] text-[#00ffc8]/80 sm:text-[11px]" style={{ textShadow: "0 0 12px rgba(0,255,200,0.45)" }}>
                // perk_matrix · hazard
              </p>
              <h2
                className="mt-2 font-black uppercase tracking-[0.1em] text-transparent [font-size:clamp(1.45rem,3vw+0.4rem,2.15rem)] bg-clip-text"
                style={{
                  backgroundImage: "linear-gradient(92deg, #facc15, #ff003c, #00ffc8, #a855f7, #facc15)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  filter: "drop-shadow(0 0 16px rgba(255,0,60,0.35)) drop-shadow(0 0 24px rgba(0,255,200,0.25))",
                }}
              >
                Unlocked after you join
              </h2>
              <p className="mx-auto mt-3 max-w-[58ch] font-mono text-base leading-relaxed text-teal-200/75 sm:text-lg">
                Once The King membership is active, these sectors open inside the Syndicate dashboard.
              </p>
            </div>

            <div className="relative mx-auto mt-10 max-w-[min(1040px,100%)]">
              <div
                className="pointer-events-none absolute bottom-0 left-1/2 top-0 z-0 hidden w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#ff003c]/40 to-transparent sm:block"
                style={{ boxShadow: "0 0 16px rgba(255,0,60,0.35)" }}
                aria-hidden
              />
              <ul className="relative z-[1] grid gap-4 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-4">
              {UNLOCK_FEATURES.map((line, i) => {
                const ch = FEATURE_CHANNEL[i];
                const sector = String(i + 1).padStart(2, "0");
                return (
                  <li key={line} className="relative list-none">
                    <div
                      className="rounded-[2px] p-[3px]"
                      style={{
                        background: ch.ring,
                        boxShadow: ch.outerGlow,
                      }}
                    >
                      <div
                        className="flex min-h-[5.75rem] overflow-hidden sm:min-h-[6rem] [clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]"
                        style={{
                          background: ch.panel,
                          boxShadow: ch.inset,
                        }}
                      >
                        <div
                          className="w-1.5 shrink-0 sm:w-2"
                          style={{
                            background: ch.bar,
                            boxShadow: "inset -1px 0 0 rgba(0,0,0,0.35), 0 0 18px rgba(255,255,255,0.12)",
                          }}
                          aria-hidden
                        />
                        <div className="flex min-w-0 flex-1 items-start gap-3 px-4 py-4 sm:gap-4 sm:px-5 sm:py-4">
                          <div className="flex shrink-0 flex-col items-center gap-1.5 pt-0.5">
                            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white/35 sm:text-[10px]">
                              S{sector}
                            </span>
                            <Check className={cn(ch.check)} strokeWidth={2.75} aria-hidden />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">Grant</p>
                            <p className={cn("mt-1 font-mono text-[15px] font-semibold leading-snug sm:text-base lg:text-[17px]", ch.text)}>{line}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
