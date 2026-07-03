/** Cyberpunk frame overlays under `public/assets/frames/` (`.jpg` on disk; `.png` also supported). */
export const FOUNDER_FRAME_NAMES = [
  "glitch",
  "green",
  "neon",
  "purple",
  "red",
  "yellow",
] as const;

export type FounderFrameName = (typeof FOUNDER_FRAME_NAMES)[number];

/** Default cycle when a clip omits an explicit `frame` in data. */
export const FOUNDER_FRAME_CYCLE: FounderFrameName[] = [
  "red",
  "neon",
  "purple",
  "yellow",
  "green",
  "glitch",
];

export function isFounderFrameName(value: string): value is FounderFrameName {
  return (FOUNDER_FRAME_NAMES as readonly string[]).includes(value);
}

/** Public URL for a frame overlay asset. */
export function founderFrameSrc(frame: FounderFrameName, ext: "jpg" | "png" = "jpg"): string {
  return `/assets/frames/${frame}.${ext}`;
}

export function founderFrameCycleAt(index: number): FounderFrameName {
  return FOUNDER_FRAME_CYCLE[index % FOUNDER_FRAME_CYCLE.length]!;
}

/** Encode spaces/special chars in `/public` asset paths for Next/Image and fetch. */
export function encodePublicAssetPath(path: string): string {
  if (!path.startsWith("/")) return path;
  return path
    .split("/")
    .map((segment, index) => (index === 0 ? segment : encodeURIComponent(decodeURIComponent(segment))))
    .join("/");
}
