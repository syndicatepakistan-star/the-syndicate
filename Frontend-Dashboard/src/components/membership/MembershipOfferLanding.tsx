"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { getAuthorizationHeader, hasSimpleAuthSessionClient, resolveClientApiUrl } from "@/lib/portal-api";
import { OFFER_PLAN_THUMB_THE_KING } from "@/components/programs/offerPlanThumbnails";
import { ProgramsGoldPillHeading } from "@/components/programs/ProgramsGoldPillHeading";

const BILLING = "monthly" as const;
const CHECKOUT_AMOUNT = "19.99";
const DISPLAY_PRICE = "£19.99";

/** Chamfered “HUD” corners — matches cyber / gaming card silhouette from reference. */
const CLIP_CARD =
  "[clip-path:polygon(18px_0,calc(100%-18px)_0,100%_18px,100%_calc(100%-18px),calc(100%-18px)_100%,18px_100%,0_calc(100%-18px),0_18px)]";

const CLIP_CARD_INNER =
  "[clip-path:polygon(16px_0,calc(100%-16px)_0,100%_16px,100%_calc(100%-16px),calc(100%-16px)_100%,16px_100%,0_calc(100%-16px),0_16px)]";

const CLIP_ROW =
  "[clip-path:polygon(12px_0,calc(100%-12px)_0,100%_12px,100%_calc(100%-12px),calc(100%-12px)_100%,12px_100%,0_calc(100%-12px),0_12px)]";

const CLIP_ROW_INNER =
  "[clip-path:polygon(10px_0,calc(100%-10px)_0,100%_10px,100%_calc(100%-10px),calc(100%-10px)_100%,10px_100%,0_calc(100%-10px),0_10px)]";

/** `box-shadow` is clipped by `clip-path` on the same node — outer bloom lives on this wrapper via `drop-shadow`. */
const HERO_KING_OUTER_GLOW =
  "[filter:drop-shadow(0_0_1px_rgba(196,181,253,0.95))_drop-shadow(0_0_14px_rgba(167,139,250,0.85))_drop-shadow(0_0_38px_rgba(139,92,246,0.62))_drop-shadow(0_0_76px_rgba(124,58,237,0.4))_drop-shadow(0_0_120px_rgba(91,33,182,0.22))]";

const HERO_MANIFEST_OUTER_GLOW =
  "[filter:drop-shadow(0_0_1px_rgba(153,246,228,0.95))_drop-shadow(0_0_14px_rgba(45,212,191,0.82))_drop-shadow(0_0_38px_rgba(20,184,166,0.55))_drop-shadow(0_0_76px_rgba(13,148,136,0.36))_drop-shadow(0_0_120px_rgba(15,118,110,0.18))]";

/** Perk matrix outer frame — stacked neons (clip-safe via wrapper). */
const SECTION_MATRIX_BLOOM =
  "[filter:drop-shadow(0_0_16px_rgba(217,70,239,0.38))_drop-shadow(0_0_32px_rgba(34,211,238,0.28))_drop-shadow(0_0_48px_rgba(163,230,53,0.22))_drop-shadow(0_0_64px_rgba(96,165,250,0.16))]";

const UNLOCK_FEATURES: readonly string[] = [
  "Select 4–5 courses yourself from the catalog",
  "Weekly content and member drops",
  "Full dashboard access",
  "Membership articles and secure video hub",
  "Exclusive membership section",
  "Goals and milestones (full deck)",
  "Syndicate Mode challenges",
];

/**
 * Seven distinct neon channels (one per grant row): fuchsia, cyan, emerald, rose, violet, lime, sky.
 * Each `outerGlow` is a multi-ring bloom keyed to that hue.
 */
