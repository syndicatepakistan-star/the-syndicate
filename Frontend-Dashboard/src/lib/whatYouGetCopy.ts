import type { CyberFrameAccent } from "@/components/cyber/CyberChamferFrames";
import { getSyndicateCopy, getSyndicateCopyParagraphs } from "@/lib/syndicateWebsiteCopy";

const alliance = getSyndicateCopy("Access to a powerful network and alliance.");
const kings = getSyndicateCopyParagraphs("Follow the path of Kings and Emperors");

export const ALLIANCE_HERO_LEDE =
  alliance?.paragraphs[0] ??
  "The path to success is not meant to be walked alone.";

export const ALLIANCE_SECTION_HEADLINE =
  alliance?.paragraphs[3] ??
  "The Syndicate is where money and power meet mastery. Join The Syndicate today. Make the commitment now.";

export const ACCESS_PILLARS: {
  accent: CyberFrameAccent;
  title: string;
  body: string;
}[] = [
  {
    accent: "cyan",
    title: "Power beside power",
    body:
      alliance?.paragraphs[1] ??
      "Joining a powerful alliance, an elite organisation of like-minded individuals, becomes not just a choice but a necessity for those who seek to transcend the difficult struggles for power and possession.",
  },
  {
    accent: "violet",
    title: "Pressure-forged growth",
    body:
      alliance?.paragraphs[2] ??
      "Within the sanctity of this alliance, you not only find refuge but a crucible for growth, where your strengths are honed and your weaknesses fortified by the collective wisdom of those who share your values and desires.",
  },
  {
    accent: "amber",
    title: "Sacred moral code",
    body:
      "This is not merely a network — it is an alliance forged on a sacred moral code. Its members abide by principles of integrity, mutual respect, and unwavering honour, creating an environment where strength is sharpened and weaknesses are transformed into fortitude.",
  },
];

const ROYAL_STYLES = [
  {
    border: "border-rose-400/75",
    glow: "shadow-[0_0_0_1px_rgba(244,63,94,0.7),0_0_18px_rgba(244,63,94,0.45),0_0_32px_rgba(190,24,93,0.22)]",
    panel:
      "bg-[linear-gradient(128deg,rgba(136,19,55,0.55)_0%,rgba(24,8,18,0.94)_48%,rgba(8,6,14,0.98)_100%)]",
    stepClass:
      "border-rose-400/70 bg-rose-950/60 text-rose-100 shadow-[0_0_14px_rgba(244,63,94,0.35)]",
    tagClass: "text-rose-300/90",
    lineClass: "text-rose-50/95",
  },
  {
    border: "border-fuchsia-400/75",
    glow: "shadow-[0_0_0_1px_rgba(217,70,239,0.7),0_0_18px_rgba(217,70,239,0.45),0_0_32px_rgba(162,28,175,0.22)]",
    panel:
      "bg-[linear-gradient(128deg,rgba(126,34,206,0.5)_0%,rgba(18,8,28,0.94)_48%,rgba(8,6,14,0.98)_100%)]",
    stepClass:
      "border-fuchsia-400/70 bg-fuchsia-950/60 text-fuchsia-100 shadow-[0_0_14px_rgba(217,70,239,0.35)]",
    tagClass: "text-fuchsia-300/90",
    lineClass: "text-fuchsia-50/95",
  },
  {
    border: "border-cyan-400/75",
    glow: "shadow-[0_0_0_1px_rgba(34,211,238,0.7),0_0_18px_rgba(34,211,238,0.45),0_0_32px_rgba(14,165,233,0.22)]",
    panel:
      "bg-[linear-gradient(128deg,rgba(14,116,144,0.5)_0%,rgba(6,16,24,0.94)_48%,rgba(8,6,14,0.98)_100%)]",
    stepClass:
      "border-cyan-400/70 bg-cyan-950/60 text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,0.35)]",
    tagClass: "text-cyan-300/90",
    lineClass: "text-cyan-50/95",
  },
] as const;

const ROYAL_TAGS = ["Doctrine", "Through-line", "Transformation"] as const;

export const ROYAL_PATH_TITLE = "Follow the path of Kings and Emperors";

export const ROYAL_PATH_ITEMS = kings.map((line, idx) => ({
  step: String(idx + 1).padStart(2, "0"),
  tag: ROYAL_TAGS[idx] ?? "Lineage",
  line,
  ...ROYAL_STYLES[Math.min(idx, ROYAL_STYLES.length - 1)],
}));
