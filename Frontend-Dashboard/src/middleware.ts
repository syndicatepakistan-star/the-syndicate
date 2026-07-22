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

function countryFromRequest(request: NextRequest): string {
  const headers = request.headers;
  for (const key of [
    "cf-ipcountry",
    "x-vercel-ip-country",
    "cloudfront-viewer-country",
    "x-country-code",
    "x-geo-country",
  ]) {
    const raw = (headers.get(key) || "").trim().toUpperCase();
    if (raw && raw !== "XX" && raw !== "T1" && raw !== "UNKNOWN") return raw;
  }
  return "";
}

function applyCheckoutCurrencyCookie(request: NextRequest, response: NextResponse) {
  const ukCitizen = request.cookies.get("syndicate_uk_citizen")?.value === "1";
  const country = countryFromRequest(request);
  const ukIp = country === "GB";

  // Location first: UK IP → GBP; any other known country → USD.
  if (ukIp) {
    response.cookies.set("syndicate_currency", "gbp", {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
    return;
  }

  if (country && country !== "GB") {
    response.cookies.set("syndicate_currency", "usd", {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
    return;
  }

  // No geo header (localhost / plain Node): UK phone/citizen signal may set GBP.
  if (ukCitizen) {
    response.cookies.set("syndicate_currency", "gbp", {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
  }
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const section = (request.nextUrl.searchParams.get("section") || "").trim().toLowerCase();

  const dashboardSections = new Set([
    "dashboard",
    "programs",
    "monk",
    "resources",
    "support",
    "quickaccess",
    "settings",
  ]);

  // Fix malformed deep links: /dashboard/programs&plan=… → /dashboard/programs?plan=…
  // (legacy builders used & instead of ? after the path, which 404s as an unknown route).
  const ampInPath = pathname.indexOf("&");
  if (ampInPath > 0 && (pathname.startsWith("/dashboard/") || pathname === "/dashboard")) {
    const pathPart = pathname.slice(0, ampInPath);
    const queryPart = pathname.slice(ampInPath + 1);
    const parts = pathPart.replace(/\/+$/, "").split("/").filter(Boolean);
    const okRoot = parts.length === 1 && parts[0] === "dashboard";
    const okSection =
      parts.length === 2 && parts[0] === "dashboard" && dashboardSections.has(parts[1]);
    if ((okRoot || okSection) && queryPart) {
      const fixed = request.nextUrl.clone();
      fixed.pathname = pathPart;
      try {
        const extra = new URLSearchParams(queryPart);
        for (const [key, value] of extra.entries()) {
          fixed.searchParams.set(key, value);
        }
      } catch {
        // Fall through to normal routing if query fragment is unparseable.
      }
      const redirect = NextResponse.redirect(fixed);
      applyCheckoutCurrencyCookie(request, redirect);
      return redirect;
    }
  }

  // Clean URLs: /dashboard?section=programs → /dashboard/programs (keep other query params).
  if (pathname === "/dashboard" && dashboardSections.has(section) && section !== "dashboard") {
    const clean = request.nextUrl.clone();
    clean.pathname = `/dashboard/${section}`;
    clean.searchParams.delete("section");
    const redirect = NextResponse.redirect(clean);
    applyCheckoutCurrencyCookie(request, redirect);
    return redirect;
  }

  // Path sections rewrite onto the existing dashboard page with ?section= for the client shell.
  const pathParts = pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  if (
    pathParts[0] === "dashboard" &&
    pathParts.length === 2 &&
    dashboardSections.has(pathParts[1]) &&
    pathParts[1] !== "dashboard"
  ) {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = "/dashboard";
    rewriteUrl.searchParams.set("section", pathParts[1]);
    const rewrite = NextResponse.rewrite(rewriteUrl);
    applyCheckoutCurrencyCookie(request, rewrite);
    rewrite.headers.set("Cache-Control", "private, no-store, max-age=0");
    return rewrite;
  }

  // Legacy globe/deep links: /program/12 → public programs library card (no login).
  const programDeepLink = pathname.match(/^\/program\/(\d+)\/?$/);
  if (programDeepLink) {
    const dest = request.nextUrl.clone();
    dest.pathname = "/programs";
    dest.search = "";
    dest.searchParams.set("program", programDeepLink[1]);
    dest.hash = "programs-library";
    const redirect = NextResponse.redirect(dest);
    applyCheckoutCurrencyCookie(request, redirect);
    return redirect;
  }

  const isPublicStaticFile = /\.[a-zA-Z0-9]+$/.test(pathname);
  const authCookie = request.cookies.get("simple_auth_session")?.value;
  const hasAuthSession = authCookie === "1";
  const publicMarketingPath =
    pathname === "/" ||
    pathname === "/what-you-get" ||
    pathname.startsWith("/what-you-get/") ||
    pathname === "/our-methods" ||
    pathname.startsWith("/our-methods/") ||
    pathname === "/our-founder" ||
    pathname.startsWith("/our-founder/") ||
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
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/favicon.ico" ||
    pathname === "/manifest.webmanifest" ||
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
    const loginRedirect = NextResponse.redirect(loginUrl);
    applyCheckoutCurrencyCookie(request, loginRedirect);
    return loginRedirect;
  }

  if (!pathname.startsWith("/static/")) {
    const response = NextResponse.next();
    applyCheckoutCurrencyCookie(request, response);
    const isRscPayload =
      request.headers.get("RSC") === "1" ||
      request.headers.get("Next-Router-Prefetch") === "1" ||
      request.headers.get("Next-Router-State-Tree") != null;
    if (
      request.method === "GET" &&
      !isRscPayload &&
      !hasAuthSession &&
      publicMarketingPath &&
      !pathname.startsWith("/api/") &&
      !pathname.startsWith("/_next/")
    ) {
      response.headers.set(
        "Cache-Control",
        "public, max-age=600, s-maxage=3600, stale-while-revalidate=86400",
      );
    }
    if (hasAuthSession || protectedDashboardPath || protectedRootSectionPath) {
      response.headers.set("Cache-Control", "private, no-store, max-age=0");
    }
    return response;
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
