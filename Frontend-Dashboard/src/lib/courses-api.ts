import { portalFetch } from "@/lib/portal-api";

function publicApiBaseRaw(): string {
  const a = (process.env.NEXT_PUBLIC_API_BASE ?? "").trim();
  if (a) return a;
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim();
}

/**
 * Turn a Django `ImageField` URL (`/media/...` or absolute) into a browser-loadable URL.
 * When using the Next.js dev proxy (no public API base), `/media/...` stays same-origin and is rewritten.
 */
export function resolveDjangoMediaUrl(mediaPath: string | null | undefined): string | null {
  if (!mediaPath) return null;
  if (/^https?:\/\//i.test(mediaPath)) {
    try {
      const u = new URL(mediaPath);
      // Normalize local Django media URLs to same-origin path so every browser/profile
      // uses the Next.js rewrite (/media -> backend) consistently.
      if ((u.hostname === "127.0.0.1" || u.hostname === "localhost") && u.pathname.startsWith("/media/")) {
        return `${u.pathname}${u.search}`;
      }
      return mediaPath;
    } catch {
      return mediaPath;
    }
  }
  const p = mediaPath.startsWith("/") ? mediaPath : `/${mediaPath}`;
  if (typeof window === "undefined") {
    const b = (process.env.NEXT_PUBLIC_API_BASE || process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000").replace(
      /\/$/,
      ""
    );
    return `${b}${p}`;
  }
  const raw = publicApiBaseRaw();
  const useProxy = !raw || raw.toLowerCase() === "proxy";
  if (useProxy) {
    const syndicateApi = (process.env.NEXT_PUBLIC_SYNDICATE_API_URL ?? "").trim().replace(/\/+$/, "");
    const syndicateOrigin = syndicateApi.replace(/\/api\/?$/i, "");
    if (syndicateOrigin && p.startsWith("/media/")) {
      return `${syndicateOrigin}${p}`;
    }
    return p;
  }
  let base = raw.replace(/\/$/, "");
  if (base.includes(":3000") || base === window.location.origin) base = "";
  if (!base) return p;
  return `${base}${p}`;
}

/**
 * Lesson `video_url` from the API may be absolute or a site-relative path (e.g. hosted file).
 */
export function resolveLessonVideoUrl(videoUrl: string | null | undefined): string | null {
  return resolveDjangoMediaUrl(videoUrl);
}

/**
 * Use with `next/image`: the default optimizer refuses to fetch `http://127.0.0.1:8000/media/...`
 * (private IP / SSRF protection). Same-origin `/media/...` is proxied by Next to Django instead.
 */
export function djangoMediaSrcForNextImage(mediaPath: string | null | undefined): string | null {
  const resolved = resolveDjangoMediaUrl(mediaPath);
  if (!resolved) return null;
  if (resolved.startsWith("/")) return resolved;
  try {
    const u = new URL(resolved);
    if ((u.hostname === "127.0.0.1" || u.hostname === "localhost") && u.pathname.startsWith("/media/")) {
      return u.pathname + u.search;
    }
  } catch {
    /* ignore */
  }
  return resolved;
}

export type CourseDto = {
  id: number;
  title: string;
  slug: string;
  description: string;
  cover_image_url: string | null;
  is_published: boolean;
  allow_all_authenticated: boolean;
  /** From API: false when user may see the card but cannot open the LMS program (e.g. playlist-only purchase). */
  can_access?: boolean;
};

export type VideoDto = {
  id: number;
  title: string;
  description: string;
  course: number;
  video_url: string;
  thumbnail_url: string | null;
  order: number;
  status: string;
};

const BASE = "/api/courses";
const VBASE = "/api/videos";

export async function fetchCoursesList() {
  return portalFetch<CourseDto[]>(`${BASE}/`, { timeoutMs: 45_000 });
}

export async function fetchCourseVideos(courseId: number) {
  return portalFetch<VideoDto[]>(`${BASE}/${courseId}/videos/`, { timeoutMs: 45_000 });
}

export async function postVideoProgress(videoId: number, body: { position_seconds: number; completed?: boolean }) {
  return portalFetch<unknown>(`${VBASE}/${videoId}/progress/`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function createCourse(payload: {
  title: string;
  description?: string;
  is_published?: boolean;
  allow_all_authenticated?: boolean;
}) {
  return portalFetch<CourseDto>(`${BASE}/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
