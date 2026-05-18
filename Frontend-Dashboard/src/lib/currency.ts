/** Project-wide default checkout and display currency. */
export const DEFAULT_CURRENCY = "usd";

export const CURRENCY_SYMBOL = "$";

export function formatMoney(
  amount: number | string | null | undefined,
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
): string {
  const n = typeof amount === "number" ? amount : Number.parseFloat(String(amount ?? "0"));
  const safe = Number.isFinite(n) ? n : 0;
  const min = options?.minimumFractionDigits ?? 2;
  const max = options?.maximumFractionDigits ?? 2;
  return `${CURRENCY_SYMBOL}${safe.toLocaleString(undefined, {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
  })}`;
}

/** Price badges on program cards (whole dollars when .00). */
export function formatPrice(amount: number | string | null | undefined): string {
  return formatMoney(amount, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function normalizeCurrencyCode(code?: string | null): string {
  return (code || DEFAULT_CURRENCY).trim().toLowerCase() || DEFAULT_CURRENCY;
}

export function currencySymbolForCode(code?: string | null): string {
  const c = normalizeCurrencyCode(code);
  if (c === "gbp") return "£";
  if (c === "usd") return "$";
  if (c === "eur") return "€";
  return CURRENCY_SYMBOL;
}
