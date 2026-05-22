/**
 * Resolve Django backend origin at runtime (Railway env), not only at next.config build time.
 */
export function resolveDjangoBackendOrigin(): string {
  const candidates = [
    process.env.BACKEND_INTERNAL_URL,
    process.env.SYNDICATE_DJANGO_ORIGIN,
    process.env.DJANGO_API_BASE,
    process.env.NEXT_PUBLIC_API_BASE_URL,
    process.env.NEXT_PUBLIC_API_BASE,
    process.env.NEXT_PUBLIC_SYNDICATE_API_URL,
  ]
    .map((v) => (v || "").trim())
    .filter(Boolean);

  for (const raw of candidates) {
    try {
      const u = new URL(raw);
      const path = u.pathname.replace(/\/+$/, "");
      if (path.endsWith("/api")) return u.origin;
      return `${u.origin}${path}`.replace(/\/+$/, "");
    } catch {
      // skip invalid
    }
  }
  return "";
}

export function djangoStreamingApiUrl(pathAfterStreaming: string): string {
  const origin = resolveDjangoBackendOrigin();
  const segment = pathAfterStreaming.replace(/^\/+/, "").replace(/\/+$/, "");
  if (!origin) return "";
  return `${origin}/api/streaming/${segment}/`;
}
