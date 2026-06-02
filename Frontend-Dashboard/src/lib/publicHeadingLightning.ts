export type PublicHeadingLightningVariant =
  | "gold"
  | "amber"
  | "cyan"
  | "violet"
  | "fuchsia"
  | "lime"
  | "emerald"
  | "white";

const BASE = "public-heading-lightning";

/** Instructor-style pulsing neon text (public marketing + pill headings). Server-safe. */
export function publicHeadingLightning(
  variant: PublicHeadingLightningVariant = "gold",
  extra?: string
): string {
  return [BASE, `${BASE}--${variant}`, extra].filter(Boolean).join(" ");
}
