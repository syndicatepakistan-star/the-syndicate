/**
 * Device cache: first visit fetches from network; repeat visits serve static
 * assets from Cache Storage (CDN + browser disk cache still apply).
 */
const STATIC_CACHE = "syndicate-static-v1";
const RUNTIME_CACHE = "syndicate-runtime-v1";

const PRECACHE_URLS = [
  "/assets/logo.webp",
  "/fonts/CS%20Daine%20Mono/CSDaineMono-Regular.woff2",
];

const STATIC_PREFIXES = ["/_next/static/", "/assets/", "/fonts/"];
const BYPASS_PREFIXES = [
  "/api/",
  "/dashboard",
  "/affiliate-portal",
  "/affiliate-login",
  "/verify-otp",
  "/checkout",
];

function isStaticAsset(pathname) {
  if (STATIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  if (pathname.startsWith("/_next/image")) return true;
  if (pathname === "/favicon.ico" || pathname === "/sw.js") return false;
  return /\.(avif|webp|png|jpe?g|gif|svg|ico|woff2?|otf|ttf|mp4|webm|m4v)$/i.test(pathname);
}

function shouldBypass(pathname) {
  return BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (shouldBypass(url.pathname)) return;
  if (!isStaticAsset(url.pathname)) return;

  event.respondWith(cacheFirst(event.request));
});

async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      void cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    if (cached) return cached;
    throw error;
  }
}
