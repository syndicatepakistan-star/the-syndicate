"use client";

import Image from "next/image";
import { PublicPlanOfferCards } from "@/components/programs/PublicPlanOfferCards";
import { cx, CyberChamferFrame, CyberInsetPanel } from "@/components/cyber/CyberChamferFrames";
import { publicHeadingLightning } from "@/lib/publicHeadingLightning";

const MEMBERSHIP_CHANNELS = [
  {
    step: "01",
    title: "Course Command",
    tagline: "Choose 4–5 programs from the selection catalog.",
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
    title: "The Knight Tier",
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
    body: "The Knight tier opens the selection catalog so you hand-pick four to five courses that match your operator profile. Structure without surrendering control.",
    image: "/assets/pawn.png",
    imageAlt: "The Pawn — your curriculum",
    accent: "cyan" as const,
  },
  {
    id: "dashboard",
    title: "Inside The Dashboard",
    summary: "Goals, missions, and the full deck in one shell.",
    body: "This is not passive education — it is a controlled environment built for action, discipline, and execution. Syndicate Mode, milestones, weekly drops, and member intelligence wired into the same command surface you train in.",
    image: "/assets/pawn.png",
    imageAlt: "Cyber dashboard sentinel",
    accent: "violet" as const,
  },
  {
    id: "gate",
    title: "Break The Gate",
    summary: "One tier. Full uplink. No partial access.",
    body: "Money Mastery is the runway. The Knight is the airlock — library, challenges, articles, and credential paths behind a single dystopian-grade unlock.",
    image: "/assets/pawn1.jpg",
    imageAlt: "Neon gate breaker",
    accent: "amber" as const,
  },
] as const;

function ChannelCard({ item }: { item: (typeof MEMBERSHIP_CHANNELS)[number] }) {
  return (
    <article
      className={cx(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border-2 p-5 transition-transform duration-300 hover:-translate-y-0.5",
        "[clip-path:polygon(14px_0,calc(100%-14px)_0,100%_14px,100%_calc(100%-14px),calc(100%-14px)_100%,14px_100%,0_calc(100%-14px),0_14px)]",
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
      <div className="relative z-10 flex min-h-[11.5rem] flex-1 flex-col rounded-lg bg-[linear-gradient(165deg,rgba(10,8,18,0.82),rgba(4,6,14,0.9))] p-3.5 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-[1px] transition-transform duration-300 group-hover:scale-[1.02] sm:min-h-[12.5rem] sm:p-4">
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
            publicHeadingLightning("amber"),
            "marketing-card-title-oneline mt-3.5 text-2xl font-black uppercase leading-tight tracking-[0.04em] text-zinc-50 drop-shadow-[0_2px_10px_rgba(0,0,0,0.72)]",
            item.titleText
          )}
        >
          {item.title}
        </h3>
        <p className="mt-3 flex-1 text-base leading-relaxed text-zinc-100/95 drop-shadow-[0_1px_8px_rgba(0,0,0,0.68)]">{item.tagline}</p>
      </div>
    </article>
  );
}

export function MembershipOfferSections() {
  const accentFrame = (accent: (typeof MEMBERSHIP_PILLARS)[number]["accent"]) =>
    accent === "cyan" ? "cyan" : accent === "violet" ? "violet" : "amber";

  const titleColor: Record<(typeof MEMBERSHIP_PILLARS)[number]["accent"], string> = {
    cyan: "text-cyan-100",
    violet: "text-fuchsia-200/90",
    amber: "text-amber-100",
  };

  return (
    <>
      <section>
        <div className="mb-6">
          <h2 className="public-heading-lightning public-heading-lightning--gold text-[clamp(1.75rem,4vw,3.2rem)] font-black uppercase tracking-[0.08em]">
            Membership Rig
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          {MEMBERSHIP_CHANNELS.map((item) => (
            <ChannelCard key={item.step} item={item} />
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
              <CyberChamferFrame accent={accentFrame(block.accent)} chamfer={22} innerClassName="cyber-frame-mobile-pad p-6 sm:p-8">
                <h3
                  className={cx(
                    publicHeadingLightning("amber"),
                    "marketing-card-title-oneline text-[clamp(1.85rem,3.8vw,3.2rem)] font-black leading-[1]",
                    titleColor[block.accent]
                  )}
                >
                  {block.title}
                </h3>
                <p className="mt-3 text-xl leading-relaxed text-zinc-100/88 sm:text-2xl">{block.summary}</p>
                <CyberInsetPanel variant={block.accent === "violet" ? "void" : block.accent === "amber" ? "blood" : "cyan"} className="cyber-inset-mobile-pad mt-6">
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
    </>
  );
}

export function MembershipOfferLanding({
  embedded = false,
  checkoutReturnPath = "/dashboard/resources",
}: {
  embedded?: boolean;
  checkoutReturnPath?: string;
}) {
  if (embedded) {
    return (
      <main className="relative z-10 flex w-full min-w-0 flex-col items-center overflow-x-clip py-4">
        <PublicPlanOfferCards checkoutReturnPath={checkoutReturnPath} embedded size="large" />
      </main>
    );
  }

  return null;
}
