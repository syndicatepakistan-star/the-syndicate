import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function countryFromHeaders(request: NextRequest): string {
  for (const key of [
    "cf-ipcountry",
    "x-vercel-ip-country",
    "cloudfront-viewer-country",
    "x-country-code",
    "x-geo-country",
  ]) {
    const raw = (request.headers.get(key) || "").trim().toUpperCase();
    if (raw && raw !== "XX" && raw !== "T1" && raw !== "UNKNOWN") return raw;
  }
  return "";
}

function clientIp(request: NextRequest): string | null {
  const forwarded = (request.headers.get("x-forwarded-for") || "").split(",")[0]?.trim();
  if (forwarded && forwarded !== "127.0.0.1" && forwarded !== "::1") return forwarded;
  const realIp = (request.headers.get("x-real-ip") || "").trim();
  if (realIp && realIp !== "127.0.0.1" && realIp !== "::1") return realIp;
  return null;
}

async function lookupCountryByIp(ip: string): Promise<string | null> {
  try {
    const res = await fetch(`https://api.country.is/${encodeURIComponent(ip)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { country?: string };
    const code = String(data.country || "").trim().toUpperCase();
    return /^[A-Z]{2}$/.test(code) ? code : null;
  } catch {
    return null;
  }
}

/** Edge/CDN country when available; otherwise public-IP lookup for real client IPs. */
export async function GET(request: NextRequest) {
  let country = countryFromHeaders(request);
  let source: "header" | "ip" | "none" = country ? "header" : "none";

  if (!country) {
    const ip = clientIp(request);
    if (ip) {
      const lookedUp = await lookupCountryByIp(ip);
      if (lookedUp) {
        country = lookedUp;
        source = "ip";
      }
    }
  }

  const currency = country === "GB" ? "gbp" : country ? "usd" : null;
  const response = NextResponse.json({
    country: country || null,
    currency: currency ?? "usd",
    source,
  });
  if (currency) {
    response.cookies.set("syndicate_currency", currency, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      sameSite: "lax",
    });
  }
  return response;
}
