/** Preserve Next.js App Router history.state when patching the URL (avoids about:blank on Back). */

export function historyReplaceUrl(url: string, extraState?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const prev = (window.history.state && typeof window.history.state === "object"
    ? window.history.state
    : {}) as Record<string, unknown>;
  window.history.replaceState({ ...prev, ...extraState }, "", url);
}

export function historyPushUrl(url: string, extraState?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  const prev = (window.history.state && typeof window.history.state === "object"
    ? window.history.state
    : {}) as Record<string, unknown>;
  window.history.pushState({ ...prev, ...extraState }, "", url);
}
