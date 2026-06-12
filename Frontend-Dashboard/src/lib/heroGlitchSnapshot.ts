/** Keeps the last hero glitch canvas frame so returning to `/` paints instantly. */

export type GlitchLetter = {
  char: string;
  color: string;
  targetColor: string;
  colorProgress: number;
};

type GlitchCache = {
  canvasWidth: number;
  canvasHeight: number;
  cssWidth: number;
  cssHeight: number;
  columns: number;
  rows: number;
  letters: GlitchLetter[];
};

let snapshot: HTMLCanvasElement | null = null;
let stateCache: GlitchCache | null = null;

export function captureHeroGlitchState(
  source: HTMLCanvasElement,
  cssWidth: number,
  cssHeight: number,
  columns: number,
  rows: number,
  letters: GlitchLetter[],
): void {
  if (typeof document === "undefined" || source.width <= 0 || source.height <= 0) return;
  if (!snapshot) snapshot = document.createElement("canvas");
  if (snapshot.width !== source.width || snapshot.height !== source.height) {
    snapshot.width = source.width;
    snapshot.height = source.height;
  }
  const ctx = snapshot.getContext("2d");
  if (!ctx) return;
  ctx.drawImage(source, 0, 0);
  stateCache = {
    canvasWidth: source.width,
    canvasHeight: source.height,
    cssWidth,
    cssHeight,
    columns,
    rows,
    letters: letters.map((letter) => ({ ...letter })),
  };
}

export function restoreHeroGlitchState(
  target: HTMLCanvasElement,
  dpr: number,
): GlitchCache | null {
  if (!stateCache || !snapshot || snapshot.width <= 0) return null;
  target.width = stateCache.canvasWidth;
  target.height = stateCache.canvasHeight;
  target.style.width = `${stateCache.cssWidth}px`;
  target.style.height = `${stateCache.cssHeight}px`;
  const ctx = target.getContext("2d");
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.drawImage(snapshot, 0, 0);
  return stateCache;
}

export function hasHeroGlitchSnapshot(): boolean {
  return Boolean(stateCache && snapshot && snapshot.width > 0);
}
