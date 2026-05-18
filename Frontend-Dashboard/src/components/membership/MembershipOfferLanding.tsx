"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/components/dashboard/dashboardPrimitives";
import { startPlanCheckout } from "@/lib/plan-checkout";
import { OFFER_PLAN_THUMB_THE_KING } from "@/components/programs/offerPlanThumbnails";
import { cx, CyberChamferFrame, CyberInsetPanel } from "@/components/cyber/CyberChamferFrames";

const BILLING = "monthly" as const;
const CHECKOUT_AMOUNT = "19.99";
const DISPLAY_PRICE = "£19.99";

const MEMBERSHIP_CHANNELS = [
  {
    step: "01",
    title: "Course Command",
    tagline: "Choose your 5 programs from the vault.",
    border: "border-rose-500/90",
    glow: "shadow-[0_0_0_2px_rgba(244,63,94,0.82),0_0_48px_rgba(225,29,72,0.74),0_0_92px_rgba(136,19,55,0.58)]",
    bg: "bg-[linear-gradient(132deg,rgba(244,63,94,0.72),rgba(190,24,93,0.66),rgba(136,19,55,0.62))]",
    aura: "bg-[radial-gradient(90%_80%_at_50%_40%,rgba(244,63,94,0.64),rgba(136,19,55,0.5)_48%,transparent_74%)]",
    stepBorder: "border-rose-700/90",
    titleText: "text-rose-200",
  },
  {
    step: "02",
    title: "Syndicate Mode",
    tagline: "Challenges, missions, operator pressure.",
    border: "border-fuchsia-500/90",
    glow: "shadow-[0_0_0_2px_rgba(217,70,239,0.82),0_0_48px_rgba(192,38,211,0.74),0_0_92px_rgba(134,25,143,0.58)]",
    bg: "bg-[linear-gradient(132deg,rgba(217,70,239,0.74),rgba(162,28,175,0.68),rgba(126,34,206,0.64))]",
    aura: "bg-[radial-gradient(90%_80%_at_50%_40%,rgba(217,70,239,0.64),rgba(126,34,206,0.5)_48%,transparent_74%)]",
    stepBorder: "border-fuchsia-700/90",
    titleText: "text-fuchsia-200",
  },
  {
    step: "03",
    title: "Member Library",
    tagline: "Articles and secure video uplink.",
    border: "border-cyan-500/90",
    glow: "shadow-[0_0_0_2px_rgba(34,211,238,0.82),0_0_48px_rgba(6,182,212,0.74),0_0_92px_rgba(14,116,144,0.58)]",
    bg: "bg-[linear-gradient(132deg,rgba(34,211,238,0.74),rgba(8,145,178,0.68),rgba(14,116,144,0.64))]",
    aura: "bg-[radial-gradient(90%_80%_at_50%_40%,rgba(34,211,238,0.66),rgba(14,116,144,0.5)_48%,transparent_74%)]",
    stepBorder: "border-cyan-700/90",
    titleText: "text-cyan-200",
  },
  {
    step: "04",
    title: "The King Tier",
    tagline: "Full membership stack — one unlock.",
    border: "border-amber-400/90",
    glow: "shadow-[0_0_0_2px_rgba(251,191,36,0.82),0_0_48px_rgba(234,88,12,0.74),0_0_92px_rgba(180,83,9,0.58)]",
    bg: "bg-[linear-gradient(132deg,rgba(251,191,36,0.74),rgba(234,88,12,0.68),rgba(180,83,9,0.64))]",
    aura: "bg-[radial-gradient(90%_80%_at_50%_40%,rgba(251,191,36,0.64),rgba(180,83,9,0.5)_48%,transparent_74%)]",
    stepBorder: "border-amber-600/90",
    titleText: "text-amber-200",
  },
] as const;

const MEMBERSHIP_PILLARS = [
  {
    id: "curriculum",
    title: "Your Curriculum",
    summary: "Select programs on your terms — not a fixed funnel.",
    body: "The King tier opens the catalog so you choose four to five tracks that match your operator profile. Structure without surrendering control.",
    image: "/assets/pawn2.png",
    imageAlt: "Dystopian curriculum operator",
    accent: "cyan" as const,
  },
  {
    id: "dashboard",
    title: "Inside The Dashboard",
    summary: "Goals, missions, and the full deck in one shell.",
    body: "Membership is not a PDF library. It is a live command surface — Syndicate Mode, milestones, and weekly drops wired into the same neon rig you train in.",
    image: "/assets/pawn.png",
    imageAlt: "Cyber dashboard sentinel",
    accent: "violet" as const,
  },
  {
    id: "gate",
    title: "Break The Gate",
    summary: "One tier. Full uplink. No partial access.",
    body: "Money Mastery is the runway. The King is the airlock — library, challenges, articles, and credential paths behind a single dystopian-grade unlock.",
    image: "/assets/pawn1.png",
    imageAlt: "Neon gate breaker",
    accent: "amber" as const,
  },
] as const;

