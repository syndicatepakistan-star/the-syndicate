"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CURRENCY_COOKIE,
  formatPrice as formatPriceBase,
  getActiveCurrency,
  isUkPhone,
  localizePriceLabel,
  markUkCitizen,
  resolveCurrencyFromPublicIp,
  type CheckoutCurrency,
} from "@/lib/currency";

type CurrencyContextValue = {
  currency: CheckoutCurrency;
  symbol: string;
  formatPrice: (amount: number | string | null | undefined) => string;
  localizeLabel: (label: string) => string;
  /** Call when the user selects/enters a UK (+44) phone — treats them as UK citizen. */
  applyPhoneCountry: (phoneOrCountryCode: string) => void;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function readCurrencyFromDocument(): CheckoutCurrency {
  return getActiveCurrency();
}

export function CurrencyProvider({
  children,
  initialCurrency = "usd",
}: {
  children: ReactNode;
  initialCurrency?: CheckoutCurrency;
}) {
  const [currency, setCurrency] = useState<CheckoutCurrency>(initialCurrency);

  useEffect(() => {
    setCurrency(readCurrencyFromDocument());
    const sync = () => setCurrency(readCurrencyFromDocument());
    window.addEventListener("syndicate-currency", sync);
    window.addEventListener("focus", sync);
    return () => {
      window.removeEventListener("syndicate-currency", sync);
      window.removeEventListener("focus", sync);
    };
  }, []);

  // Localhost / no CDN geo headers: detect country from the browser public IP (VPN-aware).
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const resolved = await resolveCurrencyFromPublicIp();
        if (!cancelled) setCurrency(resolved);
      } catch {
        // Keep cookie / initial currency.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyPhoneCountry = useCallback((phoneOrCountryCode: string) => {
    if (isUkPhone(phoneOrCountryCode)) {
      markUkCitizen(true);
      setCurrency("gbp");
    } else {
      markUkCitizen(false);
      setCurrency("usd");
    }
  }, []);

  const value = useMemo<CurrencyContextValue>(() => {
    const symbol = currency === "gbp" ? "£" : "$";
    return {
      currency,
      symbol,
      formatPrice: (amount) => formatPriceBase(amount, { currency }),
      localizeLabel: (label) => localizePriceLabel(label, currency),
      applyPhoneCountry,
    };
  }, [currency, applyPhoneCountry]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (ctx) return ctx;
  // Fallback when used outside provider (SSR-safe defaults)
  const currency = typeof document !== "undefined" ? getActiveCurrency() : "usd";
  return {
    currency,
    symbol: currency === "gbp" ? "£" : "$",
    formatPrice: (amount) => formatPriceBase(amount, { currency }),
    localizeLabel: (label) => localizePriceLabel(label, currency),
    applyPhoneCountry: (phoneOrCountryCode) => {
      if (isUkPhone(phoneOrCountryCode)) markUkCitizen(true);
      else markUkCitizen(false);
    },
  };
}

export function currencyCookieName() {
  return CURRENCY_COOKIE;
}