const FEATURE_CHANNEL = [
  {
    ring: "linear-gradient(135deg, #fae8ff 0%, #d946ef 38%, #581c87 100%)",
    bar: "linear-gradient(180deg, #f0abfc 0%, #c026d3 40%, #4a044e 100%)",
    outerGlow:
      "0 0 0 2px rgba(232,121,249,0.85), 0 0 0 5px rgba(88,28,135,0.35), 0 0 28px rgba(217,70,239,0.65), 0 0 72px rgba(168,85,247,0.38), 0 0 120px rgba(192,38,211,0.15)",
    panel: "linear-gradient(165deg, rgba(12,4,18,0.98), rgba(4,2,10,0.995))",
    inset:
      "inset 0 0 0 1px rgba(240,171,252,0.45), inset 0 0 36px rgba(88,28,135,0.2), 0 0 24px rgba(217,70,239,0.12)",
    check: "text-fuchsia-300 drop-shadow-[0_0_14px_rgba(232,121,249,0.95)] h-5 w-5 sm:h-6 sm:w-6",
    text: "text-fuchsia-100/92",
  },
  {
    ring: "linear-gradient(135deg, #ecfeff 0%, #22d3ee 36%, #155e75 100%)",
    bar: "linear-gradient(180deg, #a5f3fc 0%, #06b6d4 42%, #083344 100%)",
    outerGlow:
      "0 0 0 2px rgba(103,232,249,0.88), 0 0 0 5px rgba(8,145,178,0.32), 0 0 28px rgba(34,211,238,0.62), 0 0 72px rgba(56,189,248,0.35), 0 0 120px rgba(14,165,233,0.14)",
    panel: "linear-gradient(165deg, rgba(4,14,22,0.98), rgba(2,8,16,0.995))",
    inset:
      "inset 0 0 0 1px rgba(103,232,249,0.42), inset 0 0 36px rgba(8,145,178,0.16), 0 0 24px rgba(34,211,238,0.1)",
    check: "text-cyan-300 drop-shadow-[0_0_14px_rgba(34,211,238,0.95)] h-5 w-5 sm:h-6 sm:w-6",
    text: "text-cyan-100/92",
  },
  {
    ring: "linear-gradient(135deg, #ecfdf5 0%, #22c55e 36%, #14532d 100%)",
    bar: "linear-gradient(180deg, #86efac 0%, #16a34a 42%, #052e16 100%)",
    outerGlow:
      "0 0 0 2px rgba(52,211,153,0.88), 0 0 0 5px rgba(21,128,61,0.3), 0 0 28px rgba(74,222,128,0.58), 0 0 72px rgba(34,197,94,0.32), 0 0 120px rgba(22,163,74,0.12)",
    panel: "linear-gradient(165deg, rgba(4,18,10,0.98), rgba(2,10,6,0.995))",
    inset:
      "inset 0 0 0 1px rgba(134,239,172,0.4), inset 0 0 36px rgba(22,101,52,0.14), 0 0 24px rgba(52,211,153,0.08)",
    check: "text-emerald-300 drop-shadow-[0_0_14px_rgba(52,211,153,0.95)] h-5 w-5 sm:h-6 sm:w-6",
    text: "text-emerald-100/92",
  },
  {
    ring: "linear-gradient(135deg, #ffe4e6 0%, #fb7185 38%, #9f1239 100%)",
    bar: "linear-gradient(180deg, #fecdd3 0%, #f43f5e 40%, #4c0519 100%)",
    outerGlow:
      "0 0 0 2px rgba(251,113,133,0.9), 0 0 0 5px rgba(190,18,60,0.32), 0 0 28px rgba(251,113,133,0.62), 0 0 72px rgba(244,63,94,0.35), 0 0 120px rgba(225,29,72,0.12)",
    panel: "linear-gradient(165deg, rgba(18,4,12,0.98), rgba(10,2,8,0.995))",
    inset:
      "inset 0 0 0 1px rgba(253,164,175,0.42), inset 0 0 36px rgba(136,19,55,0.18), 0 0 24px rgba(251,113,133,0.1)",
    check: "text-rose-400 drop-shadow-[0_0_14px_rgba(251,113,133,0.95)] h-5 w-5 sm:h-6 sm:w-6",
    text: "text-rose-100/92",
  },
  {
    ring: "linear-gradient(135deg, #ede9fe 0%, #a78bfa 38%, #4c1d95 100%)",
    bar: "linear-gradient(180deg, #ddd6fe 0%, #7c3aed 40%, #2e1065 100%)",
    outerGlow:
      "0 0 0 2px rgba(167,139,250,0.9), 0 0 0 5px rgba(76,29,149,0.32), 0 0 28px rgba(139,92,246,0.62), 0 0 72px rgba(124,58,237,0.35), 0 0 120px rgba(109,40,217,0.12)",
    panel: "linear-gradient(165deg, rgba(12,8,22,0.98), rgba(6,4,14,0.995))",
    inset:
      "inset 0 0 0 1px rgba(196,181,253,0.42), inset 0 0 36px rgba(76,29,149,0.18), 0 0 24px rgba(139,92,246,0.1)",
    check: "text-violet-300 drop-shadow-[0_0_14px_rgba(167,139,250,0.95)] h-5 w-5 sm:h-6 sm:w-6",
    text: "text-violet-100/92",
  },
  {
    ring: "linear-gradient(135deg, #f7fee7 0%, #bef264 36%, #365314 100%)",
    bar: "linear-gradient(180deg, #d9f99d 0%, #84cc16 42%, #1a2e05 100%)",
    outerGlow:
      "0 0 0 2px rgba(190,242,100,0.9), 0 0 0 5px rgba(63,98,18,0.3), 0 0 28px rgba(163,230,53,0.58), 0 0 72px rgba(132,204,22,0.32), 0 0 120px rgba(101,163,13,0.12)",
    panel: "linear-gradient(165deg, rgba(12,18,6,0.98), rgba(6,10,3,0.995))",
    inset:
      "inset 0 0 0 1px rgba(217,249,157,0.4), inset 0 0 36px rgba(63,98,18,0.14), 0 0 24px rgba(163,230,53,0.08)",
    check: "text-lime-300 drop-shadow-[0_0_14px_rgba(190,242,100,0.95)] h-5 w-5 sm:h-6 sm:w-6",
    text: "text-lime-100/92",
  },
  {
    ring: "linear-gradient(135deg, #eff6ff 0%, #60a5fa 36%, #1e3a8a 100%)",
    bar: "linear-gradient(180deg, #bfdbfe 0%, #2563eb 42%, #0c1a2e 100%)",
    outerGlow:
      "0 0 0 2px rgba(147,197,253,0.9), 0 0 0 5px rgba(30,58,138,0.3), 0 0 28px rgba(96,165,250,0.58), 0 0 72px rgba(59,130,246,0.32), 0 0 120px rgba(37,99,235,0.12)",
    panel: "linear-gradient(165deg, rgba(4,10,22,0.98), rgba(2,8,16,0.995))",
    inset:
      "inset 0 0 0 1px rgba(191,219,254,0.4), inset 0 0 36px rgba(30,58,138,0.14), 0 0 24px rgba(96,165,250,0.08)",
    check: "text-sky-300 drop-shadow-[0_0_14px_rgba(125,211,252,0.95)] h-5 w-5 sm:h-6 sm:w-6",
    text: "text-sky-100/92",
  },
] as const;

