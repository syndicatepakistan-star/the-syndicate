/** Lazy GSAP — keep it out of the /dashboard/programs first-paint JS chunk. */
type GsapCore = typeof import("gsap").default;

let gsapPromise: Promise<GsapCore> | null = null;

export function loadGsap(): Promise<GsapCore> {
  if (!gsapPromise) {
    gsapPromise = import("gsap").then((m) => m.default);
  }
  return gsapPromise;
}
