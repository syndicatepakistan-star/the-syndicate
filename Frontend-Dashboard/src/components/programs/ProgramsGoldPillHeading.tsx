import { cn } from "@/components/dashboard/dashboardPrimitives";

export type ProgramsGoldPillHeadingChrome = "gold" | "goldViolet" | "violet" | "lime" | "fuchsia" | "cyan";

type ProgramsGoldPillHeadingProps = {
  title: string;
  as?: "h1" | "h2";
  size?: "default" | "compact";
  /** Defaults to gold (programs library). Membership uses other neons. */
  chrome?: ProgramsGoldPillHeadingChrome;
};

const CHROME: Record<
  ProgramsGoldPillHeadingChrome,
  {
    shell: string;
    innerRing: string;
    bar: string;
    radial: string;
    title: string;
  }
> = {
  gold: {
    shell:
      "border border-[#d4af39]/45 shadow-[0_0_18px_rgba(212,175,57,0.2),inset_0_0_18px_rgba(212,175,57,0.09)] bg-[linear-gradient(180deg,rgba(18,18,18,0.94),rgba(4,4,4,0.98))]",
    innerRing: "border-[#d4af39]/35",
    bar: "bg-[linear-gradient(180deg,transparent,rgba(212,175,57,0.82),transparent)]",
    radial: "bg-[radial-gradient(120%_130%_at_50%_-25%,rgba(212,175,57,0.22),transparent_55%)]",
    title:
      "text-[#d4af39] drop-shadow-[0_0_10px_rgba(212,175,57,0.55)] [text-shadow:0_0_28px_rgba(212,175,57,0.38)]",
  },
  /** Gold HUD title + violet/purple pill rim and outer bloom (membership hero). */
  goldViolet: {
    shell:
      "border border-violet-400/55 bg-[linear-gradient(180deg,rgba(14,10,26,0.96),rgba(4,2,12,0.99))] shadow-[0_0_0_1px_rgba(76,29,149,0.55),0_0_20px_rgba(139,92,246,0.5),0_0_48px_rgba(124,58,237,0.38),0_0_88px_rgba(91,33,182,0.22),inset_0_0_24px_rgba(212,175,57,0.06)]",
    innerRing: "border-[#d4af39]/34",
    bar: "bg-[linear-gradient(180deg,transparent,rgba(212,175,57,0.8),transparent)]",
    radial:
      "bg-[radial-gradient(120%_130%_at_50%_-25%,rgba(167,139,250,0.22),transparent_42%),radial-gradient(90%_80%_at_50%_120%,rgba(212,175,57,0.1),transparent_55%)]",
    title:
      "text-[#d4af39] drop-shadow-[0_0_8px_rgba(212,175,57,0.78),0_0_22px_rgba(212,175,57,0.48),0_0_42px_rgba(212,175,57,0.2)] [text-shadow:0_0_1px_rgba(240,220,175,0.65),0_0_26px_rgba(212,175,57,0.42)]",
  },
  violet: {
    shell:
      "border border-violet-400/50 shadow-[0_0_22px_rgba(139,92,246,0.42),0_0_48px_rgba(124,58,237,0.18),inset_0_0_22px_rgba(91,33,182,0.14)] bg-[linear-gradient(180deg,rgba(14,10,26,0.96),rgba(4,2,12,0.99))]",
    innerRing: "border-violet-400/40",
    bar: "bg-[linear-gradient(180deg,transparent,rgba(167,139,250,0.85),transparent)]",
    radial: "bg-[radial-gradient(120%_130%_at_50%_-25%,rgba(167,139,250,0.28),transparent_55%)]",
    title:
      "text-violet-200 drop-shadow-[0_0_12px_rgba(167,139,250,0.75)] [text-shadow:0_0_32px_rgba(139,92,246,0.45)]",
  },
  lime: {
    shell:
      "border border-lime-300/45 shadow-[0_0_22px_rgba(163,230,53,0.38),0_0_52px_rgba(132,204,22,0.16),inset_0_0_22px_rgba(63,98,18,0.12)] bg-[linear-gradient(180deg,rgba(10,18,6,0.96),rgba(3,8,2,0.99))]",
    innerRing: "border-lime-300/38",
    bar: "bg-[linear-gradient(180deg,transparent,rgba(190,242,100,0.85),transparent)]",
    radial: "bg-[radial-gradient(120%_130%_at_50%_-25%,rgba(217,249,157,0.22),transparent_55%)]",
    title:
      "text-lime-200 drop-shadow-[0_0_12px_rgba(190,242,100,0.65)] [text-shadow:0_0_30px_rgba(132,204,22,0.4)]",
  },
  fuchsia: {
    shell:
      "border border-fuchsia-400/48 shadow-[0_0_22px_rgba(232,121,249,0.4),0_0_50px_rgba(192,38,211,0.18),inset_0_0_22px_rgba(88,28,135,0.14)] bg-[linear-gradient(180deg,rgba(18,6,16,0.96),rgba(6,2,8,0.99))]",
    innerRing: "border-fuchsia-400/38",
    bar: "bg-[linear-gradient(180deg,transparent,rgba(244,114,182,0.85),transparent)]",
    radial: "bg-[radial-gradient(120%_130%_at_50%_-25%,rgba(244,114,182,0.22),transparent_55%)]",
    title:
      "text-fuchsia-200 drop-shadow-[0_0_12px_rgba(232,121,249,0.7)] [text-shadow:0_0_32px_rgba(217,70,239,0.42)]",
  },
  cyan: {
    shell:
      "border border-cyan-400/48 shadow-[0_0_22px_rgba(34,211,238,0.38),0_0_50px_rgba(14,165,233,0.16),inset_0_0_22px_rgba(8,51,68,0.14)] bg-[linear-gradient(180deg,rgba(4,14,20,0.96),rgba(2,8,14,0.99))]",
    innerRing: "border-cyan-400/38",
    bar: "bg-[linear-gradient(180deg,transparent,rgba(103,232,249,0.85),transparent)]",
    radial: "bg-[radial-gradient(120%_130%_at_50%_-25%,rgba(165,243,252,0.22),transparent_55%)]",
    title:
      "text-cyan-200 drop-shadow-[0_0_12px_rgba(34,211,238,0.65)] [text-shadow:0_0_30px_rgba(56,189,248,0.38)]",
  },
};

