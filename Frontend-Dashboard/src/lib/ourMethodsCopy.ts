import type { MethodSplitAccent } from "@/components/methods/MethodSplitCard";
import { getSyndicateCopyParagraphs } from "@/lib/syndicateWebsiteCopy";

export type OurMethodsBlock = {
  id: string;
  title: string;
  summary: string;
  paragraphs: [string, string];
  image?: string;
  imageAlt: string;
  videoSrc?: string;
  keySrc?: string;
  footerEmphasis?: string;
  accent: MethodSplitAccent;
};

function pairParagraphs(lines: string[], fallback: [string, string]): [string, string] {
  if (lines.length >= 2) return [lines[0], lines[1]];
  if (lines.length === 1) return [lines[0], lines[0]];
  return fallback;
}

const breakFree = getSyndicateCopyParagraphs("BREAK FREE FROM THE SYSTEM");
const moneyPower = getSyndicateCopyParagraphs("Money and Power Mastery");
const philosophy = getSyndicateCopyParagraphs("THE SYNDICATE PHILOSOPHY");
const techniques = getSyndicateCopyParagraphs("THE SYNDICATE TECHNIQUES");

export const OUR_METHODS_BLOCKS: OurMethodsBlock[] = [
  {
    id: "greatness",
    title: "Achieving True Greatness comes with Mastery",
    summary:
      "Greatness is engineered through discipline and strategic education, not by chance.",
    paragraphs: [
      "True greatness is not achieved by chance - it is deliberately built through knowledge, discipline, and action. The Syndicate equips its members with actionable, real-world strategies designed to help them master the systems of wealth and power.",
      "The Syndicate brings clarity to wealth systems with immediate implementation methods. Every lesson is built for practical execution from day one while preserving moral integrity and purpose.",
    ],
    imageAlt: "Gold key symbol",
    keySrc: "/assets/Gold-Key.png",
    accent: "cyan",
  },
  {
    id: "break-free",
    title: "BREAK FREE FROM THE SYSTEM",
    summary:
      "Reject passive compliance and build strategic autonomy through alliance and execution.",
    paragraphs: pairParagraphs(breakFree, [
      "The Syndicate stands as an elite and exclusive organisation of individuals committed to achieving the zenith of power, wealth, and mastery. This private network is for those who yearn for true greatness and the ability to shape their destiny.",
      "At its core, The Syndicate is about breaking free from the shackles of the capitalist system that often leaves individuals as mere cogs in a vast economic and political machine. This is not a get rich quick scheme.",
    ]),
    videoSrc: "/assets/bg-video.mp4",
    imageAlt: "Break free from the system — dystopian cathedral uplink",
    footerEmphasis: "Master yourself. Master the system.",
    accent: "amber",
  },
  {
    id: "money-power",
    title: "Money and Power Mastery",
    summary:
      moneyPower[2] ??
      "This is the definition of true success and greatness. This is the true meaning of money, power and life mastery.",
    paragraphs: pairParagraphs(moneyPower, [
      "The Syndicate philosophy teaches that money and power go hand in hand. They are like two sides of the same coin.",
      "The Syndicate's mission goes beyond attaining money, power and influence. Its elite training programmes aim to redefine how individuals perceive power and influence.",
    ]),
    image: "/assets/money-power-mastery.png",
    imageAlt: "Money and power mastery — dystopian throne and neon doctrine",
    accent: "violet",
  },
  {
    id: "philosophy",
    title: "THE SYNDICATE PHILOSOPHY",
    summary: "Money and power are tools — wielded with integrity or they enslave.",
    paragraphs: pairParagraphs(philosophy, [
      "Our philosophy is clear: money and power are tools. When wielded with moral integrity, they can create profound personal transformation and societal impact. When misused, they have the potential to enslave and corrupt.",
      "What sets The Syndicate apart is its commitment to ethics and societal impact. This is not just about wealth; it's about defining true success as a balance between prosperity and moral codes.",
    ]),
    image: "/assets/programs/cources%20imnages/money-philosophy.jpeg",
    imageAlt: "Syndicate philosophy — honour and leverage",
    accent: "cyan",
  },
  {
    id: "techniques",
    title: "THE SYNDICATE TECHNIQUES",
    summary:
      "Immersive elite training — techniques you can implement from the first video.",
    paragraphs: pairParagraphs(techniques, [
      "The Syndicate brings clarity to the complicated dynamics of wealth and power accumulation. Through immersive, elite training programmes that — if implemented correctly — allow participants to learn the secrets to master money and power and to bend reality to their will.",
      "Our special methods are designed to naturally absorb this information and put it into practice straight away. Every lesson delivers techniques that can be implemented immediately, from the very first video.",
    ]),
    image: "/assets/our-2.jpg",
    imageAlt: "Syndicate techniques in motion",
    accent: "amber",
  },
];
