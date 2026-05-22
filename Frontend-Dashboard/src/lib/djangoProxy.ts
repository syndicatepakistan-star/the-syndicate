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

export async function proxyRequestToDjango(
  request: Request,
  pathSegments: string[],
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

  const subpath = pathSegments.filter(Boolean).join("/");
  const incoming = new URL(request.url);
  const target = new URL(`/api/streaming/${subpath}/`, origin);
  target.search = incoming.search;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) headers.set(key, value);
  });

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };
  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(target.toString(), init);
  const outHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) outHeaders.set(key, value);
  });
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: outHeaders,
  });
}
