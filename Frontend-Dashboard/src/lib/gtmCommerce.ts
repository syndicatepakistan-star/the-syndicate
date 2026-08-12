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
    google_tag_manager?: Record<string, unknown>;
  }
}

const PENDING_PURCHASES_KEY = "syndicate_gtm_pending_purchases_v1";
const FIRED_PURCHASE_PREFIX = "syndicate_gtm_purchase_fired_";

/** Avoid pushing the same purchase twice on one page (track + flush). */
const pushedThisPage = new Set<string>();

type PurchasePayload = Record<string, unknown> & {
  event: "purchase";
  purchase_transaction_id: string;
};

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

function firedKey(transactionId: string) {
  return `${FIRED_PURCHASE_PREFIX}${transactionId}`;
}

export function wasPurchaseTracked(transactionId: string): boolean {
  if (typeof window === "undefined") return false;
  const id = String(transactionId || "").trim();
  if (!id) return false;
  try {
    return window.sessionStorage.getItem(firedKey(id)) === "1";
  } catch {
    return false;
  }
}

function markPurchaseTracked(transactionId: string) {
  if (typeof window === "undefined") return;
  const id = String(transactionId || "").trim();
  if (!id) return;
  try {
    window.sessionStorage.setItem(firedKey(id), "1");
  } catch {
    // Ignore storage exceptions.
  }
}

function readPendingPurchases(): PurchasePayload[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(PENDING_PURCHASES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (row): row is PurchasePayload =>
        !!row &&
        typeof row === "object" &&
        (row as PurchasePayload).event === "purchase" &&
        typeof (row as PurchasePayload).purchase_transaction_id === "string",
    );
  } catch {
    return [];
  }
}

function writePendingPurchases(rows: PurchasePayload[]) {
  if (typeof window === "undefined") return;
  try {
    if (!rows.length) {
      window.sessionStorage.removeItem(PENDING_PURCHASES_KEY);
      return;
    }
    window.sessionStorage.setItem(PENDING_PURCHASES_KEY, JSON.stringify(rows));
  } catch {
    // Ignore storage exceptions.
  }
}

function stashPendingPurchase(payload: PurchasePayload) {
  const id = payload.purchase_transaction_id;
  const existing = readPendingPurchases().filter((row) => row.purchase_transaction_id !== id);
  existing.push(payload);
  writePendingPurchases(existing);
}

/** True when a purchase event is waiting for GTM (e.g. after fast redirect to dashboard). */
export function hasPendingPurchaseEvents(): boolean {
  return readPendingPurchases().some((row) => !wasPurchaseTracked(row.purchase_transaction_id));
}

export function isGtmScriptPresent(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (window.google_tag_manager) return true;
  return !!document.querySelector('script[src*="googletagmanager.com/gtm.js"]');
}

function pushPurchasePayload(payload: PurchasePayload) {
  const tx = payload.purchase_transaction_id;
  if (!tx || wasPurchaseTracked(tx) || pushedThisPage.has(tx)) return false;
  pushDataLayer({ ecommerce: null });
  pushDataLayer(payload);
  pushedThisPage.add(tx);
  return true;
}

/**
 * Push any stashed purchase events once GTM can receive them.
 * Idempotent per Stripe `session_id` / transaction_id.
 */
export function flushPendingPurchases(): boolean {
  if (typeof window === "undefined") return false;
  const pending = readPendingPurchases();
  if (!pending.length) return false;

  const remaining: PurchasePayload[] = [];
  let flushed = false;

  for (const payload of pending) {
    const tx = payload.purchase_transaction_id;
    if (wasPurchaseTracked(tx)) continue;

    if (pushPurchasePayload(payload)) flushed = true;

    if (isGtmScriptPresent()) {
      markPurchaseTracked(tx);
    } else {
      remaining.push(payload);
    }
  }

  writePendingPurchases(remaining);
  return flushed;
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
 * Queue + push purchase for every paid checkout (plan or playlist), even when
 * auth/claim is skipped and the user lands on dashboard immediately.
 * GTM trigger: Custom Event = `purchase`
 */
export function trackPurchase(input: {
  transaction_id: string;
  items?: GtmCheckoutItem[];
  currency?: string;
  value?: number;
}) {
  const transactionId = String(input.transaction_id || "").trim();
  if (!transactionId) return;
  if (wasPurchaseTracked(transactionId)) return;

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
  const payload: PurchasePayload = {
    event: "purchase",
    ecommerce: {
      transaction_id: transactionId,
      currency,
      value,
      items,
    },
    purchase_transaction_id: transactionId,
    purchase_value: value,
    purchase_currency: currency,
    // Same flat keys as begin_checkout so existing DLVs work for FB Purchase
    checkout_item_id: items[0]?.item_id || "",
    checkout_item_name: items[0]?.item_name || "",
    checkout_value: value,
    checkout_currency: currency,
  };

  stashPendingPurchase(payload);
  pushPurchasePayload(payload);

  if (isGtmScriptPresent()) {
    // Give tags a beat, then mark so a later dashboard flush won't double-fire.
    window.setTimeout(() => {
      markPurchaseTracked(transactionId);
      writePendingPurchases(
        readPendingPurchases().filter((row) => row.purchase_transaction_id !== transactionId),
      );
    }, 400);
  }
}

/** Wait until GTM is present (or timeout) so purchase tags can fire before redirect. */
export function waitForGtmReady(timeoutMs = 2500): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (isGtmScriptPresent()) {
    flushPendingPurchases();
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      if (isGtmScriptPresent()) {
        flushPendingPurchases();
        resolve(true);
        return;
      }
      if (Date.now() - started >= timeoutMs) {
        // Leave pending in sessionStorage for the next page (dashboard) to flush.
        resolve(false);
        return;
      }
      window.setTimeout(tick, 100);
    };
    tick();
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