const HERO_INTRO =
  "Breach the paywall and run the full Syndicate rig — your curriculum, your rhythm, your command surface inside the dashboard.";

const HERO_OFFER_COPY =
  "Money Mastery is the runway. The King is the airlock — library, challenges, articles, and credential paths behind a single dystopian-grade unlock.";

const HERO_OFFER_DETAIL =
  "Pick four to five programs from the vault. Unlock Syndicate Mode missions, the member article and video hub, weekly drops, and the complete goals stack. One tier. Full uplink. No partial access.";

const CYBER_UNLOCK_CTA = cn(
  "relative w-full overflow-hidden rounded-xl border-[3px] border-[#d4af39] bg-[linear-gradient(180deg,rgba(10,12,28,0.96),rgba(4,6,18,0.99))]",
  "px-5 py-4 font-mono text-[clamp(11px,2.4vw,15px)] font-black uppercase tracking-[0.16em] text-[#d4af39]",
  "[text-shadow:0_0_18px_rgba(212,175,57,0.45),0_1px_2px_rgba(0,0,0,0.85)]",
  "shadow-[0_0_0_1px_rgba(212,175,57,0.5),0_0_28px_rgba(212,175,57,0.35),0_0_56px_rgba(212,175,57,0.18),inset_0_1px_0_rgba(255,255,255,0.1)]",
  "transition hover:brightness-110 hover:shadow-[0_0_0_1px_rgba(212,175,57,0.65),0_0_40px_rgba(212,175,57,0.5),0_0_80px_rgba(212,175,57,0.22),inset_0_1px_0_rgba(255,255,255,0.14)]",
  "disabled:cursor-wait disabled:opacity-65"
);

function MembershipHeroOffer({
  busy,
  error,
  onUnlock,
  className,
}: {
  busy: boolean;
  error: string | null;
  onUnlock: () => void;
  className?: string;
}) {
  return (
    <div className={cn("mt-6 w-full max-w-3xl space-y-4", className)}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        <CyberInsetPanel variant="blood" className="h-full min-h-[7.5rem]">
          <p className="font-mono text-sm leading-relaxed text-zinc-100/92 sm:text-base">{HERO_OFFER_COPY}</p>
        </CyberInsetPanel>
        <CyberInsetPanel variant="cyan" className="h-full min-h-[7.5rem]">
          <p className="font-mono text-sm leading-relaxed text-zinc-100/88 sm:text-base">{HERO_OFFER_DETAIL}</p>
        </CyberInsetPanel>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(9.5rem,auto)_1fr] sm:items-stretch">
        <span
          className="inline-flex h-full min-h-[3.25rem] items-center justify-center border-[3px] border-cyan-400/90 bg-black/80 px-4 py-3 font-mono text-xl font-black tabular-nums text-cyan-100 [text-shadow:0_0_16px_rgba(103,232,249,0.55)] shadow-[0_0_28px_rgba(34,211,238,0.35)] sm:text-2xl"
          style={{ fontFeatureSettings: '"tnum" 1, "lnum" 1' }}
        >
          {DISPLAY_PRICE}
          <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-400 sm:text-xs">/ mo</span>
        </span>
        <button type="button" disabled={busy} onClick={onUnlock} className={cn(CYBER_UNLOCK_CTA, "min-h-[3.25rem]")}>
          {busy ? "Opening checkout…" : "Unlock membership"}
        </button>
      </div>

      {error ? (
        <p className="font-mono text-sm text-rose-300 [text-shadow:0_0_10px_rgba(244,63,94,0.5)]">{error}</p>
      ) : null}
    </div>
  );
}