export function ProgramsGoldPillHeading({
  title,
  as: Tag = "h2",
  size = "default",
  chrome = "gold",
}: ProgramsGoldPillHeadingProps) {
  const c = CHROME[chrome];
  const shellPad =
    size === "compact" ? "px-5 py-3 sm:px-10 sm:py-4" : "px-10 py-4 sm:px-14 sm:py-5";
  const titleSize =
    size === "compact"
      ? "text-[clamp(0.72rem,2.4vw+0.35rem,1.35rem)] sm:text-[clamp(0.95rem,1.2vw+0.55rem,2.15rem)]"
      : "text-[2rem] sm:text-[3.35rem]";

  return (
    <div className="mx-auto flex w-full max-w-[1400px] justify-center px-[clamp(1rem,3.2vw,1.5rem)] sm:px-6">
      <div className={cn("relative max-w-full overflow-hidden rounded-[999px]", c.shell, shellPad)}>
        <span className="programs-heading-bg-shine pointer-events-none absolute inset-0 rounded-[999px]" />
        <span className={cn("pointer-events-none absolute inset-[4px] rounded-[999px] border", c.innerRing)} />
        <span
          className={cn(
            "pointer-events-none absolute left-[5%] top-1/2 h-[62%] w-[2px] -translate-y-1/2 opacity-70",
            c.bar
          )}
        />
        <span
          className={cn(
            "pointer-events-none absolute right-[5%] top-1/2 h-[62%] w-[2px] -translate-y-1/2 opacity-70",
            c.bar
          )}
        />
        <span className={cn("pointer-events-none absolute inset-0 rounded-[999px] opacity-60", c.radial)} />
        <span
          className="programs-heading-shine pointer-events-none absolute inset-y-[-20%] left-[-35%] w-[20%] bg-[linear-gradient(100deg,transparent_0%,rgba(255,255,255,0.65)_50%,transparent_100%)] opacity-70 blur-[2px]"
          aria-hidden
        />
        <Tag className={cn("programs-heading-glow relative text-center font-black uppercase tracking-[0.14em]", c.title, titleSize)}>
          {title}
        </Tag>
      </div>
    </div>
  );
}
