import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Django admin and collectstatic serve assets under /static/ (e.g. /static/admin/css/base.css).
 * This Next.js app does not contain those files. If the browser requests /static/* on the
 * frontend hostname, we proxy to the Django service when configured.
 *
 * Prefer SYNDICATE_DJANGO_ORIGIN (runtime, no rebuild) e.g. https://your-backend.up.railway.app
 * Or derive origin from NEXT_PUBLIC_SYNDICATE_API_URL (…/api → strip /api).
 */
function djangoOriginFromEnv(): string | null {
  const direct = (process.env.SYNDICATE_DJANGO_ORIGIN || "").trim();
  if (direct && /^https?:\/\//i.test(direct)) {
    return direct.replace(/\/+$/, "");
  }
  const api = (process.env.NEXT_PUBLIC_SYNDICATE_API_URL || "").trim();
  if (!api || !/^https?:\/\//i.test(api)) return null;
  try {
    const u = new URL(api);
    let p = u.pathname.replace(/\/+$/, "");
    if (p.endsWith("/api")) p = p.slice(0, -4);
    return `${u.origin}${p}`.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

const sameHostHint =
  "This hostname is the Next.js frontend. Django admin CSS is served by the backend service. " +
  "In Railway, set SYNDICATE_DJANGO_ORIGIN (recommended) or NEXT_PUBLIC_SYNDICATE_API_URL to your Django URL " +
  "(e.g. https://your-django-service.up.railway.app), then redeploy if you changed NEXT_PUBLIC_*). " +
  "Or open /static/admin/css/base.css on your Django service URL directly.";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Legacy globe/deep links: /program/12 → public programs library card (no login).
  const programDeepLink = pathname.match(/^\/program\/(\d+)\/?$/);
  if (programDeepLink) {
    const dest = request.nextUrl.clone();
    dest.pathname = "/programs";
    dest.search = "";
    dest.searchParams.set("program", programDeepLink[1]);
    dest.hash = "programs-library";
    return NextResponse.redirect(dest);
  }

  const isPublicStaticFile = /\.[a-zA-Z0-9]+$/.test(pathname);
  const authCookie = request.cookies.get("simple_auth_session")?.value;
  const hasAuthSession = authCookie === "1";
  const section = (request.nextUrl.searchParams.get("section") || "").trim().toLowerCase();
  const dashboardSections = new Set(["dashboard", "programs", "monk", "resources", "support", "quickaccess", "settings"]);
  const publicMarketingPath =
    pathname === "/" ||
    pathname === "/what-you-get" ||
    pathname.startsWith("/what-you-get/") ||
    pathname === "/our-methods" ||
    pathname.startsWith("/our-methods/") ||
    pathname === "/programs" ||
    pathname.startsWith("/programs/") ||
    pathname === "/membership" ||
    pathname === "/membership/";
  const protectedMembershipAppPath =
    pathname.startsWith("/membership/content") ||
    pathname.startsWith("/membership/articles") ||
    pathname.startsWith("/membership/brief");
  const protectedDashboardPath =
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    protectedMembershipAppPath;
  const protectedRootSectionPath = pathname === "/" && dashboardSections.has(section);
  const authFreePath =
    publicMarketingPath ||
    isPublicStaticFile ||
    pathname === "/quiz" ||
    pathname.startsWith("/quiz/") ||
    pathname === "/affiliate" ||
    pathname.startsWith("/affiliate/") ||
    pathname === "/affiliate-login" ||
    pathname.startsWith("/affiliate-login/") ||
    pathname === "/affiliate-portal" ||
    pathname.startsWith("/affiliate-portal/") ||
    pathname === "/r" ||
    pathname.startsWith("/r/") ||
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/signup" ||
    pathname.startsWith("/signup/") ||
    pathname === "/verify" ||
    pathname.startsWith("/verify/") ||
    pathname === "/verify-otp" ||
    pathname.startsWith("/verify-otp/") ||
    pathname === "/checkout" ||
    pathname.startsWith("/checkout/") ||
    pathname === "/syndicate-otp" ||
    pathname.startsWith("/syndicate-otp/") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/media/") ||
    pathname.startsWith("/assets/") ||
    pathname.startsWith("/fonts/") ||
    pathname === "/icon" ||
    pathname.startsWith("/icon?") ||
    pathname === "/favicon.ico";

  if ((!hasAuthSession && (protectedDashboardPath || protectedRootSectionPath)) || (!hasAuthSession && !authFreePath && !pathname.startsWith("/static/"))) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    if (!pathname.startsWith("/api/")) {
      loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (!pathname.startsWith("/static/")) {
    return NextResponse.next();
  }

  const origin = djangoOriginFromEnv();
  const reqHost = (request.headers.get("host") || "").split(":")[0];

  if (!origin) {
    if (pathname.startsWith("/static/admin") && process.env.NODE_ENV === "production") {
      return new NextResponse(
        `Django static URL is not configured. ${sameHostHint}`,
        { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }
    return NextResponse.next();
  }

  let apiHost: string;
  try {
    apiHost = new URL(origin).host;
  } catch {
    return NextResponse.next();
  }

  if (apiHost === reqHost) {
    return new NextResponse(
      `Django static proxy is misconfigured (API/backend URL points at this same host). ${sameHostHint}`,
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }
    );
  }

  const dest = `${origin}${pathname}${request.nextUrl.search}`;
  return NextResponse.rewrite(new URL(dest));
}

export const config = {
  matcher: ["/", "/((?!_next/static|_next/image|favicon.ico).*)"]
};