function ChannelCard({
  item,
  idx,
}: {
  item: (typeof MEMBERSHIP_CHANNELS)[number];
  idx: number;
}) {
  return (
    <article
      className={cx(
        "group relative overflow-hidden rounded-2xl border-2 p-5 transition-transform duration-300 hover:-translate-y-0.5",
        idx === 1 ? "xl:col-span-4" : idx === 2 ? "xl:col-span-3" : "xl:col-span-2",
        idx % 2 === 0
          ? "[clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)]"
          : "[clip-path:polygon(0_0,calc(100%-16px)_0,100%_16px,100%_100%,16px_100%,0_calc(100%-16px))]",
        item.border,
        item.glow
      )}
    >
      <span className={cx("pointer-events-none absolute -inset-3 rounded-[1.2rem] opacity-85 blur-2xl", item.aura)} />
      <span className={cx("pointer-events-none absolute inset-0", item.bg)} />
      <span className="pointer-events-none absolute inset-0 opacity-[0.17] [background-image:repeating-linear-gradient(180deg,rgba(0,0,0,0.28)_0px,rgba(0,0,0,0.28)_1px,transparent_1px,transparent_3px)]" />
      <span className="pointer-events-none absolute inset-[6px] rounded-[12px] border-2 border-black/45" />
      <span className={cx("pointer-events-none absolute left-3 top-3 h-7 w-7 border-l-[3px] border-t-[3px]", item.stepBorder)} />
      <span className={cx("pointer-events-none absolute bottom-3 right-3 h-7 w-7 border-b-[3px] border-r-[3px]", item.stepBorder)} />
      <div className="relative z-10 rounded-lg bg-[linear-gradient(165deg,rgba(10,8,18,0.82),rgba(4,6,14,0.9))] p-2.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-[1px] transition-transform duration-300 group-hover:scale-[1.02] sm:p-3">
        <p
          className={cx(
            "inline-flex rounded-md border-2 bg-[linear-gradient(180deg,rgba(6,4,12,0.88),rgba(2,2,8,0.92))] px-3 py-1 text-[11px] font-bold tracking-[0.24em] text-zinc-100",
            item.stepBorder
          )}
        >
          CHANNEL {item.step}
        </p>
        <h3
          className={cx(
            "mt-3 text-2xl font-black uppercase leading-tight tracking-[0.04em] text-zinc-50 drop-shadow-[0_2px_10px_rgba(0,0,0,0.72)]",
            item.titleText
          )}
        >
          {item.title}
        </h3>
        <p className="mt-3 text-base leading-relaxed text-zinc-100/95 drop-shadow-[0_1px_8px_rgba(0,0,0,0.68)]">{item.tagline}</p>
      </div>
    </article>
  );
}

