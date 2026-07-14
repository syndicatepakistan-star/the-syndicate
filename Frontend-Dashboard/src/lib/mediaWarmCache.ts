/** In-memory video pool + browser cache warmup for marketing pages. */



const warmedVideos = new Set<string>();

const warmedImages = new Set<string>();

const videoWarmPromises = new Map<string, Promise<void>>();

const imageWarmPromises = new Map<string, Promise<void>>();

let stagedWarmupStarted = false;



/** Hidden elements keep buffers alive so remounted `<video>` tags hit disk cache instantly. */

const videoPool = new Map<string, HTMLVideoElement>();

const VIDEO_POOL_LIMIT = 8;



/** Critical still assets — warm immediately on first paint. */

export const MARKETING_IMAGE_URLS = ["/assets/logo.webp"] as const;



/** Decorative MP4 assets — warmed in stages so they do not compete with LCP. */

export const PROGRAMS_SECTION_VIDEO = "/assets/v.mp4";

export const DASHBOARD_SHELL_VIDEO = "/assets/dashboard/bg.mp4";

export const MARKETING_VIDEO_URLS = [

  "/assets/bg-video.mp4",

  PROGRAMS_SECTION_VIDEO,

  DASHBOARD_SHELL_VIDEO,

  "/assets/video.mp4",

  "/assets/bg-video%201.mp4",
  // NOTE: /assets/video2.mp4 (~49 MB) is intentionally NOT pre-warmed — the pricing
  // section's ViewportDecorVideo loads it on demand when scrolled into view.
] as const;

/** Phones / data-saver connections skip the background video warmup entirely. */
function shouldSkipHeavyVideoWarmup(): boolean {
  if (typeof window === "undefined") return true;
  if (window.matchMedia("(max-width: 767px)").matches) return true;
  type NetworkInformation = { saveData?: boolean; effectiveType?: string };
  const connection = (navigator as Navigator & { connection?: NetworkInformation }).connection;
  if (connection?.saveData) return true;
  const effectiveType = connection?.effectiveType ?? "";
  return effectiveType === "2g" || effectiveType === "slow-2g" || effectiveType === "3g";
}



/** Lower-priority GIF — warmed after hero-critical assets. */

export const MARKETING_DEFERRED_IMAGE_URLS = ["/assets/tt.gif"] as const;

/** Warm homepage globe tiles in parallel (same-origin thumbnails). */
export function warmGlobeGalleryImages(urls?: readonly string[]): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const list = urls?.length ? urls : [];
  if (!list.length) return Promise.resolve();
  return Promise.all(list.map((src) => warmImage(src))).then(() => undefined);
}

/** Programs hero band: background MP4 + globe tiles together (parallel network + decode). */
export function warmProgramsSectionAssets(globeUrls?: readonly string[]): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const globeList = globeUrls?.length ? globeUrls : [];
  const globeWarm =
    globeList.length === 0 || globeList.every((src) => isImageWarm(src))
      ? Promise.resolve()
      : warmGlobeGalleryImages(globeList);
  const videoWarm = isVideoWarm(PROGRAMS_SECTION_VIDEO)
    ? Promise.resolve()
    : warmVideo(PROGRAMS_SECTION_VIDEO);
  return Promise.all([videoWarm, globeWarm]).then(() => undefined);
}



/** @deprecated use MARKETING_IMAGE_URLS + MARKETING_VIDEO_URLS */

export const MARKETING_MEDIA_URLS = [

  ...MARKETING_IMAGE_URLS,

  ...MARKETING_VIDEO_URLS,

  ...MARKETING_DEFERRED_IMAGE_URLS,

] as const;



/** @deprecated use MARKETING_MEDIA_URLS */

export const HOME_MEDIA_URLS = MARKETING_MEDIA_URLS;



export function isVideoWarm(src: string): boolean {

  return warmedVideos.has(src);

}



export function isImageWarm(src: string): boolean {

  return warmedImages.has(src);

}



function runWhenIdle(task: () => void, timeout = 2500): void {

  if (typeof window === "undefined") return;

  const ric = window.requestIdleCallback;

  if (ric) {

    ric(task, { timeout });

    return;

  }

  window.setTimeout(task, 120);

}



function evictOldestVideoFromPool(): void {

  if (videoPool.size < VIDEO_POOL_LIMIT) return;

  const oldest = videoPool.keys().next().value;

  if (!oldest) return;

  const el = videoPool.get(oldest);

  if (el) {

    el.pause();

    el.removeAttribute("src");

    el.load();

  }

  videoPool.delete(oldest);

  warmedVideos.delete(oldest);

}



