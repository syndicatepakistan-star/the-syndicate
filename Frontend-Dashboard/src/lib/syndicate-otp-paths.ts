/**
 * URL prefix for the OTP + Stripe member onboarding UI.
 * Defaults to the root auth routes (`/login`, `/signup`, `/verify-otp`).
 * Set NEXT_PUBLIC_SYNDICATE_OTP_UI_BASE=/syndicate-otp if you want to keep it namespaced.
 */
export function syndicateOtpUiBase(): string {
  return (process.env.NEXT_PUBLIC_SYNDICATE_OTP_UI_BASE || "").replace(/\/$/, "");
}

export function syndicateOtpLoginHref(prefillEmail = "", next = "", diagnosisUnlock = ""): string {
  const params = new URLSearchParams();
  if (prefillEmail) params.set("email", prefillEmail);
  if (next) params.set("next", next);
  if (diagnosisUnlock) params.set("diagnosis_unlock", diagnosisUnlock);
  const q = params.toString();
  return q ? `/login?${q}` : "/login";
}

export function syndicateOtpSignupHref(prefillEmail = ""): string {
  const b = syndicateOtpUiBase();
  return prefillEmail ? `${b}/signup?email=${encodeURIComponent(prefillEmail)}` : `${b}/signup`;
}

export function syndicateOtpVerifyHref(
  email: string,
  flow: "login" | "signup",
  next = "",
  diagnosisUnlock = "",
): string {
  const b = syndicateOtpUiBase();
  const params = new URLSearchParams();
  params.set("email", email);
  params.set("flow", flow);
  if (next) params.set("next", next);
  if (diagnosisUnlock) params.set("diagnosis_unlock", diagnosisUnlock);
  return `${b}/verify-otp?${params.toString()}`;
}

/**
 * Django returns `POST_LOGIN_REDIRECT_URL` as-is (often `https://localhost:3000/`) while
 * `next dev` is `http://localhost:3000`. A cross-scheme jump drops the session cookie and
 * can load a blank page. When the redirect targets this app on the same host, keep the
 * current origin (scheme + host + port).
 *
 * After Stripe checkout on the-syndicate.com, never follow a stale `POST_LOGIN_REDIRECT_URL`
 * on another domain (e.g. syndicateofficial.com) — always land on the same host the user paid on.
 */
const DEFAULT_AFTER_AUTH = "/dashboard/programs";

export function resolvePostOtpAppRedirect(redirectFromApi: string | undefined): string {
  if (typeof window === "undefined") return DEFAULT_AFTER_AUTH;
  const origin = window.location.origin;
  const trimmed = (redirectFromApi ?? "").trim();
  if (!trimmed) return `${origin}${DEFAULT_AFTER_AUTH}`;

  try {
    const target =
      trimmed.startsWith("/") && !trimmed.startsWith("//")
        ? new URL(trimmed, origin)
        : new URL(trimmed);
    const path =
      target.pathname === "/" || target.pathname === ""
        ? DEFAULT_AFTER_AUTH
        : `${target.pathname}${target.search}${target.hash}`;
    return `${origin}${path}`;
  } catch {
    return `${origin}${DEFAULT_AFTER_AUTH}`;
  }
}