export function MembershipOfferLanding({ embedded = false }: { embedded?: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const unlockMembership = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await startPlanCheckout({
        plan: "king",
        billing: BILLING,
        amount: CHECKOUT_AMOUNT,
        postAuthNext: "/dashboard?section=resources",
      });
      if (result.status === "checkout" || result.status === "auth_required") {
        return;
      }
      if (result.status === "already_unlocked") {
        router.push("/dashboard?section=resources");
        return;
      }
      if (result.status === "error") {
        throw new Error(result.message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not start checkout.");
    } finally {
      setBusy(false);
    }
  }, [router]);

  const accentFrame = (accent: (typeof MEMBERSHIP_PILLARS)[number]["accent"]) =>
    accent === "cyan" ? "cyan" : accent === "violet" ? "violet" : "amber";

  const titleColor: Record<(typeof MEMBERSHIP_PILLARS)[number]["accent"], string> = {
    cyan: "text-cyan-100",
    violet: "text-fuchsia-200/90",
    amber: "text-amber-100",
  };

  return (
    <main
      className={cn(
        "relative z-10 w-full min-w-0 overflow-x-clip",
        embedded
          ? "min-h-0 px-[var(--fluid-section-p,1rem)] pb-8 pt-2"
          : "pb-14 pt-[88px] sm:pb-20 sm:pt-[106px]"
      )}
    >
      <div className="mx-auto w-full max-w-[96rem] space-y-10 px-[clamp(1rem,3vw,2.2rem)] sm:space-y-12">
        {!embedded ? (
          <CyberChamferFrame accent="hero" chamfer={24} className="min-h-[min(68vh,720px)]" innerClassName="p-7 sm:p-10 lg:p-14">
            <div className="grid gap-9 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-200/80">
                  Membership // Dystopian Uplink
                </p>
                <h1 className="mt-4 text-[clamp(2.2rem,5.4vw,5rem)] font-black uppercase leading-[0.9] tracking-[0.1em] text-cyan-100 drop-shadow-[0_0_18px_rgba(34,211,238,0.52)]">
                  Enter
                  <br />
                  The King Tier
                </h1>
                <p className="mt-5 max-w-2xl font-mono text-base leading-relaxed text-zinc-100/85 sm:text-lg">
                  {HERO_INTRO}
                </p>
                <p className="mt-3 max-w-2xl font-mono text-sm leading-relaxed text-cyan-200/70 sm:text-[15px]">
                  // course_command · syndicate_mode · member_library · full_deck
                </p>
                <MembershipHeroOffer
                  busy={busy}
                  error={error}
                  onUnlock={() => void unlockMembership()}
                />
              </div>
              <div
                className="relative isolate [filter:drop-shadow(0_0_20px_rgba(34,211,238,0.75))_drop-shadow(0_0_44px_rgba(168,85,247,0.55))_drop-shadow(0_0_72px_rgba(251,191,36,0.28))]"
              >
                <span
                  className="pointer-events-none absolute left-1/2 top-[42%] z-0 h-[72%] w-[88%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.55)_0%,rgba(168,85,247,0.38)_38%,rgba(251,191,36,0.12)_62%,transparent_78%)] blur-[42px] sm:blur-[52px]"
                  aria-hidden
                />
                <span
                  className="pointer-events-none absolute left-1/2 top-[48%] z-0 h-[55%] w-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(232,121,249,0.45)_0%,rgba(34,211,238,0.28)_45%,transparent_72%)] blur-[28px]"
                  aria-hidden
                />
                <CyberChamferFrame accent="video" chamfer={18} decorSize="compact" className="relative z-[1]" innerClassName="p-2">
                <div className="relative min-h-[280px] overflow-hidden sm:min-h-[360px] lg:min-h-[420px]">
                  <span
                    className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_70%_at_50%_38%,rgba(56,189,248,0.22),rgba(168,85,247,0.14)_48%,transparent_72%)]"
                    aria-hidden
                  />
                  <img
                    src={OFFER_PLAN_THUMB_THE_KING}
                    alt="The King membership tier"
                    className="relative z-[1] h-full w-full object-cover object-center"
                  />
                  <div className="absolute inset-0 z-[2] bg-gradient-to-t from-black/85 via-black/35 to-black/20" />
                  <div className="absolute bottom-0 left-0 right-0 z-[3] border-t border-fuchsia-500/40 bg-black/75 px-4 py-3">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-fuchsia-300 [text-shadow:0_0_12px_rgba(232,121,249,0.65)]">
                      // the_king · full_stack
                    </p>
                    <p className="mt-1 font-mono text-sm text-zinc-200/90">Dashboard · library · Syndicate Mode</p>
                  </div>
                </div>
              </CyberChamferFrame>
              </div>
            </div>
          </CyberChamferFrame>
        ) : (
          <CyberChamferFrame accent="hero" chamfer={20} innerClassName="p-6 sm:p-8">
            <header>
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300/90 [text-shadow:0_0_14px_rgba(34,211,238,0.5)]">
                // membership_uplink
              </p>
              <h2 className="mt-3 text-[clamp(1.75rem,4vw,2.5rem)] font-black uppercase tracking-[0.08em] text-cyan-100 drop-shadow-[0_0_16px_rgba(34,211,238,0.45)]">
                Upgrade to The King
              </h2>
              <p className="mt-4 font-mono text-sm leading-relaxed text-zinc-100/85 sm:text-base">{HERO_INTRO}</p>
            </header>
            <MembershipHeroOffer
              busy={busy}
              error={error}
              onUnlock={() => void unlockMembership()}
              className="mx-auto w-full"
            />
          </CyberChamferFrame>
        )}

        <section>
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-200/85">Access Channels</p>
            <h2 className="mt-2 text-[clamp(1.75rem,4vw,3.2rem)] font-black uppercase tracking-[0.08em] text-cyan-100">
              Membership Rig
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-12">
            {MEMBERSHIP_CHANNELS.map((item, idx) => (
              <ChannelCard key={item.step} item={item} idx={idx} />
            ))}
          </div>
        </section>

        <section className="space-y-7">
          {MEMBERSHIP_PILLARS.map((block) => {
            const isPrimary = block.id === "curriculum";
            return (
              <div
                key={block.id}
                className={isPrimary ? "grid items-start gap-4 lg:grid-cols-[1fr_200px]" : "grid items-start"}
              >
                <CyberChamferFrame accent={accentFrame(block.accent)} chamfer={22} innerClassName="p-6 sm:p-8">
                  <h3 className={cx("text-[clamp(1.85rem,3.8vw,3.2rem)] font-black leading-[1]", titleColor[block.accent])}>
                    {block.title}
                  </h3>
                  <p className="mt-3 text-xl leading-relaxed text-zinc-100/88 sm:text-2xl">{block.summary}</p>
                  <CyberInsetPanel variant={block.accent === "violet" ? "void" : block.accent === "amber" ? "blood" : "cyan"} className="mt-6">
                    <p className="text-lg leading-relaxed text-zinc-100/90 sm:text-xl">{block.body}</p>
                  </CyberInsetPanel>
                </CyberChamferFrame>
                {isPrimary ? (
                  <div className="relative mx-auto w-full max-w-[200px] justify-self-center lg:justify-self-end">
                    <Image
                      src={block.image}
                      alt={block.imageAlt}
                      width={400}
                      height={520}
                      className="h-[200px] w-full object-contain object-center sm:h-[260px] lg:h-[320px]"
                    />
                  </div>
                ) : null}
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
