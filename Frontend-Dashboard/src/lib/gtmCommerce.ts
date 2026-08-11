/** Lightweight GTM / GA4 ecommerce helpers (does not load GTM itself). */

export type GtmCheckoutItem = {
  item_id: string;
  item_name: string;
  price?: number;
  quantity?: number;
};

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function pushDataLayer(payload: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(payload);
}

function parseAmount(raw: string | number | null | undefined): number | undefined {
  if (raw == null || raw === "") return undefined;
  const n = typeof raw === "number" ? raw : Number(String(raw).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Fire before redirecting to Stripe Hosted Checkout.
 * GTM trigger: Custom Event = `begin_checkout`
 */
export function trackBeginCheckout(input: {
  items: GtmCheckoutItem[];
  currency?: string;
  value?: number;
}) {
  const items = input.items
    .map((it) => ({
      item_id: String(it.item_id || "").trim(),
      item_name: String(it.item_name || it.item_id || "Program").trim(),
      price: it.price,
      quantity: it.quantity ?? 1,
    }))
    .filter((it) => it.item_id || it.item_name);
  const value =
    input.value ??
    items.reduce((sum, it) => sum + (typeof it.price === "number" ? it.price : 0) * (it.quantity ?? 1), 0);

  pushDataLayer({ ecommerce: null });
  pushDataLayer({
    event: "begin_checkout",
    ecommerce: {
      currency: (input.currency || "USD").toUpperCase(),
      value,
      items,
    },
    // Flat copies for simple GTM Data Layer Variables
    checkout_item_id: items[0]?.item_id || "",
    checkout_item_name: items[0]?.item_name || "",
    checkout_value: value,
    checkout_currency: (input.currency || "USD").toUpperCase(),
  });
}

/**
 * Fire on /checkout/success after payment is confirmed on your domain.
 * GTM trigger: Custom Event = `purchase` (or Page View /checkout/success)
 */
export function trackPurchase(input: {
  transaction_id: string;
  items?: GtmCheckoutItem[];
  currency?: string;
  value?: number;
}) {
  const items = (input.items || []).map((it) => ({
    item_id: String(it.item_id || "").trim(),
    item_name: String(it.item_name || it.item_id || "Program").trim(),
    price: it.price,
    quantity: it.quantity ?? 1,
  }));
  const value =
    input.value ??
    items.reduce((sum, it) => sum + (typeof it.price === "number" ? it.price : 0) * (it.quantity ?? 1), 0);

  const currency = (input.currency || "USD").toUpperCase();
  pushDataLayer({ ecommerce: null });
  pushDataLayer({
    event: "purchase",
    ecommerce: {
      transaction_id: input.transaction_id,
      currency,
      value,
      items,
    },
    purchase_transaction_id: input.transaction_id,
    purchase_value: value,
    purchase_currency: currency,
    // Same flat keys as begin_checkout so existing DLVs work for FB Purchase
    checkout_item_id: items[0]?.item_id || "",
    checkout_item_name: items[0]?.item_name || "",
    checkout_value: value,
    checkout_currency: currency,
  });
}

/** Push begin_checkout then leave to Stripe (small delay so GTM can catch the event). */
export function redirectToStripeCheckout(
  checkoutUrl: string,
  meta?: {
    itemId?: string;
    itemName?: string;
    amount?: string | number;
    currency?: string;
    items?: GtmCheckoutItem[];
  },
) {
  if (typeof window === "undefined") return;
  const price = parseAmount(meta?.amount);
  const items: GtmCheckoutItem[] =
    meta?.items && meta.items.length
      ? meta.items
      : [
          {
            item_id: meta?.itemId || "unknown",
            item_name: meta?.itemName || meta?.itemId || "Program",
            price,
            quantity: 1,
          },
        ];
  trackBeginCheckout({
    items,
    currency: meta?.currency,
    value: price,
  });
  // Give Tag Assistant / GA4 a beat to receive the event before unload.
  window.setTimeout(() => {
    window.location.href = checkoutUrl;
  }, 120);
}
