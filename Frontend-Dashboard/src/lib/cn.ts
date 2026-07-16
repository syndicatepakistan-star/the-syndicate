/** Tiny className joiner — keep this free of heavy UI deps (framer-motion, etc.). */
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
