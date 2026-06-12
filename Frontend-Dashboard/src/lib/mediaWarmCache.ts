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

export const MARKETING_VIDEO_URLS = [

  "/assets/video.mp4",

  "/assets/bg-video.mp4",

  "/assets/v.mp4",

  "/assets/bg-video%201.mp4",
  "/assets/video2.mp4",
] as const;



/** Lower-priority GIF — warmed after hero-critical assets. */

export const MARKETING_DEFERRED_IMAGE_URLS = ["/assets/tt.gif"] as const;



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

    img.onload = finish;

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

 * Stage media warming: logo first, hero video next, remaining assets when idle.

 * Avoids saturating bandwidth during first paint.

 */

export function scheduleMarketingMediaWarmup(): void {

  if (typeof window === "undefined" || stagedWarmupStarted) return;

  stagedWarmupStarted = true;



  void warmImage(MARKETING_IMAGE_URLS[0]);



  runWhenIdle(() => {

    void warmVideo(MARKETING_VIDEO_URLS[0]);

    runWhenIdle(() => {

      for (const src of MARKETING_DEFERRED_IMAGE_URLS) void warmImage(src);

      void warmVideosSequentially(MARKETING_VIDEO_URLS.slice(1));

    }, 4000);

  }, 1800);

}


