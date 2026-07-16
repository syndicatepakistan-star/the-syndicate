/** Project-wide default checkout and display currency. */
export const DEFAULT_CURRENCY = "usd";

export const CURRENCY_SYMBOL = "$";

export const CURRENCY_COOKIE = "syndicate_currency";
export const UK_CITIZEN_COOKIE = "syndicate_uk_citizen";

export type CheckoutCurrency = "usd" | "gbp";

export function normalizeCurrencyCode(code?: string | null): string {
  return (code || DEFAULT_CURRENCY).trim().toLowerCase() || DEFAULT_CURRENCY;
}

export function isCheckoutCurrency(code?: string | null): code is CheckoutCurrency {
  const c = normalizeCurrencyCode(code);
  return c === "usd" || c === "gbp";
}

export function currencySymbolForCode(code?: string | null): string {
  const c = normalizeCurrencyCode(code);
  if (c === "gbp") return "£";
  if (c === "usd") return "$";
  if (c === "eur") return "€";
  return CURRENCY_SYMBOL;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds = 60 * 60 * 24 * 30) {
  if (typeof document === "undefined") return;
  const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

/** Active display/checkout currency from cookies (client) or default USD. */
export function getActiveCurrency(): CheckoutCurrency {
  const fromCookie = readCookie(CURRENCY_COOKIE);
  if (fromCookie === "gbp") return "gbp";
  if (fromCookie === "usd") return "usd";
  return DEFAULT_CURRENCY as CheckoutCurrency;
}

export function isUkPhone(phoneOrCode?: string | null): boolean {
  const raw = String(phoneOrCode ?? "").trim().replace(/[\s()-]/g, "");
  if (!raw) return false;
  if (raw === "+44" || raw === "44") return true;
  return raw.startsWith("+44") || /^0?7\d{9}$/.test(raw);
}

/** Persist UK-citizen signal (e.g. +44 phone) and force GBP for display/checkout. */
export function markUkCitizen(isUk: boolean) {
  if (typeof document === "undefined") return;
  if (isUk) {
    writeCookie(UK_CITIZEN_COOKIE, "1");
    writeCookie(CURRENCY_COOKIE, "gbp");
  } else {
    writeCookie(UK_CITIZEN_COOKIE, "0");
    // Drop citizen override; next navigation middleware restores GBP if IP is GB.
    writeCookie(CURRENCY_COOKIE, "usd");
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("syndicate-currency"));
  }
}

export function setActiveCurrency(currency: CheckoutCurrency) {
  writeCookie(CURRENCY_COOKIE, currency);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("syndicate-currency"));
  }
}

/**
 * Resolve country from the browser's public IP (works with VPN on localhost).
 * CDN geo headers are absent on local `npm run dev`.
 */
export async function detectPublicIpCountry(): Promise<string | null> {
  if (typeof window === "undefined") return null;

  const controllers: AbortController[] = [];
  const withTimeout = (ms: number) => {
    const c = new AbortController();
    controllers.push(c);
    window.setTimeout(() => c.abort(), ms);
    return c.signal;
  };

  try {
    // Primary: Cloudflare trace (returns `loc=GB`)
    const cfRes = await fetch("https://www.cloudflare.com/cdn-cgi/trace", {
      signal: withTimeout(4000),
      cache: "no-store",
    });
    if (cfRes.ok) {
      const text = await cfRes.text();
      const match = text.match(/(?:^|\n)loc=([A-Z]{2})(?:\n|$)/i);
      if (match?.[1]) return match[1].toUpperCase();
    }
  } catch {
    // fall through
  }

  try {
    const res = await fetch("https://ipapi.co/country_code/", {
      signal: withTimeout(4000),
      cache: "no-store",
    });
    if (res.ok) {
      const code = (await res.text()).trim().toUpperCase();
      if (/^[A-Z]{2}$/.test(code)) return code;
    }
  } catch {
    // ignore
  }

  return null;
}

/** Detect UK via public IP and persist currency cookie. Returns resolved currency. */
export async function resolveCurrencyFromPublicIp(): Promise<CheckoutCurrency> {
  if (readCookie(UK_CITIZEN_COOKIE) === "1") {
    setActiveCurrency("gbp");
    return "gbp";
  }
  const country = await detectPublicIpCountry();
  const next: CheckoutCurrency = country === "GB" ? "gbp" : "usd";
  setActiveCurrency(next);
  return next;
}

export function formatMoney(
  amount: number | string | null | undefined,
  options?: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    currency?: string | null;
  }
): string {
  const n = typeof amount === "number" ? amount : Number.parseFloat(String(amount ?? "0"));
  const safe = Number.isFinite(n) ? n : 0;
  const min = options?.minimumFractionDigits ?? 2;
  const max = options?.maximumFractionDigits ?? 2;
  const symbol = currencySymbolForCode(options?.currency ?? getActiveCurrency());
  return `${symbol}${safe.toLocaleString(undefined, {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  })}`;
}

/** Price badges on program cards (whole dollars when .00). */
export function formatPrice(
  amount: number | string | null | undefined,
  options?: { currency?: string | null }
): string {
  return formatMoney(amount, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    currency: options?.currency,
  });
}

/** Swap leading $ / £ / € on catalog labels to the active currency symbol. */
export function localizePriceLabel(label: string, currency?: string | null): string {
  const symbol = currencySymbolForCode(currency ?? getActiveCurrency());
  const trimmed = String(label ?? "").trim();
  if (!trimmed) return trimmed;
  return trimmed.replace(/^[\$£€]\s*/, symbol);
}
