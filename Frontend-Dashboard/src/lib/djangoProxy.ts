import { resolveDjangoBackendOrigin } from "@/lib/djangoBackendOrigin";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "host",
]);

/** Upstream may gzip; Node fetch decompresses the body but can leave encoding headers — strip them. */
const STRIP_UPSTREAM_RESPONSE_HEADERS = new Set([
  ...HOP_BY_HOP,
  "content-encoding",
  "content-length",
]);

/** HLS segment/init paths must not get APPEND_SLASH (breaks Django media_path route). */
function isStreamingHlsMediaSubpath(subpath: string): boolean {
  return /(?:^|\/)streaming\/videos\/playback\/\d+\/media\//i.test(subpath);
}

function djangoApiPathForSubpath(subpath: string): string {
  const clean = subpath.replace(/^\/+|\/+$/g, "");
  if (isStreamingHlsMediaSubpath(clean)) {
    return `/api/${clean}`;
  }
  return `/api/${clean}/`;
}

async function proxyToDjangoApi(
  request: Request,
  apiPathSegments: string[],
): Promise<Response> {
  const origin = resolveDjangoBackendOrigin();
  if (!origin) {
    return new Response(
      JSON.stringify({
        detail:
          "Backend URL not configured. Set BACKEND_INTERNAL_URL or NEXT_PUBLIC_API_BASE_URL on the frontend Railway service.",
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }

  const subpath = apiPathSegments.filter(Boolean).join("/");
  const incoming = new URL(request.url);
  const target = new URL(djangoApiPathForSubpath(subpath), origin);
  target.search = incoming.search;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  });
  // Ask upstream for identity so we never forward mismatched Content-Encoding.
  headers.delete("accept-encoding");

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  let upstream: Response;
  try {
    upstream = await fetch(target.toString(), init);
  } catch (err) {
    const detail =
      err instanceof Error && err.message
        ? err.message
        : "Could not reach Django backend from the frontend service.";
    return new Response(
      JSON.stringify({
        detail: `Backend proxy failed (${origin}). Set BACKEND_INTERNAL_URL on the frontend Railway service. ${detail}`,
      }),
      { status: 503, headers: { "Content-Type": "application/json" } },
    );
  }
  const outHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!STRIP_UPSTREAM_RESPONSE_HEADERS.has(key.toLowerCase())) outHeaders.set(key, value);
  });
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: outHeaders,
  });
}

/** Legacy streaming proxy (`/api/streaming/...`). */
export async function proxyRequestToDjango(
  request: Request,
  pathSegments: string[],
): Promise<Response> {
  return proxyToDjangoApi(request, ["streaming", ...pathSegments]);
}

/** Same-origin portal proxy (`/api/portal-proxy/...` → Django `/api/...`). */
export async function proxyPortalRequestToDjango(
  request: Request,
  pathSegments: string[],
): Promise<Response> {
  return proxyToDjangoApi(request, pathSegments);
}