function poolVideoFor(src: string): HTMLVideoElement {

  let video = videoPool.get(src);

  if (!video) {

    evictOldestVideoFromPool();

    video = document.createElement("video");

    video.muted = true;

    video.playsInline = true;

    video.preload = "auto";

    video.setAttribute("playsinline", "");

    videoPool.set(src, video);

  }

  if (video.getAttribute("data-warm-src") !== src) {

    video.src = src;

    video.setAttribute("data-warm-src", src);

  }

  return video;

}



export function warmVideo(src: string): Promise<void> {

  if (typeof window === "undefined") return Promise.resolve();

  if (warmedVideos.has(src)) return Promise.resolve();



  const pooled = videoPool.get(src);

  if (pooled && pooled.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {

    warmedVideos.add(src);

    return Promise.resolve();

  }



  const pending = videoWarmPromises.get(src);

  if (pending) return pending;



  const promise = new Promise<void>((resolve) => {

    const video = poolVideoFor(src);



    const finish = () => {

      warmedVideos.add(src);

      videoWarmPromises.delete(src);

      video.pause();

      resolve();

    };



    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {

      finish();

      return;

    }



    video.addEventListener("loadeddata", finish, { once: true });

    video.addEventListener("canplaythrough", finish, { once: true });

    video.addEventListener("error", finish, { once: true });

    video.load();

  });



  videoWarmPromises.set(src, promise);

  return promise;

}



export function warmImage(src: string): Promise<void> {

  if (typeof window === "undefined") return Promise.resolve();

  if (warmedImages.has(src)) return Promise.resolve();

  const pending = imageWarmPromises.get(src);

  if (pending) return pending;



  const promise = new Promise<void>((resolve) => {
    const img = new Image();
    img.decoding = "async";

    const finish = () => {
      warmedImages.add(src);
      imageWarmPromises.delete(src);
      resolve();
    };

    const afterLoad = () => {
      if (typeof img.decode === "function") {
        void img.decode().then(finish).catch(finish);
        return;
      }
      finish();
    };

    img.onload = afterLoad;
    img.onerror = finish;
    img.src = src;
  });



  imageWarmPromises.set(src, promise);

  return promise;

}



async function warmVideosSequentially(urls: readonly string[]): Promise<void> {

  for (const src of urls) {

    await warmVideo(src);

    await new Promise<void>((resolve) => runWhenIdle(() => resolve(), 1200));

  }

}



/** Warm all marketing media — prefer scheduleMarketingMediaWarmup for initial load. */

export function warmMarketingMedia(): Promise<void> {

  if (typeof window === "undefined") return Promise.resolve();

  return Promise.all([

    ...MARKETING_IMAGE_URLS.map((u) => warmImage(u)),

    ...MARKETING_DEFERRED_IMAGE_URLS.map((u) => warmImage(u)),

    warmVideosSequentially(MARKETING_VIDEO_URLS),

  ]).then(() => undefined);

}



/** @deprecated use warmMarketingMedia */

export function warmHomeMedia(): Promise<void> {

  return warmMarketingMedia();

}



/**

 * Stage media warming: logo first; programs band deferred on home (globe section warms it).

 */

export function scheduleMarketingMediaWarmup(options?: { deferProgramsBand?: boolean }): void {

  if (typeof window === "undefined" || stagedWarmupStarted) return;

  stagedWarmupStarted = true;



  void warmImage(MARKETING_IMAGE_URLS[0]);

  if (shouldSkipHeavyVideoWarmup()) {
    // Phones / slow connections: never bulk-download background MP4s. Videos that
    // actually render still load on demand via ViewportDecorVideo.
    return;
  }

  if (!options?.deferProgramsBand) {
    void warmVideo(PROGRAMS_SECTION_VIDEO);
  }



  runWhenIdle(() => {

    void warmVideo(MARKETING_VIDEO_URLS[0]);

    runWhenIdle(() => {

      for (const src of MARKETING_DEFERRED_IMAGE_URLS) void warmImage(src);

      void warmVideosSequentially(

        MARKETING_VIDEO_URLS.filter((src) => src !== PROGRAMS_SECTION_VIDEO && src !== MARKETING_VIDEO_URLS[0]),

      );

    }, 2500);

  }, options?.deferProgramsBand ? 1800 : 900);

}