if (UNLOCK_FEATURES.length !== FEATURE_CHANNEL.length) {
  throw new Error("UNLOCK_FEATURES and FEATURE_CHANNEL length must match");
}

const CYBER_UNLOCK_CTA = cn(
  "relative w-full overflow-hidden rounded-xl border-[3px] border-[#d4af39] bg-[linear-gradient(180deg,rgba(10,12,28,0.96),rgba(4,6,18,0.99))]",
  "px-5 py-4 font-mono text-[clamp(11px,2.4vw,15px)] font-black uppercase tracking-[0.16em] text-[#d4af39]",
  "[text-shadow:0_0_18px_rgba(212,175,57,0.45),0_1px_2px_rgba(0,0,0,0.85)]",
  "shadow-[0_0_0_1px_rgba(212,175,57,0.5),0_0_28px_rgba(212,175,57,0.35),0_0_56px_rgba(212,175,57,0.18),inset_0_1px_0_rgba(255,255,255,0.1)]",
  "transition hover:brightness-110 hover:shadow-[0_0_0_1px_rgba(212,175,57,0.65),0_0_40px_rgba(212,175,57,0.5),0_0_80px_rgba(212,175,57,0.22),inset_0_1px_0_rgba(255,255,255,0.14)]",
  "disabled:cursor-wait disabled:opacity-65"
);

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
      <div className="relative mx-auto w-full max-w-[1400px] space-y-10 sm:space-y-12">
        <header className="space-y-6 text-center sm:space-y-8">
          <ProgramsGoldPillHeading as="h1" title="Syndicate membership" size="compact" chrome="goldViolet" />
          <p className="mx-auto max-w-[min(92ch,100%)] font-mono text-base leading-relaxed text-neutral-300 sm:text-lg sm:leading-relaxed">
            Your curriculum, your rhythm: choose programs, unlock the full membership library, Syndicate Mode, and the
            complete goals stack. Review what is included, then join to open Stripe checkout when you are signed in—or
            create an account first if you are new.
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-lime-300 [text-shadow:0_0_16px_rgba(190,242,100,0.65),0_0_32px_rgba(132,204,22,0.28)] sm:text-[11px]">
            // uplink_ready · member_auth
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.25fr)] lg:gap-8">
          {/* King — neon violet “rig” frame */}
          <div className={cn("relative w-full min-w-0", HERO_KING_OUTER_GLOW)}>
          <article
            className={cn(
              "relative flex min-h-[20rem] w-full flex-col overflow-visible p-[3px] sm:min-h-[24rem]",
              CLIP_CARD,
              "bg-[linear-gradient(135deg,rgba(196,181,253,0.95),rgba(124,58,237,0.58),rgba(91,33,182,0.82))]",
              "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.55)]"
            )}
          >
            <span
              className="pointer-events-none absolute inset-[-22%] z-0 blur-[56px] bg-[radial-gradient(circle_at_center,rgba(167,139,250,0.62)_0%,rgba(124,58,237,0.34)_38%,transparent_68%)]"
              aria-hidden
            />
            <div
              className={cn(
                "relative z-[2] flex min-h-0 flex-1 flex-col overflow-hidden bg-[#030308]",
                CLIP_CARD_INNER,
                "ring-1 ring-violet-400/28"
              )}
            >
              <div className="relative min-h-[220px] flex-[1.15] overflow-hidden sm:min-h-[260px]">
                <img
                  src={OFFER_PLAN_THUMB_THE_KING}
                  alt=""
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover object-center"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-black/35 to-black/65" />
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_50%_18%,rgba(139,92,246,0.08),transparent_58%)]" />
              </div>
              <div className="relative z-[3] border-t border-pink-500/40 bg-black/88 px-3 py-2.5 sm:px-5 sm:py-3">
                <p className="text-left font-mono text-[11px] font-bold leading-snug text-white/95 sm:text-xs">
                  <span className="text-pink-400 uppercase tracking-[0.08em] [text-shadow:0_0_14px_rgba(244,114,182,0.85),0_0_28px_rgba(244,63,94,0.35)]">
                    [UPLINK]
                  </span>{" "}
                  <span className="font-semibold tracking-wide text-neutral-200/95 normal-case">
                    The King — dashboard, library and Syndicate Mode.
                  </span>
                </p>
              </div>
              <div className="relative z-[3] border-t border-sky-400/35 bg-gradient-to-b from-black via-[#06060a] to-black px-3 py-2.5 sm:px-5 sm:py-3">
                <p className="font-mono text-[9px] font-black uppercase tracking-[0.22em] text-sky-300/95 [text-shadow:0_0_12px_rgba(56,189,248,0.55),0_0_22px_rgba(14,165,233,0.28)] sm:text-[10px]">
                  // checkout · full access
                </p>
                <p className="mt-0.5 font-mono text-[11px] leading-snug text-neutral-400 sm:text-xs">
                  Unlocks after payment clears.
                </p>
              </div>
            </div>
          </article>
          </div>

          {/* Access manifest — teal rig + split HUD accents */}
          <div className={cn("relative w-full min-w-0", HERO_MANIFEST_OUTER_GLOW)}>
          <article
            className={cn(
              "relative flex w-full flex-col justify-center gap-5 overflow-visible p-[3px] sm:gap-6",
              CLIP_CARD,
              "bg-[linear-gradient(135deg,rgba(45,212,191,0.92),rgba(20,184,166,0.52),rgba(13,148,136,0.88))]",
              "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.55)]"
            )}
          >
            <span
              className="pointer-events-none absolute inset-[-22%] z-0 blur-[56px] bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.58)_0%,rgba(13,148,136,0.3)_40%,transparent_70%)]"
              aria-hidden
            />
            <div
              className={cn(
                "relative z-[2] flex flex-col gap-5 bg-[#030308] p-6 sm:gap-6 sm:p-8",
                CLIP_CARD_INNER,
                "ring-1 ring-teal-300/32"
              )}
            >
              <div>
                <h2 className="font-mono text-xs font-black uppercase tracking-[0.2em] text-fuchsia-400 [text-shadow:0_0_14px_rgba(232,121,249,0.65),0_0_28px_rgba(192,38,211,0.3)] sm:text-sm">
                  // manifest
                </h2>
                <h3 className="mt-1.5 font-mono text-xl font-black uppercase tracking-[0.12em] text-pink-300 [text-shadow:0_0_18px_rgba(249,168,212,0.65),0_0_40px_rgba(236,72,153,0.22)] sm:text-2xl">
                  Details
                </h3>
                <p className="mt-2 font-mono text-sm leading-relaxed text-neutral-300 sm:text-[15px]">
                  Articles, video hub, missions, goals — inside the dashboard with your chosen programs.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={cn(
                    "inline-flex items-center bg-black/80 px-5 py-2.5 font-mono text-2xl font-black tabular-nums text-cyan-100 sm:text-3xl",
                    "border-[3px] border-cyan-400/90 [text-shadow:0_0_16px_rgba(103,232,249,0.55),0_0_32px_rgba(34,211,238,0.25)]",
                    "shadow-[0_0_0_1px_rgba(103,232,249,0.4),0_0_28px_rgba(34,211,238,0.45),0_0_56px_rgba(14,165,233,0.18)]",
                    "rounded-lg"
                  )}
                  style={{ fontFeatureSettings: '"tnum" 1, "lnum" 1' }}
                >
                  {DISPLAY_PRICE}
                  <span className="ml-2.5 text-xs font-bold uppercase tracking-[0.12em] text-neutral-400 sm:text-sm">/ mo</span>
                </span>
              </div>

              {error ? (
                <div className="rounded-lg border-2 border-rose-500/60 bg-rose-950/50 px-4 py-3 font-mono text-sm text-rose-100 shadow-[0_0_24px_rgba(244,63,94,0.25)]">
                  {error}
                </div>
              ) : null}

              <button type="button" disabled={busy} onClick={() => void unlockMembership()} className={CYBER_UNLOCK_CTA}>
                {busy ? "Opening checkout…" : "Unlock membership"}
              </button>
              <p className="font-mono text-xs leading-snug text-neutral-500 sm:text-sm">
                Signed out? Signup opens with this plan prefilled. Members may route straight to the dashboard.
              </p>
            </div>
          </article>
          </div>
        </div>

        {/* Perk matrix — neon rim + chamfered gaming tiles */}
        <div className={cn("relative w-full min-w-0", SECTION_MATRIX_BLOOM)}>
          <section
            className={cn(
              "relative space-y-8 overflow-visible p-[2px] sm:space-y-10",
              CLIP_CARD,
              "bg-[linear-gradient(125deg,rgba(167,139,250,0.72),rgba(217,70,239,0.62),rgba(34,211,238,0.52),rgba(163,230,53,0.48),rgba(96,165,250,0.52),rgba(244,63,94,0.48))]",
              "shadow-[inset_0_0_0_1px_rgba(0,0,0,0.55)]"
            )}
          >
            <div
              className={cn(
                "space-y-8 bg-[linear-gradient(180deg,rgba(8,6,14,0.98),rgba(2,2,8,0.99))] px-[clamp(1rem,3.2vw,1.5rem)] py-10 sm:space-y-10 sm:px-8 sm:py-12",
                CLIP_CARD_INNER,
                "ring-1 ring-white/8"
              )}
            >
              <div className="text-center">
              <ProgramsGoldPillHeading as="h2" title="Unlocked after you join" size="compact" chrome="lime" />
              <p className="mx-auto mt-4 max-w-[48ch] font-mono text-sm leading-relaxed text-neutral-400 sm:text-base">
                Active membership opens these in the dashboard.
              </p>
            </div>

            <div className="relative mx-auto max-w-[min(1040px,100%)]">
              <div
                className="pointer-events-none absolute bottom-0 left-1/2 top-0 z-0 hidden w-px -translate-x-1/2 bg-gradient-to-b from-fuchsia-500/25 via-lime-300/35 to-sky-400/25 sm:block [box-shadow:0_0_14px_rgba(217,70,239,0.4),0_0_22px_rgba(163,230,53,0.3),0_0_30px_rgba(56,189,248,0.25)]"
                aria-hidden
              />
              <ul className="relative z-[1] grid gap-5 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-5">
                {UNLOCK_FEATURES.map((line, i) => {
                  const ch = FEATURE_CHANNEL[i];
                  const sector = String(i + 1).padStart(2, "0");
                  return (
                    <li key={line} className="relative list-none">
                      <div
                        className={cn("p-[3px]", CLIP_ROW)}
                        style={{ background: ch.ring, boxShadow: ch.outerGlow }}
                      >
                        <div
                          className={cn("flex min-h-[5.75rem] overflow-hidden sm:min-h-[6rem]", CLIP_ROW_INNER)}
                          style={{
                            background: ch.panel,
                            boxShadow: ch.inset,
                          }}
                        >
                          <div
                            className="w-1.5 shrink-0 sm:w-2"
                            style={{
                              background: ch.bar,
                              boxShadow: "inset -1px 0 0 rgba(0,0,0,0.45)",
                            }}
                            aria-hidden
                          />
                          <div className="flex min-w-0 flex-1 items-start gap-3 px-4 py-4 sm:gap-4 sm:px-5 sm:py-4">
                            <div className="flex shrink-0 flex-col items-center gap-1.5 pt-0.5">
                              <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-white/40 sm:text-[10px]">
                                S{sector}
                              </span>
                              <Check className={cn(ch.check)} strokeWidth={2.75} aria-hidden />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">Grant</p>
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
      </div>
    </main>
  );
}
